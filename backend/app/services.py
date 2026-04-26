from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    AcademicKpi,
    AppUser,
    FinanceKpi,
    GeneratedReport,
    HrKpi,
    InfrastructureKpi,
    Institution,
    InsertionKpi,
    PartnershipKpi,
    ProcessKpi,
    Recommendation,
    ResearchKpi,
    RiskAlert,
    StudentMetric,
    StudentProfile,
    University,
)
from .schemas import (
    AcademicKpiRecord,
    AiAssessment,
    AiFactor,
    PeriodComparison,
    AnomalyMeta,
    AuthUser,
    FinanceKpiRecord,
    HrKpiRecord,
    InfrastructureKpiRecord,
    Institution as InstitutionSchema,
    InstitutionDashboardView,
    InsertionKpiRecord,
    PartnershipKpiRecord,
    ProcessKpiRecord,
    ResearchKpiRecord,
    RiskAlertRecord,
    StudentRisk,
    StudentSnapshot,
    UcarDashboardView,
    UcarReportFilters,
    UcarReportResponse,
    UcarReportRow,
    UcarReportSummary,
)
from .ai import (
    Anomaly,
    compute_institution_risk,
    compute_student_risk,
    detect_anomalies,
    forecast_next,
)
from .models import EsgKpi, ReportingPeriod
from .security import create_access_token

# Current reporting period — latest of the seeded periods
CURRENT_PERIOD_ID = "rp_2026_s2"


def _risk_to_assessment(ra) -> AiAssessment:
    return AiAssessment(
        score=ra.score,
        level=ra.level,
        summary=ra.summary,
        topFactors=[
            AiFactor(
                feature=f.feature,
                value=f.value,
                impact=f.impact,
                direction=f.direction,
                explanation=f.explanation,
            )
            for f in ra.top_factors
        ],
    )


def build_auth_response(db: Session, user: AppUser) -> dict:
    institution = None
    university = None
    if user.institution_id:
        institution = db.execute(select(Institution).where(Institution.id == user.institution_id)).scalar_one_or_none()
        if institution:
            university = db.execute(
                select(University).where(University.id == institution.university_id),
            ).scalar_one_or_none()

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        institution_id=user.institution_id,
        student_profile_id=user.student_profile_id,
    )
    return {
        "accessToken": token,
        "user": AuthUser(
            id=user.id,
            name=user.full_name,
            email=user.email,
            role=user.role,
            institutionId=user.institution_id,
            studentProfileId=user.student_profile_id,
            universityId=university.id if university else None,
            universityName=university.name if university else None,
            universityShortName=university.short_name if university else None,
            universityLogoPath=university.logo_path if university else None,
            institutionName=institution.name if institution else None,
            institutionShortName=institution.short_name if institution else None,
            institutionLogoPath=institution.logo_path if institution else None,
        ),
    }


def _institution_schema(
    institution: Institution,
    academic: AcademicKpi,
    insertion: InsertionKpi,
    finance: FinanceKpi,
    risk_level: str,
) -> InstitutionSchema:
    return InstitutionSchema(
        id=institution.id,
        universityId=institution.university_id,
        name=institution.name,
        shortName=institution.short_name,
        region=institution.region,
        logoPath=institution.logo_path,
        successRate=academic.success_rate,
        attendanceRate=academic.attendance_rate,
        employabilityRate=insertion.employability_rate,
        dropoutRate=academic.dropout_rate,
        budgetUsage=round((finance.budget_consumed / finance.budget_allocated) * 100),
        energyUsageIndex=0,
        riskLevel=risk_level,
    )


def _latest_academic_by_institution(db: Session, period_id: str = CURRENT_PERIOD_ID) -> dict[str, AcademicKpi]:
    rows = db.execute(
        select(AcademicKpi).where(AcademicKpi.reporting_period_id == period_id)
    ).scalars().all()
    return {row.institution_id: row for row in rows}


def _latest_insertion_by_institution(db: Session, period_id: str = CURRENT_PERIOD_ID) -> dict[str, InsertionKpi]:
    rows = db.execute(
        select(InsertionKpi).where(InsertionKpi.reporting_period_id == period_id)
    ).scalars().all()
    return {row.institution_id: row for row in rows}


