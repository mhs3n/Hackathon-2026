"""Gemini chatbot grounded in live UCAR data.

Architecture:
- One chatbot, role-aware. The system prompt and pre-fetched context are
  scoped to what the logged-in user is allowed to see (UCAR admin sees all
  institutions, institution_admin sees only their institution, student sees
  only their own data).
- "Structured RAG": instead of vector embeddings, we query SQL for the
  exact rows relevant to the user and serialize them into the prompt as
  compact JSON. This gives deterministic, hallucination-free answers on
  numeric data.
- No vector DB to maintain.
"""

from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types as genai_types
from sqlalchemy import select
from sqlalchemy.orm import Session

from .ai import compute_institution_risk, compute_student_risk, detect_anomalies, forecast_next
from .models import (
    AcademicKpi,
    AppUser,
    FinanceKpi,
    HrKpi,
    InfrastructureKpi,
    InsertionKpi,
    Institution,
    PartnershipKpi,
    Recommendation,
    ResearchKpi,
    StudentMetric,
    StudentProfile,
)
from .settings import settings

CURRENT_PERIOD_ID = "rp_2026_s2"

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ---------------------------------------------------------------------------
# Context builders — turn DB rows into compact, LLM-friendly summaries
# ---------------------------------------------------------------------------

def _institution_summary(db: Session, institution: Institution) -> dict[str, Any]:
    """Compact KPI snapshot + AI assessment for one institution."""
    a = db.execute(
        select(AcademicKpi).where(
            AcademicKpi.institution_id == institution.id,
            AcademicKpi.reporting_period_id == CURRENT_PERIOD_ID,
        )
    ).scalar_one_or_none()
    i = db.execute(
        select(InsertionKpi).where(
            InsertionKpi.institution_id == institution.id,
            InsertionKpi.reporting_period_id == CURRENT_PERIOD_ID,
        )
    ).scalar_one_or_none()
    f = db.execute(
        select(FinanceKpi).where(
            FinanceKpi.institution_id == institution.id,
            FinanceKpi.reporting_period_id == CURRENT_PERIOD_ID,
        )
    ).scalar_one_or_none()
    h = db.execute(
        select(HrKpi).where(
            HrKpi.institution_id == institution.id,
            HrKpi.reporting_period_id == CURRENT_PERIOD_ID,
        )
    ).scalar_one_or_none()

    summary: dict[str, Any] = {
        "id": institution.id,
        "shortName": institution.short_name,
        "name": institution.name,
        "region": institution.region,
    }
    if a:
        summary["academic"] = {
            "successRate": a.success_rate,
            "attendanceRate": a.attendance_rate,
            "dropoutRate": a.dropout_rate,
            "abandonmentRate": a.abandonment_rate,
        }
    if i:
        summary["insertion"] = {
            "employabilityRate": i.employability_rate,
            "nationalConventionRate": i.national_convention_rate,
            "internationalConventionRate": i.international_convention_rate,
            "insertionDelayMonths": i.insertion_delay_months,
        }
    if f:
        summary["finance"] = {
            "budgetAllocated": f.budget_allocated,
            "budgetConsumed": f.budget_consumed,
            "consumptionPct": round(f.budget_consumed / f.budget_allocated * 100, 1)
            if f.budget_allocated > 0 else 0,
            "costPerStudent": f.cost_per_student,
        }
    if h:
        summary["hr"] = {
            "teachingHeadcount": h.teaching_headcount,
            "absenteeismRate": h.absenteeism_rate,
            "teamStabilityIndex": h.team_stability_index,
        }

    if a and i and f:
        risk = compute_institution_risk(
            success_rate=a.success_rate,
            attendance_rate=a.attendance_rate,
            dropout_rate=a.dropout_rate,
            abandonment_rate=a.abandonment_rate,
            employability_rate=i.employability_rate,
            budget_allocated=f.budget_allocated,
            budget_consumed=f.budget_consumed,
            absenteeism_rate=h.absenteeism_rate if h else None,
            team_stability_index=h.team_stability_index if h else None,
        )
        summary["aiRisk"] = {
            "score": risk.score,
            "level": risk.level,
            "summary": risk.summary,
            "topFactors": [
                {"feature": f_.feature, "value": f_.value, "impact": f_.impact, "explanation": f_.explanation}
                for f_ in risk.top_factors
            ],
        }
    return summary


