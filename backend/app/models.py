from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class University(Base):
    __tablename__ = "universities"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    short_name: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    logo_path: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    university_id: Mapped[str] = mapped_column(Text, ForeignKey("universities.id"), nullable=False)
    short_name: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    region: Mapped[str] = mapped_column(Text, nullable=False)
    logo_path: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)


class AppUser(Base):
    __tablename__ = "app_users"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    institution_id: Mapped[str | None] = mapped_column(Text, ForeignKey("institutions.id"), nullable=True)
    student_profile_id: Mapped[str | None] = mapped_column(Text, ForeignKey("students.id"), nullable=True)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('ucar_admin', 'institution_admin', 'student')", name="ck_app_users_role"),
    )


class ReportingPeriod(Base):
    __tablename__ = "reporting_periods"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    semester: Mapped[str] = mapped_column(Text, nullable=False)
    starts_on: Mapped[str] = mapped_column(Text, nullable=False)
    ends_on: Mapped[str] = mapped_column(Text, nullable=False)


class AcademicKpi(Base):
    __tablename__ = "academic_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    success_rate: Mapped[float] = mapped_column(Float, nullable=False)
    attendance_rate: Mapped[float] = mapped_column(Float, nullable=False)
    repetition_rate: Mapped[float] = mapped_column(Float, nullable=False)
    dropout_rate: Mapped[float] = mapped_column(Float, nullable=False)
    abandonment_rate: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class InsertionKpi(Base):
    __tablename__ = "insertion_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    national_convention_rate: Mapped[float] = mapped_column(Float, nullable=False)
    international_convention_rate: Mapped[float] = mapped_column(Float, nullable=False)
    employability_rate: Mapped[float] = mapped_column(Float, nullable=False)
    insertion_delay_months: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class FinanceKpi(Base):
    __tablename__ = "finance_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    budget_allocated: Mapped[float] = mapped_column(Float, nullable=False)
    budget_consumed: Mapped[float] = mapped_column(Float, nullable=False)
    cost_per_student: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class EsgKpi(Base):
    __tablename__ = "esg_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    energy_consumption_index: Mapped[float] = mapped_column(Float, nullable=False)
    carbon_footprint_index: Mapped[float] = mapped_column(Float, nullable=False)
    recycling_rate: Mapped[float] = mapped_column(Float, nullable=False)
    mobility_index: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class ProcessKpi(Base):
    __tablename__ = "process_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    process_key: Mapped[str] = mapped_column(Text, nullable=False)
    process_label: Mapped[str] = mapped_column(Text, nullable=False)
    metric_label: Mapped[str] = mapped_column(Text, nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    metric_unit: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class StudentProfile(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    student_code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    program_name: Mapped[str] = mapped_column(Text, nullable=False)
    level_label: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class StudentMetric(Base):
    __tablename__ = "student_metrics"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    student_profile_id: Mapped[str] = mapped_column(Text, ForeignKey("students.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    average_grade: Mapped[float] = mapped_column(Float, nullable=False)
    attendance_rate: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    scope_type: Mapped[str] = mapped_column(Text, nullable=False)
    institution_id: Mapped[str | None] = mapped_column(Text, ForeignKey("institutions.id"), nullable=True)
    student_profile_id: Mapped[str | None] = mapped_column(Text, ForeignKey("students.id"), nullable=True)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    severity: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    predicted_impact: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint("scope_type IN ('institution', 'student')", name="ck_risk_alerts_scope_type"),
        CheckConstraint("severity IN ('low', 'medium', 'high')", name="ck_risk_alerts_severity"),
    )


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    student_profile_id: Mapped[str] = mapped_column(Text, ForeignKey("students.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    recommendation_text: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    scope_type: Mapped[str] = mapped_column(Text, nullable=False)
    institution_id: Mapped[str | None] = mapped_column(Text, ForeignKey("institutions.id"), nullable=True)
    student_profile_id: Mapped[str | None] = mapped_column(Text, ForeignKey("students.id"), nullable=True)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[str] = mapped_column(Text, nullable=False)
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint("scope_type IN ('ucar', 'institution', 'student')", name="ck_generated_reports_scope_type"),
    )


class HrKpi(Base):
    __tablename__ = "hr_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    teaching_headcount: Mapped[int] = mapped_column(Integer, nullable=False)
    admin_headcount: Mapped[int] = mapped_column(Integer, nullable=False)
    absenteeism_rate: Mapped[float] = mapped_column(Float, nullable=False)
    training_completed_pct: Mapped[float] = mapped_column(Float, nullable=False)
    teaching_load_hours: Mapped[float] = mapped_column(Float, nullable=False)
    team_stability_index: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class ResearchKpi(Base):
    __tablename__ = "research_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    publications_count: Mapped[int] = mapped_column(Integer, nullable=False)
    active_projects: Mapped[int] = mapped_column(Integer, nullable=False)
    funding_secured_tnd: Mapped[float] = mapped_column(Float, nullable=False)
    academic_partnerships: Mapped[int] = mapped_column(Integer, nullable=False)
    patents_filed: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class InfrastructureKpi(Base):
    __tablename__ = "infrastructure_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    classroom_occupancy_pct: Mapped[float] = mapped_column(Float, nullable=False)
    equipment_availability_pct: Mapped[float] = mapped_column(Float, nullable=False)
    it_equipment_status: Mapped[float] = mapped_column(Float, nullable=False)
    ongoing_projects_count: Mapped[int] = mapped_column(Integer, nullable=False)
    maintenance_backlog_days: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class PartnershipKpi(Base):
    __tablename__ = "partnership_kpis"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    active_agreements_count: Mapped[int] = mapped_column(Integer, nullable=False)
    student_mobility_incoming: Mapped[int] = mapped_column(Integer, nullable=False)
    student_mobility_outgoing: Mapped[int] = mapped_column(Integer, nullable=False)
    international_projects: Mapped[int] = mapped_column(Integer, nullable=False)
    academic_networks_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    institution_id: Mapped[str] = mapped_column(Text, ForeignKey("institutions.id"), nullable=False)
    reporting_period_id: Mapped[str] = mapped_column(Text, ForeignKey("reporting_periods.id"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(Text, ForeignKey("app_users.id"), nullable=True)
    source_file: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(Text, nullable=False)
    domains_written: Mapped[str] = mapped_column(Text, nullable=False)
    raw_kpis: Mapped[str | None] = mapped_column(Text, nullable=True)
    imported_at: Mapped[str] = mapped_column(Text, nullable=False)