def _latest_finance_by_institution(db: Session, period_id: str = CURRENT_PERIOD_ID) -> dict[str, FinanceKpi]:
    rows = db.execute(
        select(FinanceKpi).where(FinanceKpi.reporting_period_id == period_id)
    ).scalars().all()
    return {row.institution_id: row for row in rows}


def _latest_hr_by_institution(db: Session, period_id: str = CURRENT_PERIOD_ID) -> dict[str, HrKpi]:
    rows = db.execute(
        select(HrKpi).where(HrKpi.reporting_period_id == period_id)
    ).scalars().all()
    return {row.institution_id: row for row in rows}


def _latest_infra_by_institution(db: Session, period_id: str = CURRENT_PERIOD_ID) -> dict[str, InfrastructureKpi]:
    rows = db.execute(
        select(InfrastructureKpi).where(InfrastructureKpi.reporting_period_id == period_id)
    ).scalars().all()
    return {row.institution_id: row for row in rows}


def _compute_risk_levels(
    db: Session,
    academics: dict[str, AcademicKpi],
    insertions: dict[str, InsertionKpi],
    finances: dict[str, FinanceKpi],
) -> dict[str, str]:
    """Compute explainable risk level for each institution using the AI engine."""
    hr_map = _latest_hr_by_institution(db)
    infra_map = _latest_infra_by_institution(db)
    levels: dict[str, str] = {}
    for iid, a in academics.items():
        i = insertions.get(iid)
        f = finances.get(iid)
        if not (i and f):
            continue
        h = hr_map.get(iid)
        x = infra_map.get(iid)
        ra = compute_institution_risk(
            success_rate=a.success_rate,
            attendance_rate=a.attendance_rate,
            dropout_rate=a.dropout_rate,
            abandonment_rate=a.abandonment_rate,
            employability_rate=i.employability_rate,
            budget_allocated=f.budget_allocated,
            budget_consumed=f.budget_consumed,
            absenteeism_rate=h.absenteeism_rate if h else None,
            team_stability_index=h.team_stability_index if h else None,
            maintenance_backlog_days=x.maintenance_backlog_days if x else None,
        )
        levels[iid] = ra.level
    return levels


def _build_critical_alerts_from_anomalies(
    db: Session,
    academics: dict[str, AcademicKpi],
    insertions: dict[str, InsertionKpi],
    finances: dict[str, FinanceKpi],
    *,
    period_id: str = CURRENT_PERIOD_ID,
) -> list[RiskAlertRecord]:
    """AI-driven critical alert detection using cross-institution z-scores."""
    institutions_by_id = {
        i.id: i for i in db.execute(select(Institution)).scalars().all()
    }

    anomalies: list[Anomaly] = []
    if academics:
        anomalies += detect_anomalies(
            values_by_institution={k: v.dropout_rate for k, v in academics.items()},
            metric="dropout_rate", domain="academic", higher_is_worse=True,
        )
        anomalies += detect_anomalies(
            values_by_institution={k: v.success_rate for k, v in academics.items()},
            metric="success_rate", domain="academic", higher_is_worse=False,
        )
        anomalies += detect_anomalies(
            values_by_institution={k: v.attendance_rate for k, v in academics.items()},
            metric="attendance_rate", domain="academic", higher_is_worse=False,
        )
    if insertions:
        anomalies += detect_anomalies(
            values_by_institution={k: v.employability_rate for k, v in insertions.items()},
            metric="employability_rate", domain="insertion", higher_is_worse=False,
        )
    if finances:
        anomalies += detect_anomalies(
            values_by_institution={
                k: (v.budget_consumed / v.budget_allocated * 100.0) if v.budget_allocated > 0 else 0
                for k, v in finances.items()
            },
            metric="budget_consumption_pct", domain="finance", higher_is_worse=True,
        )

    # Keep all severities; sort by severity desc then |z|
    severity_rank = {"low": 0, "medium": 1, "high": 2}
    filtered = list(anomalies)
    filtered.sort(key=lambda a: (severity_rank[a.severity], abs(a.z_score)), reverse=True)

    alerts: list[RiskAlertRecord] = []
    for a in filtered[:12]:  # cap to 12 most critical
        inst = institutions_by_id.get(a.institution_id)
        title = f"{inst.short_name if inst else a.institution_id}: {a.metric.replace('_', ' ').title()} anomaly"
        impact = (
            "May trigger UCAR-level review and intervention next cycle"
            if a.severity == "high"
            else "Watch closely; trend deviation against UCAR median"
        )
        alerts.append(
            RiskAlertRecord(
                id=f"ai_{a.institution_id}_{a.metric}",
                scopeType="institution",
                institutionId=a.institution_id,
                studentProfileId=None,
                reportingPeriodId=period_id,
                severity=a.severity,
                title=title,
                explanation=a.explanation,
                predictedImpact=impact,
                anomaly=AnomalyMeta(
                    metric=a.metric,
                    value=a.value,
                    peerMean=a.peer_mean,
                    zScore=a.z_score,
                    direction=a.direction,
                ),
            )
        )
    return alerts