def _ucar_overview(db: Session) -> dict[str, Any]:
    """All institutions + UCAR-wide anomalies."""
    institutions = db.execute(select(Institution)).scalars().all()
    summaries = [_institution_summary(db, inst) for inst in institutions]

    # Build anomalies across institutions
    academics = {
        s["id"]: s["academic"]
        for s in summaries
        if "academic" in s
    }
    insertions = {
        s["id"]: s["insertion"]
        for s in summaries
        if "insertion" in s
    }
    finances = {
        s["id"]: s["finance"]
        for s in summaries
        if "finance" in s
    }

    anomalies: list[dict[str, Any]] = []
    if academics:
        for metric, key, worse in [
            ("dropout_rate", "dropoutRate", True),
            ("success_rate", "successRate", False),
            ("attendance_rate", "attendanceRate", False),
        ]:
            for a in detect_anomalies(
                values_by_institution={k: v[key] for k, v in academics.items()},
                metric=metric, domain="academic", higher_is_worse=worse,
            ):
                anomalies.append({
                    "institutionId": a.institution_id,
                    "metric": a.metric,
                    "value": a.value,
                    "peerMean": a.peer_mean,
                    "zScore": a.z_score,
                    "severity": a.severity,
                })

    averages = {
        "successRate": round(sum(a["successRate"] for a in academics.values()) / max(len(academics), 1), 1),
        "dropoutRate": round(sum(a["dropoutRate"] for a in academics.values()) / max(len(academics), 1), 1),
        "employabilityRate": round(sum(i["employabilityRate"] for i in insertions.values()) / max(len(insertions), 1), 1),
        "budgetConsumptionPct": round(sum(f["consumptionPct"] for f in finances.values()) / max(len(finances), 1), 1),
    }

    return {
        "institutionsCount": len(summaries),
        "ucarAverages": averages,
        "anomalies": anomalies,
        "institutions": summaries,
    }


def _student_summary(db: Session, student_profile_id: str) -> dict[str, Any]:
    profile = db.execute(
        select(StudentProfile).where(StudentProfile.id == student_profile_id)
    ).scalar_one_or_none()
    if not profile:
        return {}
    metric = db.execute(
        select(StudentMetric).where(StudentMetric.student_profile_id == student_profile_id)
    ).scalar_one_or_none()
    institution = db.execute(
        select(Institution).where(Institution.id == profile.institution_id)
    ).scalar_one_or_none()
    recos = db.execute(
        select(Recommendation)
        .where(Recommendation.student_profile_id == student_profile_id)
        .order_by(Recommendation.display_order.asc())
    ).scalars().all()

    summary: dict[str, Any] = {
        "name": profile.full_name,
        "code": profile.student_code,
        "program": profile.program_name,
        "level": profile.level_label,
        "institution": institution.name if institution else None,
    }
    if metric:
        summary["metrics"] = {
            "averageGrade": metric.average_grade,
            "attendance": metric.attendance_rate,
        }
        risk = compute_student_risk(
            average_grade=metric.average_grade,
            attendance=metric.attendance_rate,
        )
        summary["aiRisk"] = {
            "score": risk.score,
            "level": risk.level,
            "summary": risk.summary,
            "topFactors": [
                {"explanation": f.explanation, "impact": f.impact} for f in risk.top_factors
            ],
        }
    summary["recommendations"] = [r.recommendation_text for r in recos]
    return summary


# ---------------------------------------------------------------------------
# Role-aware context + system prompt
# ---------------------------------------------------------------------------

