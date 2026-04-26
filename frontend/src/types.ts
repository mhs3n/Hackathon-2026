export type UserRole = "ucar_admin" | "institution_admin" | "student";

export type DemoUser = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  institutionId?: string;
  studentProfileId?: string;
  universityId?: string;
  universityName?: string;
  universityShortName?: string;
  universityLogoPath?: string;
  institutionName?: string;
  institutionShortName?: string;
  institutionLogoPath?: string;
};

export type Institution = {
  id: string;
  universityId?: string;
  name: string;
  shortName: string;
  region: string;
  logoPath: string;
  successRate: number;
  attendanceRate: number;
  employabilityRate: number;
  dropoutRate: number;
  budgetUsage: number;
  energyUsageIndex: number;
  riskLevel: "Low" | "Medium" | "High";
};

export type StudentRisk = {
  id: string;
  name: string;
  attendance: number;
  averageGrade: number;
  riskScore: number;
  reason: string;
};

export type AiFactor = {
  feature: string;
  value: number;
  impact: number;
  direction: string;
  explanation: string;
};

export type AiAssessment = {
  score: number;
  level: "Low" | "Medium" | "High";
  summary: string;
  topFactors: AiFactor[];
};

export type KpiHistorySeries = {
  metric: string;
  values: number[];
  forecast: number;
};

export type KpiHistoryResponse = {
  domain: string;
  institutionId: string;
  periods: string[];
  forecastPeriod: string;
  series: KpiHistorySeries[];
};

export type StudentSnapshot = {
  studentName: string;
  institutionName: string;
  averageGrade: number;
  attendance: number;
  riskScore: number;
  riskExplanation: string;
  recommendations: string[];
  aiAssessment?: AiAssessment | null;
  studentCode?: string | null;
  programName?: string | null;
  levelLabel?: string | null;
  institutionId?: string | null;
  institutionShortName?: string | null;
  institutionRegion?: string | null;
  universityName?: string | null;
  universityShortName?: string | null;
  academicYear?: string | null;
};

export type AppUserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  studentProfileId?: string;
};

export type ReportingPeriodRecord = {
  id: string;
  label: string;
  year: number;
  semester: string;
  startsOn: string;
  endsOn: string;
};

export type AcademicKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  successRate: number;
  attendanceRate: number;
  repetitionRate: number;
  dropoutRate: number;
  abandonmentRate: number;
};

export type InsertionKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  nationalConventionRate: number;
  internationalConventionRate: number;
  employabilityRate: number;
  insertionDelayMonths: number;
};

export type FinanceKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  budgetAllocated: number;
  budgetConsumed: number;
  costPerStudent: number;
};

export type EsgKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  energyConsumptionIndex: number;
  carbonFootprintIndex: number;
  recyclingRate: number;
  mobilityIndex: number;
};

export type ProcessKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  processKey: string;
  processLabel: string;
  metricLabel: string;
  metricValue: number;
  metricUnit: string;
};

export type StudentProfileRecord = {
  id: string;
  institutionId: string;
  studentCode: string;
  fullName: string;
  programName: string;
  levelLabel: string;
};

export type StudentMetricRecord = {
  id: string;
  studentProfileId: string;
  reportingPeriodId: string;
  averageGrade: number;
  attendanceRate: number;
  riskScore: number;
};

export type AnomalyMeta = {
  metric: string;
  value: number;
  peerMean: number;
  zScore: number;
  direction: "above" | "below";
};

export type RiskAlertRecord = {
  id: string;
  scopeType: "institution" | "student";
  institutionId?: string;
  studentProfileId?: string;
  reportingPeriodId: string;
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  predictedImpact: string;
  anomaly?: AnomalyMeta | null;
};

export type RecommendationRecord = {
  id: string;
  studentProfileId: string;
  reportingPeriodId: string;
  recommendationText: string;
  displayOrder: number;
};

export type GeneratedReportRecord = {
  id: string;
  scopeType: "ucar" | "institution" | "student";
  institutionId?: string;
  studentProfileId?: string;
  reportingPeriodId: string;
  title: string;
  generatedAt: string;
  summaryText: string;
};

export type UcarDashboardView = {
  institutions: Institution[];
  academicAverage: number;
  budgetAverage: number;
  criticalAlerts: RiskAlertRecord[];
  generatedReportSummary: string;
};

export type InstitutionDashboardView = {
  institution: Institution;
  academic: AcademicKpiRecord;
  insertion: InsertionKpiRecord;
  finance: FinanceKpiRecord;
  hr: HrKpiRecord | null;
  research: ResearchKpiRecord | null;
  infrastructure: InfrastructureKpiRecord | null;
  partnership: PartnershipKpiRecord | null;
  process: ProcessKpiRecord[];
  riskList: StudentRisk[];
  aiAssessment?: AiAssessment | null;
};

export type StudentDashboardView = StudentSnapshot;

export type AuthLoginResponse = {
  accessToken: string;
  user: DemoUser;
};

export type HrKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  teachingHeadcount: number;
  adminHeadcount: number;
  absenteeismRate: number;
  trainingCompletedPct: number;
  teachingLoadHours: number;
  teamStabilityIndex: number;
};

export type ResearchKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  publicationsCount: number;
  activeProjects: number;
  fundingSecuredTnd: number;
  academicPartnerships: number;
  patentsFiled: number;
};

export type InfrastructureKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  classroomOccupancyPct: number;
  equipmentAvailabilityPct: number;
  itEquipmentStatus: number;
  ongoingProjectsCount: number;
  maintenanceBacklogDays: number;
};

export type PartnershipKpiRecord = {
  id: string;
  institutionId: string;
  reportingPeriodId: string;
  activeAgreementsCount: number;
  studentMobilityIncoming: number;
  studentMobilityOutgoing: number;
  internationalProjects: number;
  academicNetworksCount: number;
};