def _previous_period(db: Session, period_id: str) -> ReportingPeriod | None:
    """Return the reporting period that ended just before `period_id` started."""
    current = db.execute(
        select(ReportingPeriod).where(ReportingPeriod.id == period_id)
    ).scalar_one_or_none()
    if not current:
        return None
    return db.execute(
        select(ReportingPeriod)
        .where(ReportingPeriod.starts_on < current.starts_on)
        .order_by(ReportingPeriod.starts_on.desc())
        .limit(1)
    ).scalar_one_or_none()


def _ucar_averages(
    academics: dict[str, AcademicKpi],
    finances: dict[str, FinanceKpi],
) -> tuple[int | None, int | None]:
    """Compute average success rate and average budget-usage % across institutions."""
    common_ids = academics.keys() & finances.keys()
    if not common_ids:
        return None, None
    success_avg = round(sum(academics[i].success_rate for i in common_ids) / len(common_ids))
    budget_avg = round(
        sum(
            (finances[i].budget_consumed / finances[i].budget_allocated * 100.0)
            if finances[i].budget_allocated > 0 else 0
            for i in common_ids
        )
        / len(common_ids)
    )
    return success_avg, budget_avg


def get_ucar_dashboard(db: Session, period_id: str = CURRENT_PERIOD_ID) -> UcarDashboardView:
    institutions = db.execute(select(Institution)).scalars().all()
    academics = _latest_academic_by_institution(db, period_id)
    insertions = _latest_insertion_by_institution(db, period_id)
    finances = _latest_finance_by_institution(db, period_id)
    risk_levels = _compute_risk_levels(db, academics, insertions, finances)

    visible_institutions = [
        _institution_schema(
            institution,
            academics[institution.id],
            insertions[institution.id],
            finances[institution.id],
            risk_levels.get(institution.id, "Low"),
        )
        for institution in institutions
        if institution.id in academics and institution.id in insertions and institution.id in finances
    ]

    # AI-driven critical alerts: combine seeded alerts + computed anomalies
    seeded_alerts = [
        RiskAlertRecord(
            id=item.id,
            scopeType=item.scope_type,
            institutionId=item.institution_id,
            studentProfileId=item.student_profile_id,
            reportingPeriodId=item.reporting_period_id,
            severity=item.severity,
            title=item.title,
            explanation=item.explanation,
            predictedImpact=item.predicted_impact,
        )
        for item in db.execute(
            select(RiskAlert).where(
                RiskAlert.scope_type == "institution",
                RiskAlert.severity == "high",
                RiskAlert.reporting_period_id == period_id,
            ),
        ).scalars()
    ]
    ai_alerts = _build_critical_alerts_from_anomalies(db, academics, insertions, finances, period_id=period_id)
    critical_alerts = seeded_alerts + ai_alerts

    generated_report = db.execute(
        select(GeneratedReport).where(GeneratedReport.scope_type == "ucar").order_by(GeneratedReport.generated_at.desc()),
    ).scalar_one_or_none()

    academic_average = round(sum(item.successRate for item in visible_institutions) / max(len(visible_institutions), 1))
    budget_average = round(sum(item.budgetUsage for item in visible_institutions) / max(len(visible_institutions), 1))

    return UcarDashboardView(
        institutions=visible_institutions,
        academicAverage=academic_average,
        budgetAverage=budget_average,
        criticalAlerts=critical_alerts,
        generatedReportSummary=generated_report.summary_text if generated_report else "",
    )