def _build_context(db: Session, user: AppUser) -> tuple[str, dict[str, Any]]:
    """Return (system_prompt, grounding_data) tailored to the user's role."""
    if user.role == "ucar_admin":
        data = _ucar_overview(db)
        system = (
            "You are UCAR Insight, an AI assistant for the leadership of the University of Carthage (UCAR). "
            "You help the UCAR rectorate analyze cross-institution KPIs and AI-detected anomalies. "
            f"Current reporting period: {CURRENT_PERIOD_ID}. "
            "You have read-only access to live, structured KPI data for all 34 institutions, attached as JSON below. "
            "ALWAYS ground your answers in this data — do not invent numbers. "
            "When asked about an institution, cite its short name and exact KPI values. "
            "When discussing risk, always reference the AI risk score and the top contributing factors. "
            "Be concise (3-6 sentences) unless the user asks for detail. Use markdown for tables and lists."
        )
    elif user.role == "institution_admin":
        if not user.institution_id:
            data = {}
            system = "You are UCAR Insight. The user has no institution assigned."
        else:
            inst = db.execute(
                select(Institution).where(Institution.id == user.institution_id)
            ).scalar_one_or_none()
            data = _institution_summary(db, inst) if inst else {}
            system = (
                f"You are UCAR Insight, an AI assistant for the leadership of {inst.name if inst else 'this institution'}. "
                f"Current reporting period: {CURRENT_PERIOD_ID}. "
                "You have read-only access to live KPI data for THIS institution only, attached as JSON below. "
                "You CANNOT access other institutions' data. If the user asks to compare, politely explain "
                "that comparisons across institutions are restricted to UCAR-level admins. "
                "ALWAYS ground numeric answers in the attached data; never invent values. "
                "Reference the AI risk assessment and top factors when discussing risk. "
                "Be concise (3-6 sentences). Use markdown for tables and lists."
            )
    elif user.role == "student":
        if not user.student_profile_id:
            data = {}
            system = "You are UCAR Insight. The user has no student profile."
        else:
            data = _student_summary(db, user.student_profile_id)
            system = (
                f"You are UCAR Insight, a personal academic AI assistant for {data.get('name', 'the student')}. "
                "You have read-only access to ONLY this student's personal data, attached as JSON below. "
                "You CANNOT access other students' or institution-wide data. "
                "Be supportive and constructive. Always reference the AI risk score and the personalized "
                "recommendations when relevant. Use plain language. Be concise (3-5 sentences)."
            )
    else:
        data = {}
        system = "You are UCAR Insight, an AI assistant. No role context is available."

    return system, data


# ---------------------------------------------------------------------------
# Chat entrypoint
# ---------------------------------------------------------------------------

def chat_reply(
    db: Session,
    user: AppUser,
    message: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Generate a Gemini reply grounded in role-scoped UCAR data."""
    system_prompt, grounding = _build_context(db, user)

    grounding_json = json.dumps(grounding, ensure_ascii=False, indent=2)
    system_with_data = (
        f"{system_prompt}\n\n"
        f"=== LIVE UCAR DATA (JSON, ground truth) ===\n"
        f"{grounding_json}\n"
        f"=== END DATA ==="
    )

    # Build chat history in genai format
    contents: list[genai_types.Content] = []
    for msg in history or []:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append(
            genai_types.Content(role=role, parts=[genai_types.Part(text=msg.get("content", ""))])
        )
    contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=message)]))

    client = _get_client()
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=contents,
        config=genai_types.GenerateContentConfig(
            system_instruction=system_with_data,
            temperature=0.4,
            max_output_tokens=800,
        ),
    )
    return response.text or ""


def quick_actions_for_role(role: str) -> list[str]:
    """Suggested chat questions per role, shown as chips in the UI."""
    if role == "ucar_admin":
        return [
            "Which 3 institutions are highest risk and why?",
            "Summarize this period's biggest anomalies.",
            "Compare INSAT and EPT on success and dropout.",
            "What's the UCAR-wide trend on employability?",
        ]
    if role == "institution_admin":
        return [
            "Why is my institution flagged with this risk level?",
            "What KPI should I prioritize next period?",
            "Explain my top contributing risk factors.",
            "Summarize my budget and attendance situation.",
        ]
    if role == "student":
        return [
            "Why am I flagged at risk?",
            "What should I do this week to improve?",
            "Explain my risk score in simple terms.",
        ]
    return []
