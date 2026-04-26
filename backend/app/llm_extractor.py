"""LLM-powered KPI extraction layer.

This module sits between text extraction (OCR/PDF/Excel) and DB insertion.
It uses Google Gemini to:
  1. Identify KPI values from free-form text (any language: French, Arabic, English).
  2. Classify each value into the correct UCAR KPI table.
  3. Return a structured ``{domain: {field: value}}`` dict ready for DB upsert.

Falls back gracefully (returns ``{}``) when the Gemini API key is missing or the
call fails, so the existing regex pipeline remains the safety net.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from google import genai
from google.genai import types as genai_types

from .settings import settings

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


def _get_client() -> genai.Client | None:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            return None
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# Domain → field name → human description.
# Field names MUST match DB columns in ``models.py`` exactly.
KPI_SCHEMA: dict[str, dict[str, str]] = {
    "academic": {
        "success_rate": "Pass / success rate, percentage 0-100",
        "attendance_rate": "Average attendance / presence rate, percentage 0-100",
        "repetition_rate": "Repetition rate, percentage 0-100",
        "dropout_rate": "Dropout rate during the term, percentage 0-100",
        "abandonment_rate": "Abandonment rate (taux d'abandon), percentage 0-100",
    },
    "finance": {
        "budget_allocated": "Total budget allocated (TND)",
        "budget_consumed": "Budget consumed / spent (TND)",
        "cost_per_student": "Cost per student (TND)",
    },
    "esg": {
        "energy_consumption_index": "Energy consumption index 0-100 (raw kWh will be normalized)",
        "carbon_footprint_index": "Carbon footprint index 0-100",
        "recycling_rate": "Recycling rate, percentage 0-100",
        "mobility_index": "Sustainable mobility index 0-100",
    },
    "hr": {
        "teaching_headcount": "Number of teaching staff (integer)",
        "admin_headcount": "Number of administrative staff (integer)",
        "absenteeism_rate": "Staff absenteeism rate, percentage 0-100",
        "training_completed_pct": "Training completion rate, percentage 0-100",
        "teaching_load_hours": "Average teaching load in hours",
        "team_stability_index": "Team stability index 0-100",
    },
    "research": {
        "publications_count": "Number of scientific publications (integer)",
        "active_projects": "Number of active research projects (integer)",
        "funding_secured_tnd": "Research funding secured (TND)",
        "academic_partnerships": "Number of academic research partnerships (integer)",
        "patents_filed": "Number of patents filed (integer)",
    },
    "infrastructure": {
        "classroom_occupancy_pct": "Classroom occupancy, percentage 0-100",
        "equipment_availability_pct": "Equipment availability, percentage 0-100",
        "it_equipment_status": "IT equipment status index 0-100",
        "ongoing_projects_count": "Number of ongoing infrastructure projects (integer)",
        "maintenance_backlog_days": "Maintenance backlog in days (integer)",
    },
    "partnership": {
        "active_agreements_count": "Active partnership agreements count (integer)",
        "student_mobility_incoming": "Incoming student mobility count (integer)",
        "student_mobility_outgoing": "Outgoing student mobility count (integer)",
        "international_projects": "International projects count (integer)",
        "academic_networks_count": "Academic networks count (integer)",
    },
    "insertion": {
        "national_convention_rate": "National convention/internship rate, percentage 0-100",
        "international_convention_rate": "International convention/internship rate, percentage 0-100",
        "employability_rate": "Graduate employability rate, percentage 0-100",
        "insertion_delay_months": "Average insertion delay in months",
    },
}


def _build_prompt(text: str) -> str:
    """Build the system+user prompt explaining the schema and task."""
    field_doc = ""
    for dom, fields in KPI_SCHEMA.items():
        field_doc += f"\n[{dom}]\n"
        for k, desc in fields.items():
            field_doc += f"  - {k}: {desc}\n"

    schema_summary = json.dumps(
        {dom: list(fields.keys()) for dom, fields in KPI_SCHEMA.items()},
        indent=2,
    )

    return (
        "You are a KPI extraction engine for the University of Carthage (UCAR) "
        "Insight Platform. Read the document text below — which may be in "
        "French, Arabic, or English and may have OCR noise — and extract every "
        "KPI value you can identify. For each value, classify it into the "
        "correct UCAR domain table.\n\n"
        f"=== UCAR DOMAINS AND FIELDS ===\n{field_doc}\n"
        "=== EXTRACTION RULES ===\n"
        "1. Output ONLY a JSON object. No prose, no markdown fences.\n"
        "2. Use field names EXACTLY as listed above.\n"
        "3. Convert percentages to plain numbers: \"75%\" -> 75, \"0,87\" -> 0.87.\n"
        "4. Numbers like \"15 000\" or \"15,000\" -> 15000 (TND amounts).\n"
        "5. Counts must be integers; rates and indices may be floats.\n"
        "6. If a value is ambiguous between two fields, choose the most specific one.\n"
        "7. Skip any field you cannot find. Do NOT invent values.\n"
        "8. Omit a domain entirely if it has no values (no empty objects).\n"
        "9. Trust labels in the document over your assumptions about the institution.\n\n"
        "=== EXPECTED JSON SHAPE (subset of these keys) ===\n"
        f"{schema_summary}\n\n"
        "=== DOCUMENT TEXT ===\n"
        f"{text[:25000]}\n"
        "=== END DOCUMENT ===\n\n"
        "Return only the JSON object."
    )


def llm_extract_kpis(text: str) -> dict[str, dict[str, float]]:
    """Use Gemini to identify and classify KPIs from a document.

    Returns a ``{domain: {field: value}}`` dict whose keys/values match UCAR DB
    columns. Returns an empty dict if the LLM is unavailable or fails.
    """
    if not text or not text.strip():
        return {}

    client = _get_client()
    if client is None:
        logger.info("LLM extractor disabled (no UCAR_GEMINI_API_KEY)")
        return {}

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=_build_prompt(text),
            config=genai_types.GenerateContentConfig(
                temperature=0.0,
                response_mime_type="application/json",
                max_output_tokens=2048,
            ),
        )
        raw = (response.text or "").strip()
        if not raw:
            return {}
        parsed: Any = json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM KPI extraction failed: %s", exc)
        return {}

    if not isinstance(parsed, dict):
        return {}

    # Sanitize: keep only known domains/fields, coerce numerics.
    cleaned: dict[str, dict[str, float]] = {}
    for domain, fields in parsed.items():
        if not isinstance(fields, dict) or domain not in KPI_SCHEMA:
            continue
        allowed = KPI_SCHEMA[domain]
        out: dict[str, float] = {}
        for k, v in fields.items():
            if k not in allowed or v is None:
                continue
            try:
                out[k] = float(v)
            except (TypeError, ValueError):
                continue
        if out:
            cleaned[domain] = out
    return cleaned