def _assert_institution_scope(requested_institution_id: str, current_user: AppUser) -> None:
    if current_user.role == "ucar_admin":
        return
    if current_user.institution_id != requested_institution_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Institution outside current scope")


def get_institution_dashboard(
    db: Session,
    institution_id: str,
    current_user: AppUser,
    period_id: str = CURRENT_PERIOD_ID,
) -> InstitutionDashboardView:
    _assert_institution_scope(institution_id, current_user)

    institution = db.execute(select(Institution).where(Institution.id == institution_id)).scalar_one_or_none()

    def _one(model):
        return db.execute(
            select(model).where(
                model.institution_id == institution_id,
                model.reporting_period_id == period_id,
            )
        ).scalar_one_or_none()

    academic = _one(AcademicKpi)
    insertion = _one(InsertionKpi)
    finance = _one(FinanceKpi)
    hr = _one(HrKpi)
    research = _one(ResearchKpi)
    infrastructure = _one(InfrastructureKpi)
    partnership = _one(PartnershipKpi)
    process = db.execute(select(ProcessKpi).where(ProcessKpi.institution_id == institution_id)).scalars().all()
    alerts = db.execute(
        select(RiskAlert).where(RiskAlert.scope_type == "student", RiskAlert.institution_id == institution_id),
    ).scalars().all()

    if not institution or not academic or not insertion or not finance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution dashboard not found")

    risk_list: list[StudentRisk] = []
    for alert in alerts:
        if not alert.student_profile_id:
            continue
        profile = db.execute(select(StudentProfile).where(StudentProfile.id == alert.student_profile_id)).scalar_one_or_none()
        metric = db.execute(select(StudentMetric).where(StudentMetric.student_profile_id == alert.student_profile_id)).scalar_one_or_none()
        if not profile or not metric:
            continue
        risk_list.append(
            StudentRisk(
                id=profile.id,
                name=profile.full_name,
                attendance=metric.attendance_rate,
                averageGrade=metric.average_grade,
                riskScore=metric.risk_score,
                reason=alert.explanation,
            ),
        )

    # Compute explainable risk for this institution
    inst_risk = compute_institution_risk(
        success_rate=academic.success_rate,
        attendance_rate=academic.attendance_rate,
        dropout_rate=academic.dropout_rate,
        abandonment_rate=academic.abandonment_rate,
        employability_rate=insertion.employability_rate,
        budget_allocated=finance.budget_allocated,
        budget_consumed=finance.budget_consumed,
        absenteeism_rate=hr.absenteeism_rate if hr else None,
        team_stability_index=hr.team_stability_index if hr else None,
        maintenance_backlog_days=infrastructure.maintenance_backlog_days if infrastructure else None,
    )

    return InstitutionDashboardView(
        institution=_institution_schema(institution, academic, insertion, finance, inst_risk.level),
        academic=AcademicKpiRecord(
            id=academic.id,
            institutionId=academic.institution_id,
            reportingPeriodId=academic.reporting_period_id,
            successRate=academic.success_rate,
            attendanceRate=academic.attendance_rate,
            repetitionRate=academic.repetition_rate,
            dropoutRate=academic.dropout_rate,
            abandonmentRate=academic.abandonment_rate,
        ),
        insertion=InsertionKpiRecord(
            id=insertion.id,
            institutionId=insertion.institution_id,
            reportingPeriodId=insertion.reporting_period_id,
            nationalConventionRate=insertion.national_convention_rate,
            internationalConventionRate=insertion.international_convention_rate,
            employabilityRate=insertion.employability_rate,
            insertionDelayMonths=insertion.insertion_delay_months,
        ),
        finance=FinanceKpiRecord(
            id=finance.id,
            institutionId=finance.institution_id,
            reportingPeriodId=finance.reporting_period_id,
            budgetAllocated=finance.budget_allocated,
            budgetConsumed=finance.budget_consumed,
            costPerStudent=finance.cost_per_student,
        ),
        process=[
            ProcessKpiRecord(
                id=item.id,
                institutionId=item.institution_id,
                reportingPeriodId=item.reporting_period_id,
                processKey=item.process_key,
                processLabel=item.process_label,
                metricLabel=item.metric_label,
                metricValue=item.metric_value,
                metricUnit=item.metric_unit,
            )
            for item in process
        ],
        riskList=risk_list,
        hr=HrKpiRecord(
            id=hr.id,
            institutionId=hr.institution_id,
            reportingPeriodId=hr.reporting_period_id,
            teachingHeadcount=hr.teaching_headcount,
            adminHeadcount=hr.admin_headcount,
            absenteeismRate=hr.absenteeism_rate,
            trainingCompletedPct=hr.training_completed_pct,
            teachingLoadHours=hr.teaching_load_hours,
            teamStabilityIndex=hr.team_stability_index,
        ) if hr else None,
        research=ResearchKpiRecord(
            id=research.id,
            institutionId=research.institution_id,
            reportingPeriodId=research.reporting_period_id,
            publicationsCount=research.publications_count,
            activeProjects=research.active_projects,
            fundingSecuredTnd=research.funding_secured_tnd,
            academicPartnerships=research.academic_partnerships,
            patentsFiled=research.patents_filed,
        ) if research else None,
        infrastructure=InfrastructureKpiRecord(
            id=infrastructure.id,
            institutionId=infrastructure.institution_id,
            reportingPeriodId=infrastructure.reporting_period_id,
            classroomOccupancyPct=infrastructure.classroom_occupancy_pct,
            equipmentAvailabilityPct=infrastructure.equipment_availability_pct,
            itEquipmentStatus=infrastructure.it_equipment_status,
            ongoingProjectsCount=infrastructure.ongoing_projects_count,
            maintenanceBacklogDays=infrastructure.maintenance_backlog_days,
        ) if infrastructure else None,
        partnership=PartnershipKpiRecord(
            id=partnership.id,
            institutionId=partnership.institution_id,
            reportingPeriodId=partnership.reporting_period_id,
            activeAgreementsCount=partnership.active_agreements_count,
            studentMobilityIncoming=partnership.student_mobility_incoming,
            studentMobilityOutgoing=partnership.student_mobility_outgoing,
            internationalProjects=partnership.international_projects,
            academicNetworksCount=partnership.academic_networks_count,
        ) if partnership else None,
        aiAssessment=_risk_to_assessment(inst_risk),
    )


