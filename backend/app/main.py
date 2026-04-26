from __future__ import annotations

from contextlib import asynccontextmanager

import os
import shutil
import tempfile

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .bootstrap import bootstrap_database
from .chat import chat_reply, quick_actions_for_role
from .db import get_db
from .deps import get_current_user, require_role
from .ingestion import CURRENT_PERIOD_ID, commit_preview, run_preview
from .models import AppUser, ImportBatch, Institution, ReportingPeriod
from .schemas import (
    AuthLoginRequest,
    AuthLoginResponse,
    ChatRequest,
    ChatResponse,
    ImportBatchRecord,
    IngestionCommitRequest,
    IngestionCommitResponse,
    IngestionPreviewResponse,
    InstitutionDashboardView,
    ReportingPeriodRecord,
    StudentSnapshot,
    UcarDashboardView,
    UcarReportResponse,
)
from .services import (
    build_auth_response,
    get_institution_dashboard,
    get_kpi_history,
    get_student_dashboard,
    get_ucar_dashboard,
    get_ucar_report,
)
from .settings import settings

DEMO_ACCOUNT_PASSWORD = "123456"
DEMO_ACCOUNT_EMAILS = {
    "owner@ucar.tn",
    "insat@ucar.tn",
    "takwa.bouheni@enstab.ucar.tn",
}


@asynccontextmanager
async def lifespan(_: FastAPI):
    bootstrap_database()
    yield


app = FastAPI(title="UCAR Insight API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/login", response_model=AuthLoginResponse)
def login(payload: AuthLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if email not in DEMO_ACCOUNT_EMAILS or payload.password != DEMO_ACCOUNT_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = db.execute(select(AppUser).where(AppUser.email == email)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Demo account is not seeded")

    return build_auth_response(db, user)


@app.get("/dashboard/ucar", response_model=UcarDashboardView)
def ucar_dashboard(
    period_id: str = CURRENT_PERIOD_ID,
    _: AppUser = Depends(require_role("ucar_admin")),
    db: Session = Depends(get_db),
):
    return get_ucar_dashboard(db, period_id=period_id)


@app.get("/dashboard/institution/{institution_id}", response_model=InstitutionDashboardView)
def institution_dashboard(
    institution_id: str,
    period_id: str = CURRENT_PERIOD_ID,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_institution_dashboard(db, institution_id, current_user, period_id=period_id)


@app.get("/dashboard/student/{student_profile_id}", response_model=StudentSnapshot)
def student_dashboard(
    student_profile_id: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_student_dashboard(db, student_profile_id, current_user)


@app.get("/history/{institution_id}/{domain}")
def kpi_history(
    institution_id: str,
    domain: str,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return time-series + AI forecast for a KPI domain on a single institution."""
    return get_kpi_history(db, institution_id, domain, current_user)


@app.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Role-aware Gemini chat grounded in live UCAR KPI data."""
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        reply = chat_reply(
            db,
            current_user,
            payload.message,
            history=[m.model_dump() for m in payload.history],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    return ChatResponse(
        reply=reply,
        quickActions=quick_actions_for_role(current_user.role),
    )


@app.get("/chat/quick-actions", response_model=list[str])
def chat_quick_actions(current_user: AppUser = Depends(get_current_user)):
    return quick_actions_for_role(current_user.role)


@app.get("/reports/ucar", response_model=UcarReportResponse)
def ucar_report(
    start_period_id: str,
    end_period_id: str,
    institution_ids: list[str] | None = Query(default=None),
    _: AppUser = Depends(require_role("ucar_admin")),
    db: Session = Depends(get_db),
):
    """Generate a UCAR-level KPI report for selected institutions and periods."""
    return get_ucar_report(
        db,
        start_period_id=start_period_id,
        end_period_id=end_period_id,
        institution_ids=institution_ids,
    )


def _ensure_can_import(user: AppUser, institution_id: str, db: Session) -> Institution:
    if user.role not in ("ucar_admin", "institution_admin"):
        raise HTTPException(status_code=403, detail="Only admins can import KPI data")
    if user.role == "institution_admin" and user.institution_id != institution_id:
        raise HTTPException(status_code=403, detail="You may only import data for your own institution")
    inst = db.execute(select(Institution).where(Institution.id == institution_id)).scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail=f"Institution not found: {institution_id}")
    return inst


@app.post("/import/preview", response_model=IngestionPreviewResponse)
async def import_preview(
    institution_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a KPI file (Excel/CSV/PDF/image) and preview extracted KPIs.

    Does NOT write to the database — call /import/commit to apply the values.
    """
    inst = _ensure_can_import(current_user, institution_id, db)

    suffix = os.path.splitext(file.filename or "upload")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        preview = run_preview(tmp_path, file.filename or "upload", inst)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return IngestionPreviewResponse(
        institutionId=preview.institution_id,
        institutionName=preview.institution_name,
        sourceFile=preview.source_file,
        fileType=preview.file_type,
        rawKpis=preview.raw_kpis,
        mapped=preview.mapped,
        alerts=preview.alerts,
        warnings=preview.warnings,
    )


@app.post("/import/commit", response_model=IngestionCommitResponse)
def import_commit(
    payload: IngestionCommitRequest,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Apply previewed KPIs to the database for the requested reporting period."""
    _ensure_can_import(current_user, payload.institutionId, db)

    period_id = payload.periodId or CURRENT_PERIOD_ID
    period_exists = db.execute(
        select(ReportingPeriod).where(ReportingPeriod.id == period_id)
    ).scalar_one_or_none()
    if not period_exists:
        raise HTTPException(status_code=400, detail=f"Unknown reporting period: {period_id}")

    result = commit_preview(
        db,
        payload.institutionId,
        payload.mapped,
        period_id=period_id,
        user_id=current_user.id,
        source_file=payload.sourceFile or "manual",
        file_type=payload.fileType or "manual",
        raw_kpis=payload.rawKpis,
    )
    return IngestionCommitResponse(**result)


@app.get("/periods", response_model=list[ReportingPeriodRecord])
def list_periods(
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all reporting periods (oldest → newest)."""
    rows = db.execute(select(ReportingPeriod).order_by(ReportingPeriod.year, ReportingPeriod.semester)).scalars().all()
    return [
        ReportingPeriodRecord(
            id=r.id,
            label=r.label,
            year=r.year,
            semester=r.semester,
            startsOn=r.starts_on,
            endsOn=r.ends_on,
        )
        for r in rows
    ]


@app.get("/import/history", response_model=list[ImportBatchRecord])
def import_history(
    institution_id: str | None = None,
    limit: int = 25,
    current_user: AppUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recent import batches. Institution admins are scoped to their own institution."""
    import json as _json

    if current_user.role == "student":
        raise HTTPException(status_code=403, detail="Students cannot view the import audit log")
    if current_user.role == "institution_admin":
        institution_id = current_user.institution_id

    stmt = select(ImportBatch).order_by(ImportBatch.imported_at.desc()).limit(limit)
    if institution_id:
        stmt = select(ImportBatch).where(ImportBatch.institution_id == institution_id).order_by(ImportBatch.imported_at.desc()).limit(limit)

    rows = db.execute(stmt).scalars().all()
    return [
        ImportBatchRecord(
            id=r.id,
            institutionId=r.institution_id,
            reportingPeriodId=r.reporting_period_id,
            userId=r.user_id,
            sourceFile=r.source_file,
            fileType=r.file_type,
            domainsWritten=_json.loads(r.domains_written),
            importedAt=r.imported_at,
        )
        for r in rows
    ]
