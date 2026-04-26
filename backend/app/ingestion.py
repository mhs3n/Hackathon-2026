"""KPI ingestion pipeline.

Adapted from a multi-format OCR pipeline (Excel / CSV / digital PDF /
scanned PDF / image). For the hackathon scope we ship the lightweight
extractors as required dependencies (pdfplumber / openpyxl / pandas) and
make heavy OCR dependencies (easyocr / opencv / pytesseract) optional
with graceful fallbacks.

Pipeline steps:
1. detect_file_type(path) -> 'excel' | 'csv' | 'pdf_digital' | 'pdf_scanned' | 'image'
2. extract_text(path, ftype) -> str (or DataFrame for excel/csv)
3. extract_kpis_regex(text) -> dict[str, float | None]   (French source format)
4. map_to_ucar_kpis(raw) -> dict matching our DB columns
5. validate(raw, institution_id) -> IngestionPreview
6. commit(db, preview) -> writes to AcademicKpi / FinanceKpi / EsgKpi for the current period
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import AcademicKpi, EsgKpi, FinanceKpi, ImportBatch, Institution

logger = logging.getLogger(__name__)

CURRENT_PERIOD_ID = "rp_2026_s2"


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# 1. File-type detection
# ---------------------------------------------------------------------------

EXT_MAP = {
    ".pdf": "pdf",
    ".png": "image", ".jpg": "image", ".jpeg": "image", ".tiff": "image",
    ".xlsx": "excel", ".xls": "excel",
    ".csv": "csv",
}


def detect_file_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    ftype = EXT_MAP.get(ext, "unknown")
    if ftype == "pdf":
        try:
            import pdfplumber
            with pdfplumber.open(path) as pdf:
                text = "".join(p.extract_text() or "" for p in pdf.pages[:2])
            ftype = "pdf_scanned" if len(text.strip()) < 50 else "pdf_digital"
        except Exception:
            ftype = "pdf_digital"
    return ftype


# ---------------------------------------------------------------------------
# 2. Extractors
# ---------------------------------------------------------------------------

def extract_from_pdf(path: str) -> str:
    import pdfplumber
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""
            for table in (page.extract_tables() or []):
                for row in table:
                    clean = [str(c).strip() if c else "" for c in row]
                    if len(clean) == 2:
                        page_text += f"\n{clean[0]} : {clean[1]}"
                    else:
                        page_text += "\n" + " | ".join(clean)
            text += page_text + "\n"
    return text


def extract_from_image(path: str) -> str:
    """Run OCR via easyocr if available; otherwise raise an informative error."""
    try:
        import cv2
        import easyocr  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "Image OCR requires `easyocr` and `opencv-python-headless`. "
            "Install them in the backend venv to enable scanned-image ingestion."
        ) from exc

    import easyocr
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    scaled = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    reader = easyocr.Reader(["fr", "en"], gpu=False)
    results = reader.readtext(scaled, detail=1)
    results.sort(key=lambda r: (round(r[0][0][1] / 15) * 15, r[0][0][0]))
    raw = "\n".join(r[1] for r in results)
    raw = re.sub(r"[''`´]", "'", raw)
    raw = re.sub(r"(\d)\s*[.,]\s*(\d)", r"\1.\2", raw)
    raw = re.sub(r"[ \t]+", " ", raw)
    return raw


def extract_from_scanned_pdf(path: str) -> str:
    try:
        import fitz  # type: ignore
        import easyocr  # noqa: F401
        import cv2  # noqa: F401
    except ImportError as exc:
        raise RuntimeError(
            "Scanned PDFs need `pymupdf`, `easyocr`, and `opencv-python-headless`."
        ) from exc

    import fitz
    import io
    import numpy as np
    from PIL import Image

    doc = fitz.open(path)
    full = ""
    for i, page in enumerate(doc):
        mat = fitz.Matrix(2.5, 2.5)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        # Run easyocr on the rendered page
        import easyocr, cv2  # noqa: F811
        arr = np.array(img)
        if len(arr.shape) == 2:
            arr = cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        reader = easyocr.Reader(["fr", "en"], gpu=False)
        results = reader.readtext(arr, detail=1)
        results.sort(key=lambda r: (round(r[0][0][1] / 15) * 15, r[0][0][0]))
        full += "\n".join(r[1] for r in results) + "\n"
    return full


def extract_from_excel(path: str) -> pd.DataFrame:
    """Return the first sheet as a DataFrame."""
    return pd.read_excel(path, sheet_name=0)


def extract_from_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


# ---------------------------------------------------------------------------
# 3. Regex KPI extraction (French keys, OCR-resilient)
# ---------------------------------------------------------------------------

def normalize_for_regex(text: str) -> str:
    t = text.lower()
    t = t.replace("œ", "e").replace("æ", "e")
    t = re.sub(r"[''`´]", "'", t)
    t = re.sub(r"\b51\b", "s1", t)
    t = re.sub(r"\b52\b", "s2", t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"(\d)\s*\.\s*(\d)", r"\1.\2", t)
    t = re.sub(r"\b([1-9]\d)(\d)\s*%", r"\1.\2%", t)
    t = re.sub(r"\b(\d{2})(\d{2})\s*\n\s*20\b", r"\1.\2 / 20", t)
    t = re.sub(r"(\d{1,2}[.,]\d{1,2})\s*\n\s*20\b", r"\1 / 20", t)
    t = re.sub(r"([a-rt-z%])(\d)", r"\1 \2", t)
    t = re.sub(r"(s)([3-9])", r"\1 \2", t)
    t = re.sub(r"(\d{1,3})([ ,])(\d{3})([ ,])(\d{3})", r"\1\3\5", t)
    t = re.sub(r"(\d{1,3})([ ,])(\d{3})(?!\d)", r"\1\3", t)
    t = re.sub(r"[\u0600-\u06FF]+", " ", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t


KPI_PATTERNS: dict[str, list[str]] = {
    "taux_reussite": [
        r"taux\s+de\s+r[eé]ussite\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"r[eé]ussite\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"admis\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%",
        r"taux\s+de\s+.{0,3}ussite\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
    ],
    "taux_presence_s1": [
        r"taux\s+de\s+pr[eé]s[eé]?n\w*\s+s1\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"pr[eé]s[eé]?n\w*\s+s1\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"taux\w*\s+pr[eé]s\w*\s+s1\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)",
    ],
    "taux_presence_s2": [
        r"taux\s+de\s+pr[eé]s[eé]?n\w*\s+s2\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"pr[eé]s[eé]?n\w*\s+s2\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"taux\w*\s+pr[eé]s\w*\s+s2\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)",
    ],
    "taux_abandon": [
        r"taux\s*d['\s]?abandon\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"abandon\w*\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
    ],
    "taux_redoublement": [
        r"taux\s+de\s+redoublement\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
        r"redoublement\s*[:\-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*%?",
    ],
    "moyenne_generale": [
        r"moyenne\s+g[eé]n[eé]rale\s*[:\-]?\s*([0-9]{1,2}(?:[.,][0-9]+)?)\s*(?:/\s*20)?",
        r"moyenne\s*g[eé]n?\w*\s*[:\-]?\s*([0-9]{1,2}(?:[.,][0-9]+)?)",
    ],
    "budget_alloue": [
        r"budget\s+allou[eé]\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"budget\s*alloue?\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "budget_consomme": [
        r"budget\s+consomm[eé]\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"budget\w*somm\w*\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "cout_par_etudiant": [
        r"co[uû]t\s+par\s+[eé]tudiant\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"cout\w*\s+[eé]tud\w*\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "consommation_energie": [
        r"consommation\s+[eé]nergie\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"consomm\w*[eé]nerg\w*\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"[eé]nergie\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
    "empreinte_carbone": [
        r"empreinte\s+carbone\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"empr\w*\s+carb\w*\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
        r"carbone\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?)",
    ],
}

PCT_KPIS = {"taux_reussite", "taux_presence_s1", "taux_presence_s2", "taux_abandon", "taux_redoublement"}


def extract_kpis_regex(text: str) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    tl = normalize_for_regex(text)
    for key, patterns in KPI_PATTERNS.items():
        found: float | None = None
        for p in patterns:
            m = re.search(p, tl, re.IGNORECASE | re.MULTILINE)
            if not m:
                continue
            try:
                raw = m.group(1).strip().replace(" ", "").replace(",", ".")
                val = float(raw)
                if key in PCT_KPIS and val > 100:
                    continue
                if key == "moyenne_generale" and val > 20:
                    continue
                found = val
                break
            except ValueError:
                continue
        out[key] = found
    return out


# ---------------------------------------------------------------------------
# 4. Aggregate KPIs from a student-level DataFrame (Excel/CSV path)
# ---------------------------------------------------------------------------

def extract_kpis_dataframe(df: pd.DataFrame) -> dict[str, float | None]:
    out: dict[str, float | None] = {k: None for k in KPI_PATTERNS}
    cols_lower = {c.lower(): c for c in df.columns}

    def find_col(*keywords: str) -> str | None:
        for kw in keywords:
            for cl, co in cols_lower.items():
                if kw in cl:
                    return co
        return None

    res_col = find_col("resultat", "outcome", "result")
    if res_col:
        out["taux_reussite"] = round(
            df[res_col].astype(str).str.lower().isin(["admis", "passed"]).sum() / len(df) * 100, 1
        )

    red_col = find_col("redoublement", "repeat")
    if red_col:
        out["taux_redoublement"] = round(
            (df[red_col].astype(str).str.lower() == "oui").sum() / len(df) * 100, 1
        )

    for sem in ["s1", "s2"]:
        abs_col = find_col(f"absences {sem}")
        tot_col = find_col(f"seances totales {sem}", f"total {sem}")
        if abs_col and tot_col:
            try:
                pres = (df[tot_col] - df[abs_col]) / df[tot_col] * 100
                out[f"taux_presence_{sem}"] = round(float(pres.mean()), 1)
            except Exception:
                pass

    avg_col = find_col("moyenne generale", "moyenne gen")
    if avg_col:
        try:
            out["moyenne_generale"] = round(float(df[avg_col].mean()), 2)
        except Exception:
            pass

    return out


# ---------------------------------------------------------------------------
# 5. Map French KPIs → our UCAR DB columns
# ---------------------------------------------------------------------------

@dataclass
class IngestionPreview:
    institution_id: str
    institution_name: str
    source_file: str
    file_type: str
    raw_kpis: dict[str, float | None]      # French keys
    mapped: dict[str, dict[str, float]]     # { 'academic': {...}, 'finance': {...}, 'esg': {...} }
    alerts: list[str]
    warnings: list[str]


def map_to_ucar_kpis(raw: dict[str, float | None]) -> dict[str, dict[str, float]]:
    """Map French source keys to our domain-typed UCAR fields. None values are skipped."""
    academic: dict[str, float] = {}
    finance: dict[str, float] = {}
    esg: dict[str, float] = {}

    if raw.get("taux_reussite") is not None:
        academic["success_rate"] = float(raw["taux_reussite"])
    if raw.get("taux_abandon") is not None:
        academic["abandonment_rate"] = float(raw["taux_abandon"])
    if raw.get("taux_redoublement") is not None:
        academic["repetition_rate"] = float(raw["taux_redoublement"])

    pres = [v for k in ("taux_presence_s1", "taux_presence_s2") if (v := raw.get(k)) is not None]
    if pres:
        academic["attendance_rate"] = round(sum(pres) / len(pres), 1)
        academic["dropout_rate"] = round(100 - academic["attendance_rate"], 1) if academic.get("attendance_rate") else 0

    if raw.get("budget_alloue") is not None:
        finance["budget_allocated"] = float(raw["budget_alloue"])
    if raw.get("budget_consomme") is not None:
        finance["budget_consumed"] = float(raw["budget_consomme"])
    if raw.get("cout_par_etudiant") is not None:
        finance["cost_per_student"] = float(raw["cout_par_etudiant"])

    if raw.get("consommation_energie") is not None:
        # Source is in kWh; we store as a 0-100 index. Keep raw value scaled by /3000 (institution-typical).
        esg["energy_consumption_index"] = round(min(100.0, float(raw["consommation_energie"]) / 3000), 1)
    if raw.get("empreinte_carbone") is not None:
        esg["carbon_footprint_index"] = round(min(100.0, float(raw["empreinte_carbone"]) / 1000), 1)

    return {"academic": academic, "finance": finance, "esg": esg}


def check_alerts(raw: dict[str, float | None]) -> list[str]:
    alerts: list[str] = []
    if (v := raw.get("taux_reussite")) is not None and v < 50:
        alerts.append(f"🔴 CRITICAL — Success rate: {v}% (threshold 50%)")
    if (v := raw.get("taux_redoublement")) is not None and v > 20:
        alerts.append(f"🟠 ALERT — Repetition rate high: {v}%")
    if (v := raw.get("moyenne_generale")) is not None and v < 10:
        alerts.append(f"🔴 CRITICAL — General average: {v}/20")
    if (v := raw.get("taux_presence_s1")) is not None and v < 75:
        alerts.append(f"🟠 ALERT — Attendance S1 low: {v}%")
    if (v := raw.get("taux_presence_s2")) is not None and v < 75:
        alerts.append(f"🟠 ALERT — Attendance S2 low: {v}%")
    return alerts


# ---------------------------------------------------------------------------
# 6. Pipeline entrypoints
# ---------------------------------------------------------------------------

def run_preview(file_path: str, file_name: str, institution: Institution) -> IngestionPreview:
    ftype = detect_file_type(file_path)
    warnings: list[str] = []
    raw_kpis: dict[str, float | None] = {k: None for k in KPI_PATTERNS}

    try:
        if ftype == "pdf_digital":
            text = extract_from_pdf(file_path)
            raw_kpis = extract_kpis_regex(text)
        elif ftype == "pdf_scanned":
            text = extract_from_scanned_pdf(file_path)
            raw_kpis = extract_kpis_regex(text)
        elif ftype == "image":
            text = extract_from_image(file_path)
            raw_kpis = extract_kpis_regex(text)
        elif ftype == "excel":
            df = extract_from_excel(file_path)
            raw_kpis = extract_kpis_dataframe(df)
            # If aggregation produced nothing, fall back to text-style scanning of cell values
            if all(v is None for v in raw_kpis.values()):
                raw_kpis = extract_kpis_regex(df.to_string(index=False))
        elif ftype == "csv":
            df = extract_from_csv(file_path)
            raw_kpis = extract_kpis_dataframe(df)
            if all(v is None for v in raw_kpis.values()):
                raw_kpis = extract_kpis_regex(df.to_string(index=False))
        else:
            warnings.append(f"Unsupported file type: {ftype}")
    except RuntimeError as exc:
        warnings.append(str(exc))
    except Exception as exc:  # noqa: BLE001
        logger.exception("Extraction failed")
        warnings.append(f"Extraction error: {exc}")

    mapped = map_to_ucar_kpis(raw_kpis)
    alerts = check_alerts(raw_kpis)

    if all(not v for v in mapped.values()):
        warnings.append("No KPIs could be extracted. Check that the document includes labeled values like 'Taux de réussite : 75%'.")

    return IngestionPreview(
        institution_id=institution.id,
        institution_name=institution.name,
        source_file=file_name,
        file_type=ftype,
        raw_kpis=raw_kpis,
        mapped=mapped,
        alerts=alerts,
        warnings=warnings,
    )


def commit_preview(
    db: Session,
    institution_id: str,
    mapped: dict[str, dict[str, float]],
    period_id: str = CURRENT_PERIOD_ID,
    *,
    user_id: str | None = None,
    source_file: str = "manual",
    file_type: str = "manual",
    raw_kpis: dict[str, float | None] | None = None,
) -> dict[str, Any]:
    """Upsert KPI rows for the given institution + reporting period.

    Sets `created_at` on insert and always refreshes `updated_at`. Records the
    operation in `import_batches` for the audit trail.
    """
    inst = db.execute(select(Institution).where(Institution.id == institution_id)).scalar_one_or_none()
    if not inst:
        raise ValueError(f"Unknown institution_id: {institution_id}")

    now = _now_iso()
    written: dict[str, list[str]] = {"academic": [], "finance": [], "esg": []}

    if mapped.get("academic"):
        row = db.execute(
            select(AcademicKpi).where(
                AcademicKpi.institution_id == institution_id,
                AcademicKpi.reporting_period_id == period_id,
            )
        ).scalar_one_or_none()
        if not row:
            row = AcademicKpi(
                id=f"ak_{institution_id}_{period_id}",
                institution_id=institution_id,
                reporting_period_id=period_id,
                success_rate=0, attendance_rate=0, dropout_rate=0,
                abandonment_rate=0, repetition_rate=0,
                created_at=now, updated_at=now,
            )
            db.add(row)
        for k, v in mapped["academic"].items():
            setattr(row, k, v)
            written["academic"].append(k)
        row.updated_at = now

    if mapped.get("finance"):
        row = db.execute(
            select(FinanceKpi).where(
                FinanceKpi.institution_id == institution_id,
                FinanceKpi.reporting_period_id == period_id,
            )
        ).scalar_one_or_none()
        if not row:
            row = FinanceKpi(
                id=f"fk_{institution_id}_{period_id}",
                institution_id=institution_id,
                reporting_period_id=period_id,
                budget_allocated=0, budget_consumed=0, cost_per_student=0,
                created_at=now, updated_at=now,
            )
            db.add(row)
        for k, v in mapped["finance"].items():
            setattr(row, k, v)
            written["finance"].append(k)
        row.updated_at = now

    if mapped.get("esg"):
        row = db.execute(
            select(EsgKpi).where(
                EsgKpi.institution_id == institution_id,
                EsgKpi.reporting_period_id == period_id,
            )
        ).scalar_one_or_none()
        if not row:
            row = EsgKpi(
                id=f"ek_{institution_id}_{period_id}",
                institution_id=institution_id,
                reporting_period_id=period_id,
                energy_consumption_index=0, carbon_footprint_index=0,
                recycling_rate=0, mobility_index=0,
                created_at=now, updated_at=now,
            )
            db.add(row)
        for k, v in mapped["esg"].items():
            setattr(row, k, v)
            written["esg"].append(k)
        row.updated_at = now

    # Audit trail
    batch_id = f"ib_{uuid.uuid4().hex[:12]}"
    db.add(ImportBatch(
        id=batch_id,
        institution_id=institution_id,
        reporting_period_id=period_id,
        user_id=user_id,
        source_file=source_file,
        file_type=file_type,
        domains_written=json.dumps(written),
        raw_kpis=json.dumps(raw_kpis) if raw_kpis is not None else None,
        imported_at=now,
    ))

    db.commit()
    return {
        "institutionId": institution_id,
        "periodId": period_id,
        "written": written,
        "batchId": batch_id,
        "importedAt": now,
    }