def get_student_dashboard(db: Session, student_profile_id: str, current_user: AppUser) -> StudentSnapshot:
    if current_user.role == "student" and current_user.student_profile_id != student_profile_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student record outside current scope")

    profile = db.execute(select(StudentProfile).where(StudentProfile.id == student_profile_id)).scalar_one_or_none()
    metric = db.execute(select(StudentMetric).where(StudentMetric.student_profile_id == student_profile_id)).scalar_one_or_none()
    alert = db.execute(
        select(RiskAlert).where(RiskAlert.scope_type == "student", RiskAlert.student_profile_id == student_profile_id),
    ).scalar_one_or_none()
    if not profile or not metric or not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student dashboard not found")

    if current_user.role == "institution_admin" and current_user.institution_id != profile.institution_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student record outside current institution")

    institution = db.execute(select(Institution).where(Institution.id == profile.institution_id)).scalar_one_or_none()
    actions = db.execute(
        select(Recommendation)
        .where(Recommendation.student_profile_id == student_profile_id)
        .order_by(Recommendation.display_order.asc()),
    ).scalars().all()
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    student_risk = compute_student_risk(
        average_grade=metric.average_grade,
        attendance=metric.attendance_rate,
    )

    university = db.execute(
        select(University).where(University.id == institution.university_id),
    ).scalar_one_or_none()

    period = db.execute(
        select(ReportingPeriod).where(ReportingPeriod.id == metric.reporting_period_id),
    ).scalar_one_or_none()
    if period is not None:
        academic_year = f"{period.year}-{period.year + 1}" if period.semester == "S1" else f"{period.year - 1}-{period.year}"
    else:
        academic_year = None

    return StudentSnapshot(
        studentName=profile.full_name,
        institutionName=institution.name,
        averageGrade=metric.average_grade,
        attendance=metric.attendance_rate,
        riskScore=student_risk.score,
        riskExplanation=student_risk.summary or alert.explanation,
        recommendations=[item.recommendation_text for item in actions],
        aiAssessment=_risk_to_assessment(student_risk),
        studentCode=profile.student_code,
        programName=profile.program_name,
        levelLabel=profile.level_label,
        institutionId=institution.id,
        institutionShortName=institution.short_name,
        institutionRegion=institution.region,
        universityName=university.name if university else None,
        universityShortName=university.short_name if university else None,
        academicYear=academic_year,
    )


