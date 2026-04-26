from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


UserRole = Literal["ucar_admin", "institution_admin", "student"]


class AuthLoginRequest(BaseModel):
    """
    Hackathon-friendly auth:
    - If email is provided, we match an existing seeded user by email.
    - If role is provided, we match the first seeded user with that role.
    """

    email: str | None = None
    role: UserRole | None = None


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    institutionId: str | None = None
    studentProfileId: str | None = None
    universityId: str | None = None
    universityName: str | None = None
    universityShortName: str | None = None
    universityLogoPath: str | None = None
    institutionName: str | None = None
    institutionShortName: str | None = None
    institutionLogoPath: str | None = None


class AuthLoginResponse(BaseModel):
    accessToken: str
    user: AuthUser


class Institution(BaseModel):
    id: str
    universityId: str | None = None
    name: str
    shortName: str
    region: str
    logoPath: str
    successRate: float
    attendanceRate: float
    employabilityRate: float
    dropoutRate: float
    budgetUsage: float
    energyUsageIndex: float
    riskLevel: Literal["Low", "Medium", "High"]


class IngestionPreviewResponse(BaseModel):
    institutionId: str
    institutionName: str
    sourceFile: str
    fileType: str
    rawKpis: dict[str, float | None]
    mapped: dict[str, dict[str, float]]
    alerts: list[str]
    warnings: list[str]


class IngestionCommitRequest(BaseModel):
    institutionId: str
    periodId: str | None = None
    mapped: dict[str, dict[str, float]]
    rawKpis: dict[str, float | None] | None = None
    sourceFile: str | None = None
    fileType: str | None = None


class IngestionCommitResponse(BaseModel):
    institutionId: str
    periodId: str
    written: dict[str, list[str]]
    batchId: str
    importedAt: str


class ReportingPeriodRecord(BaseModel):
    id: str
    label: str
    year: int
    semester: str
    startsOn: str
    endsOn: str


class ImportBatchRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    userId: str | None
    sourceFile: str
    fileType: str
    domainsWritten: dict[str, list[str]]
    importedAt: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    quickActions: list[str] = []


class AnomalyMeta(BaseModel):
    metric: str
    value: float
    peerMean: float
    zScore: float
    direction: Literal["above", "below"]


class RiskAlertRecord(BaseModel):
    id: str
    scopeType: Literal["institution", "student"]
    institutionId: str | None = None
    studentProfileId: str | None = None
    reportingPeriodId: str
    severity: Literal["low", "medium", "high"]
    title: str
    explanation: str
    predictedImpact: str
    anomaly: AnomalyMeta | None = None


class PeriodComparison(BaseModel):
    previousPeriodId: str | None
    previousPeriodLabel: str | None
    academicAverage: int | None
    budgetAverage: int | None
    academicDelta: float | None
    budgetDelta: float | None
    riskHighDelta: int | None


class UcarDashboardView(BaseModel):
    institutions: list[Institution]
    academicAverage: int
    budgetAverage: int
    criticalAlerts: list[RiskAlertRecord]
    generatedReportSummary: str
    comparison: PeriodComparison | None = None


class AcademicKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    successRate: float
    attendanceRate: float
    repetitionRate: float
    dropoutRate: float
    abandonmentRate: float


class InsertionKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    nationalConventionRate: float
    internationalConventionRate: float
    employabilityRate: float
    insertionDelayMonths: float


class FinanceKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    budgetAllocated: float
    budgetConsumed: float
    costPerStudent: float


class ProcessKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    processKey: str
    processLabel: str
    metricLabel: str
    metricValue: float
    metricUnit: str


class StudentRisk(BaseModel):
    id: str
    name: str
    attendance: float
    averageGrade: float
    riskScore: float
    reason: str


class AiFactor(BaseModel):
    feature: str
    value: float
    impact: float
    direction: str
    explanation: str


class AiAssessment(BaseModel):
    score: int
    level: Literal["Low", "Medium", "High"]
    summary: str
    topFactors: list[AiFactor]


class InstitutionDashboardView(BaseModel):
    institution: Institution
    academic: AcademicKpiRecord
    insertion: InsertionKpiRecord
    finance: FinanceKpiRecord
    hr: HrKpiRecord | None = None
    research: ResearchKpiRecord | None = None
    infrastructure: InfrastructureKpiRecord | None = None
    partnership: PartnershipKpiRecord | None = None
    process: list[ProcessKpiRecord]
    riskList: list[StudentRisk]
    aiAssessment: AiAssessment | None = None


class StudentSnapshot(BaseModel):
    studentName: str
    institutionName: str
    averageGrade: float
    attendance: float
    riskScore: float
    riskExplanation: str
    recommendations: list[str]
    aiAssessment: AiAssessment | None = None
    # Profile / registration details
    studentCode: str | None = None
    programName: str | None = None
    levelLabel: str | None = None
    institutionId: str | None = None
    institutionShortName: str | None = None
    institutionRegion: str | None = None
    universityName: str | None = None
    universityShortName: str | None = None
    academicYear: str | None = None


class HrKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    teachingHeadcount: int
    adminHeadcount: int
    absenteeismRate: float
    trainingCompletedPct: float
    teachingLoadHours: float
    teamStabilityIndex: float


class ResearchKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    publicationsCount: int
    activeProjects: int
    fundingSecuredTnd: float
    academicPartnerships: int
    patentsFiled: int


class InfrastructureKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    classroomOccupancyPct: float
    equipmentAvailabilityPct: float
    itEquipmentStatus: float
    ongoingProjectsCount: int
    maintenanceBacklogDays: int


class PartnershipKpiRecord(BaseModel):
    id: str
    institutionId: str
    reportingPeriodId: str
    activeAgreementsCount: int
    studentMobilityIncoming: int
    studentMobilityOutgoing: int
    internationalProjects: int
    academicNetworksCount: int
