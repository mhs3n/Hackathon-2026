"""AI engine: explainable risk scoring, anomaly detection, and forecasting.

This module turns raw KPI rows into actionable, explainable signals:
- compute_institution_risk: weighted multi-factor risk score with feature contributions
- detect_anomalies: z-score based outlier detection across institutions
- forecast_next: simple linear regression for trend extrapolation
- compute_student_risk: per-student risk with explanation

All outputs are designed to be human-readable for university leadership.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass, field
from typing import Sequence


@dataclass
class FeatureContribution:
    feature: str
    value: float
    impact: float  # signed contribution to risk (positive = increases risk)
    direction: str  # "high" or "low"
    explanation: str


@dataclass
class RiskAssessment:
    score: int  # 0-100
    level: str  # "Low" / "Medium" / "High"
    top_factors: list[FeatureContribution] = field(default_factory=list)
    summary: str = ""


@dataclass
class Anomaly:
    institution_id: str
    kpi_domain: str
    metric: str
    value: float
    z_score: float
    peer_mean: float
    severity: str  # "low" / "medium" / "high"
    direction: str  # "above" / "below"
    explanation: str


# -----------------------
# Risk scoring
# -----------------------

# Weights for institution risk model (sum ~ 1.0). Calibrated for higher-ed context.
INST_WEIGHTS = {
    "dropout_rate": 0.22,            # higher = worse
    "abandonment_rate": 0.10,
    "attendance_rate": -0.14,        # higher = better (negative weight)
    "success_rate": -0.18,
    "employability_rate": -0.10,
    "budget_consumption_pct": 0.06,  # mid-range optimal; we treat extremes as risk
    "absenteeism_rate": 0.08,
    "team_stability_index": -0.07,
    "maintenance_backlog_days": 0.05,
}


def _normalize(v: float, lo: float, hi: float) -> float:
    """Map v from [lo, hi] to [0, 100], clamped."""
    if hi == lo:
        return 50.0
    return max(0.0, min(100.0, (v - lo) / (hi - lo) * 100.0))


def compute_institution_risk(
    *,
    success_rate: float,
    attendance_rate: float,
    dropout_rate: float,
    abandonment_rate: float,
    employability_rate: float,
    budget_allocated: float,
    budget_consumed: float,
    absenteeism_rate: float | None = None,
    team_stability_index: float | None = None,
    maintenance_backlog_days: float | None = None,
) -> RiskAssessment:
    """Compute an explainable risk score for an institution.

    Each KPI is normalized to a 0-100 'risk contribution', combined via weighted sum.
    The top 3 contributing factors are returned with plain-language explanations.
    """
    budget_pct = (budget_consumed / budget_allocated * 100.0) if budget_allocated > 0 else 50.0
    # for budget, optimal is ~75%; risk grows quadratically away from there
    budget_dev = abs(budget_pct - 75.0) / 75.0 * 100.0  # 0..~100

    contribs: list[FeatureContribution] = []

    def add(feature: str, value: float, normalized: float, weight: float, label: str, good_low: bool):
        # impact = weight * normalized (positive = bad)
        impact = weight * (normalized if weight > 0 else (100 - normalized) * -1)
        # simpler interpretation: contribution to risk (always positive when "bad")
        risk_contrib = (
            normalized * weight
            if weight > 0
            else (100.0 - normalized) * abs(weight)
        )
        direction = "high" if (weight > 0 and value > 50) or (weight < 0 and value < 50) else "low"
        contribs.append(
            FeatureContribution(
                feature=feature,
                value=round(value, 1),
                impact=round(risk_contrib, 2),
                direction=direction,
                explanation=label,
            )
        )

    add("dropout_rate", dropout_rate, _normalize(dropout_rate, 2, 25), INST_WEIGHTS["dropout_rate"],
        f"Dropout rate at {dropout_rate:.1f}% (peer healthy band: <10%).", good_low=True)
    add("abandonment_rate", abandonment_rate, _normalize(abandonment_rate, 1, 12),
        INST_WEIGHTS["abandonment_rate"],
        f"Abandonment rate at {abandonment_rate:.1f}%.", good_low=True)
    add("attendance_rate", attendance_rate, _normalize(attendance_rate, 50, 95),
        INST_WEIGHTS["attendance_rate"],
        f"Attendance rate at {attendance_rate:.1f}% (target ≥80%).", good_low=False)
    add("success_rate", success_rate, _normalize(success_rate, 50, 95),
        INST_WEIGHTS["success_rate"],
        f"Success rate at {success_rate:.1f}% (target ≥75%).", good_low=False)
    add("employability_rate", employability_rate, _normalize(employability_rate, 50, 95),
        INST_WEIGHTS["employability_rate"],
        f"Employability at {employability_rate:.1f}%.", good_low=False)
    add("budget_consumption_pct", budget_pct, budget_dev,
        INST_WEIGHTS["budget_consumption_pct"],
        f"Budget consumed at {budget_pct:.1f}% (optimal range 65-85%).", good_low=False)

    if absenteeism_rate is not None:
        add("absenteeism_rate", absenteeism_rate, _normalize(absenteeism_rate, 1, 9),
            INST_WEIGHTS["absenteeism_rate"],
            f"Staff absenteeism at {absenteeism_rate:.1f}%.", good_low=True)
    if team_stability_index is not None:
        add("team_stability_index", team_stability_index, _normalize(team_stability_index, 50, 95),
            INST_WEIGHTS["team_stability_index"],
            f"Team stability index at {team_stability_index:.0f} (higher is better).", good_low=False)
    if maintenance_backlog_days is not None:
        add("maintenance_backlog_days", maintenance_backlog_days,
            _normalize(maintenance_backlog_days, 0, 30), INST_WEIGHTS["maintenance_backlog_days"],
            f"Maintenance backlog at {maintenance_backlog_days:.0f} days.", good_low=True)

    total = sum(c.impact for c in contribs)
    # normalize total to 0-100. The sum of |weights| sets max range.
    total_weight = sum(abs(w) for w in INST_WEIGHTS.values())
    score_pct = max(0.0, min(100.0, total / total_weight))
    score = int(round(score_pct))
    level = "High" if score >= 60 else "Medium" if score >= 35 else "Low"

    # Top 3 contributors by impact
    top = sorted(contribs, key=lambda c: c.impact, reverse=True)[:3]
    summary_parts = [c.explanation for c in top]
    summary = " ".join(summary_parts)

    return RiskAssessment(score=score, level=level, top_factors=top, summary=summary)


def compute_student_risk(
    *,
    average_grade: float,  # 0..20
    attendance: float,     # 0..100
    grade_trend: float = 0.0,        # last - prev
    attendance_trend: float = 0.0,   # last - prev
) -> RiskAssessment:
    """Per-student explainable risk."""
    grade_pct = (average_grade / 20.0) * 100.0
    grade_risk = max(0.0, 100.0 - grade_pct)  # lower grade = higher risk
    attendance_risk = max(0.0, 100.0 - attendance)
    trend_risk = 0.0
    if grade_trend < 0:
        trend_risk += min(40.0, abs(grade_trend) * 8)  # each point lost = +8 risk
    if attendance_trend < 0:
        trend_risk += min(40.0, abs(attendance_trend) * 0.8)

    # Weighted combination
    score_pct = 0.45 * grade_risk + 0.40 * attendance_risk + 0.15 * trend_risk
    score = int(round(min(100.0, score_pct)))
    level = "High" if score >= 65 else "Medium" if score >= 40 else "Low"

    factors: list[FeatureContribution] = []
    factors.append(FeatureContribution(
        feature="average_grade",
        value=round(average_grade, 2),
        impact=round(0.45 * grade_risk, 2),
        direction="low" if grade_pct < 60 else "high",
        explanation=f"Average grade {average_grade:.1f}/20 ({grade_pct:.0f}% of scale).",
    ))
    factors.append(FeatureContribution(
        feature="attendance",
        value=round(attendance, 1),
        impact=round(0.40 * attendance_risk, 2),
        direction="low" if attendance < 70 else "high",
        explanation=f"Attendance at {attendance:.0f}% (target ≥80%).",
    ))
    if trend_risk > 0:
        factors.append(FeatureContribution(
            feature="negative_trend",
            value=round(grade_trend + attendance_trend, 2),
            impact=round(0.15 * trend_risk, 2),
            direction="low",
            explanation="Recent declining trend in grade and/or attendance.",
        ))

    top = sorted(factors, key=lambda c: c.impact, reverse=True)[:3]
    return RiskAssessment(
        score=score,
        level=level,
        top_factors=top,
        summary=" ".join(f.explanation for f in top),
    )


# -----------------------
# Anomaly detection
# -----------------------

def detect_anomalies(
    *,
    values_by_institution: dict[str, float],
    metric: str,
    domain: str,
    higher_is_worse: bool = True,
    z_threshold: float = 1.0,
) -> list[Anomaly]:
    """Detect outliers in a metric across institutions using z-score."""
    if len(values_by_institution) < 3:
        return []
    vals = list(values_by_institution.values())
    mean = statistics.mean(vals)
    stdev = statistics.pstdev(vals)
    if stdev == 0:
        return []

    out: list[Anomaly] = []
    for iid, v in values_by_institution.items():
        z = (v - mean) / stdev
        is_bad = (z > z_threshold) if higher_is_worse else (z < -z_threshold)
        if not is_bad:
            continue
        abs_z = abs(z)
        severity = "high" if abs_z >= 2.0 else "medium" if abs_z >= 1.5 else "low"
        direction = "above" if z > 0 else "below"
        out.append(Anomaly(
            institution_id=iid,
            kpi_domain=domain,
            metric=metric,
            value=round(v, 2),
            z_score=round(z, 2),
            peer_mean=round(mean, 2),
            severity=severity,
            direction=direction,
            explanation=(
                f"{metric.replace('_', ' ').title()} is {direction} the UCAR average "
                f"({v:.1f} vs {mean:.1f}, z={z:+.2f}σ)."
            ),
        ))
    return out


# -----------------------
# Forecasting
# -----------------------

def forecast_next(history: Sequence[float], periods_ahead: int = 1) -> list[float]:
    """Simple linear regression forecast.

    Returns the next `periods_ahead` predicted values based on the trend.
    """
    if len(history) < 2:
        last = history[-1] if history else 0.0
        return [last] * periods_ahead

    n = len(history)
    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(history) / n
    num = sum((xs[i] - mean_x) * (history[i] - mean_y) for i in range(n))
    den = sum((xs[i] - mean_x) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0.0
    intercept = mean_y - slope * mean_x

    return [intercept + slope * (n + i) for i in range(periods_ahead)]


def confidence_band(history: Sequence[float], forecast: float) -> tuple[float, float]:
    """Return a +/- 1 stdev band around a forecast."""
    if len(history) < 2:
        return forecast, forecast
    s = statistics.pstdev(history)
    return (forecast - s, forecast + s)