# -----------------------
# History + forecast
# -----------------------

# Map domain string -> (model class, list of (db column, public name) for metrics)
HISTORY_METRICS = {
    "academic": (AcademicKpi, [
        ("success_rate", "successRate"),
        ("attendance_rate", "attendanceRate"),
        ("repetition_rate", "repetitionRate"),
        ("dropout_rate", "dropoutRate"),
        ("abandonment_rate", "abandonmentRate"),
    ]),
    "insertion": (InsertionKpi, [
        ("national_convention_rate", "nationalConventionRate"),
        ("international_convention_rate", "internationalConventionRate"),
        ("employability_rate", "employabilityRate"),
        ("insertion_delay_months", "insertionDelayMonths"),
    ]),
    "finance": (FinanceKpi, [
        ("budget_allocated", "budgetAllocated"),
        ("budget_consumed", "budgetConsumed"),
        ("cost_per_student", "costPerStudent"),
    ]),
    "hr": (HrKpi, [
        ("teaching_headcount", "teachingHeadcount"),
        ("admin_headcount", "adminHeadcount"),
        ("absenteeism_rate", "absenteeismRate"),
        ("training_completed_pct", "trainingCompletedPct"),
        ("teaching_load_hours", "teachingLoadHours"),
        ("team_stability_index", "teamStabilityIndex"),
    ]),
    "research": (ResearchKpi, [
        ("publications_count", "publicationsCount"),
        ("active_projects", "activeProjects"),
        ("funding_secured_tnd", "fundingSecuredTnd"),
        ("academic_partnerships", "academicPartnerships"),
        ("patents_filed", "patentsFiled"),
    ]),
    "infrastructure": (InfrastructureKpi, [
        ("classroom_occupancy_pct", "classroomOccupancyPct"),
        ("equipment_availability_pct", "equipmentAvailabilityPct"),
        ("it_equipment_status", "itEquipmentStatus"),
        ("ongoing_projects_count", "ongoingProjectsCount"),
        ("maintenance_backlog_days", "maintenanceBacklogDays"),
    ]),
    "partnership": (PartnershipKpi, [
        ("active_agreements_count", "activeAgreementsCount"),
        ("student_mobility_incoming", "studentMobilityIncoming"),
        ("student_mobility_outgoing", "studentMobilityOutgoing"),
        ("international_projects", "internationalProjects"),
        ("academic_networks_count", "academicNetworksCount"),
    ]),
    "esg": (EsgKpi, [
        ("energy_consumption_index", "energyConsumptionIndex"),
        ("carbon_footprint_index", "carbonFootprintIndex"),
        ("recycling_rate", "recyclingRate"),
        ("mobility_index", "mobilityIndex"),
    ]),
}


def get_kpi_history(
    db: Session,
    institution_id: str,
    domain: str,
    current_user: AppUser,
) -> dict:
    """Return time-series + AI forecast for each metric in a KPI domain."""
    _assert_institution_scope(institution_id, current_user)
    if domain not in HISTORY_METRICS:
        raise HTTPException(status_code=404, detail=f"Unknown domain: {domain}")

    model, metrics = HISTORY_METRICS[domain]
    periods = db.execute(
        select(ReportingPeriod).order_by(ReportingPeriod.starts_on.asc())
    ).scalars().all()
    period_ids = [p.id for p in periods]
    period_labels = [p.label for p in periods]

    rows = db.execute(
        select(model).where(model.institution_id == institution_id)
    ).scalars().all()
    by_period = {r.reporting_period_id: r for r in rows}

    series = []
    for db_col, public_name in metrics:
        history = []
        for pid in period_ids:
            r = by_period.get(pid)
            if r is None:
                history.append(0.0)
            else:
                history.append(float(getattr(r, db_col)))
        forecast = forecast_next(history, periods_ahead=1)[0] if history else 0.0
        forecast = round(max(0.0, forecast), 2)
        series.append({
            "metric": public_name,
            "values": [round(v, 2) for v in history],
            "forecast": forecast,
        })

    return {
        "domain": domain,
        "institutionId": institution_id,
        "periods": period_labels,
        "forecastPeriod": "Forecast",
        "series": series,
    }


# -----------------------
# UCAR report generation
# -----------------------

REPORT_MODELS = (
    AcademicKpi,
    InsertionKpi,
    FinanceKpi,
    HrKpi,
    ResearchKpi,
    InfrastructureKpi,
    PartnershipKpi,
    EsgKpi,
)


def _map_by_institution_period(rows) -> dict[tuple[str, str], object]:
    return {(row.institution_id, row.reporting_period_id): row for row in rows}


def _period_range(db: Session, start_period_id: str, end_period_id: str) -> list[ReportingPeriod]:
    periods = db.execute(
        select(ReportingPeriod).order_by(ReportingPeriod.starts_on.asc())
    ).scalars().all()
    by_id = {period.id: period for period in periods}
    start = by_id.get(start_period_id)
    end = by_id.get(end_period_id)
    if not start or not end:
        raise HTTPException(status_code=400, detail="Unknown reporting period in selected range")
    if start.starts_on > end.starts_on:
        raise HTTPException(status_code=400, detail="Start period must be before end period")
    return [
        period
        for period in periods
        if start.starts_on <= period.starts_on <= end.starts_on
    ]


def get_ucar_report(
    db: Session,
    *,
    start_period_id: str,
    end_period_id: str,
    institution_ids: list[str] | None = None,
) -> UcarReportResponse:
    periods = _period_range(db, start_period_id, end_period_id)
    period_ids = [period.id for period in periods]

    institution_stmt = select(Institution).order_by(Institution.short_name.asc())
    if institution_ids:
        institution_stmt = institution_stmt.where(Institution.id.in_(institution_ids))
    institutions = db.execute(institution_stmt).scalars().all()
    if not institutions:
        raise HTTPException(status_code=400, detail="No institutions match the report selection")

    selected_ids = [institution.id for institution in institutions]
    if institution_ids:
        found_ids = set(selected_ids)
        missing = [iid for iid in institution_ids if iid not in found_ids]
        if missing:
            raise HTTPException(status_code=400, detail=f"Unknown institution ids: {', '.join(missing)}")

    model_maps = {}
    for model in REPORT_MODELS:
        model_maps[model] = _map_by_institution_period(
            db.execute(
                select(model).where(
                    model.institution_id.in_(selected_ids),
                    model.reporting_period_id.in_(period_ids),
                )
            ).scalars().all()
        )

    period_by_id = {period.id: period for period in periods}
    rows: list[UcarReportRow] = []
    high_risk_count = 0
    success_values: list[float] = []
    budget_usage_values: list[float] = []
    total_budget_allocated = 0.0
    total_budget_consumed = 0.0

    for institution in institutions:
        for period_id in period_ids:
            key = (institution.id, period_id)
            academic = model_maps[AcademicKpi].get(key)
            insertion = model_maps[InsertionKpi].get(key)
            finance = model_maps[FinanceKpi].get(key)
            hr = model_maps[HrKpi].get(key)
            research = model_maps[ResearchKpi].get(key)
            infrastructure = model_maps[InfrastructureKpi].get(key)
            partnership = model_maps[PartnershipKpi].get(key)
            esg = model_maps[EsgKpi].get(key)

            budget_usage = None
            if finance and finance.budget_allocated > 0:
                budget_usage = round(finance.budget_consumed / finance.budget_allocated * 100.0, 2)
                budget_usage_values.append(budget_usage)
                total_budget_allocated += finance.budget_allocated
                total_budget_consumed += finance.budget_consumed

            risk_score = None
            risk_level = None
            risk_summary = None
            if academic and insertion and finance:
                risk = compute_institution_risk(
                    success_rate=academic.success_rate,
                    attendance_rate=academic.attendance_rate,
                    dropout_rate=academic.dropout_rate,
                    abandonment_rate=academic.abandonment_rate,
                    employability_rate=insertion.employability_rate,
                    budget_allocated=finance.budget_allocated,
                    budget_consumed=finance.budget_consumed,
                    absenteeism_rate=hr.absenteeism_rate if hr else None,
                    team_stability_index=hr.team_stability_index if hr else None,
                    maintenance_backlog_days=infrastructure.maintenance_backlog_days if infrastructure else None,
                )
                risk_score = risk.score
                risk_level = risk.level
                risk_summary = risk.summary
                if risk.level == "High":
                    high_risk_count += 1

            if academic:
                success_values.append(academic.success_rate)

            period = period_by_id[period_id]
            rows.append(
                UcarReportRow(
                    institutionId=institution.id,
                    institutionShortName=institution.short_name,
                    institutionName=institution.name,
                    region=institution.region,
                    periodId=period.id,
                    periodLabel=period.label,
                    successRate=academic.success_rate if academic else None,
                    attendanceRate=academic.attendance_rate if academic else None,
                    repetitionRate=academic.repetition_rate if academic else None,
                    dropoutRate=academic.dropout_rate if academic else None,
                    abandonmentRate=academic.abandonment_rate if academic else None,
                    employabilityRate=insertion.employability_rate if insertion else None,
                    insertionDelayMonths=insertion.insertion_delay_months if insertion else None,
                    budgetAllocated=finance.budget_allocated if finance else None,
                    budgetConsumed=finance.budget_consumed if finance else None,
                    budgetUsage=budget_usage,
                    costPerStudent=finance.cost_per_student if finance else None,
                    teachingHeadcount=hr.teaching_headcount if hr else None,
                    adminHeadcount=hr.admin_headcount if hr else None,
                    absenteeismRate=hr.absenteeism_rate if hr else None,
                    publicationsCount=research.publications_count if research else None,
                    activeProjects=research.active_projects if research else None,
                    fundingSecuredTnd=research.funding_secured_tnd if research else None,
                    classroomOccupancyPct=infrastructure.classroom_occupancy_pct if infrastructure else None,
                    equipmentAvailabilityPct=infrastructure.equipment_availability_pct if infrastructure else None,
                    activeAgreementsCount=partnership.active_agreements_count if partnership else None,
                    studentMobilityIncoming=partnership.student_mobility_incoming if partnership else None,
                    studentMobilityOutgoing=partnership.student_mobility_outgoing if partnership else None,
                    energyConsumptionIndex=esg.energy_consumption_index if esg else None,
                    carbonFootprintIndex=esg.carbon_footprint_index if esg else None,
                    recyclingRate=esg.recycling_rate if esg else None,
                    mobilityIndex=esg.mobility_index if esg else None,
                    riskScore=risk_score,
                    riskLevel=risk_level,
                    riskSummary=risk_summary,
                )
            )

    return UcarReportResponse(
        generatedAt=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        filters=UcarReportFilters(
            startPeriodId=start_period_id,
            endPeriodId=end_period_id,
            institutionIds=selected_ids,
        ),
        summary=UcarReportSummary(
            institutionCount=len(institutions),
            periodCount=len(periods),
            rowCount=len(rows),
            academicAverage=round(sum(success_values) / len(success_values), 2) if success_values else None,
            budgetUsageAverage=round(sum(budget_usage_values) / len(budget_usage_values), 2) if budget_usage_values else None,
            highRiskCount=high_risk_count,
            totalBudgetAllocated=round(total_budget_allocated, 2),
            totalBudgetConsumed=round(total_budget_consumed, 2),
        ),
        rows=rows,
    )
