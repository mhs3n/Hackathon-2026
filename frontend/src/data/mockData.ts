import type {
  AcademicKpiRecord,
  AppUserRecord,
  EsgKpiRecord,
  FinanceKpiRecord,
  GeneratedReportRecord,
  Institution,
  InsertionKpiRecord,
  ProcessKpiRecord,
  RecommendationRecord,
  ReportingPeriodRecord,
  RiskAlertRecord,
  StudentDashboardView,
  StudentMetricRecord,
  StudentProfileRecord,
  StudentRisk,
  UcarDashboardView,
  InstitutionDashboardView,
  UserRole,
} from "../types";

export const institutions: Institution[] = [
  {
    id: "fst",
    name: "Faculty of Sciences of Tunis",
    shortName: "FST",
    region: "Tunis",
    logoPath: "/assets/ucar-logo.png",
    successRate: 78,
    attendanceRate: 82,
    employabilityRate: 74,
    dropoutRate: 12.4,
    budgetUsage: 68,
    energyUsageIndex: 61,
    riskLevel: "Medium",
  },
  {
    id: "fsegn",
    name: "Faculty of Economic Sciences and Management of Nabeul",
    shortName: "FSEGN",
    region: "Nabeul",
    logoPath: "/assets/ucar-logo.png",
    successRate: 84,
    attendanceRate: 87,
    employabilityRate: 78,
    dropoutRate: 8.1,
    budgetUsage: 81,
    energyUsageIndex: 54,
    riskLevel: "Low",
  },
  {
    id: "insat",
    name: "National Institute of Applied Science and Technology",
    shortName: "INSAT",
    region: "Ariana",
    logoPath: "/assets/insat-logo.png",
    successRate: 73,
    attendanceRate: 76,
    employabilityRate: 82,
    dropoutRate: 17.2,
    budgetUsage: 59,
    energyUsageIndex: 72,
    riskLevel: "High",
  },
];

export const users: AppUserRecord[] = [
  {
    id: "user_ucar_01",
    fullName: "Leila Mansour",
    email: "leila.mansour@ucar.tn",
    role: "ucar_admin",
  },
  {
    id: "user_inst_01",
    fullName: "Sami Ben Ali",
    email: "sami.benali@insat.ucar.tn",
    role: "institution_admin",
    institutionId: "insat",
  },
  {
    id: "user_student_01",
    fullName: "Ahmed Gharbi",
    email: "ahmed.gharbi@insat.ucar.tn",
    role: "student",
    institutionId: "insat",
    studentProfileId: "student_insat_01",
  },
];

export const reportingPeriods: ReportingPeriodRecord[] = [
  {
    id: "rp_2026_s2",
    label: "Semester 2 - 2026",
    year: 2026,
    semester: "S2",
    startsOn: "2026-01-15",
    endsOn: "2026-06-30",
  },
];

export const academicKpis: AcademicKpiRecord[] = [
  {
    id: "ak_fst_2026s2",
    institutionId: "fst",
    reportingPeriodId: "rp_2026_s2",
    successRate: 78,
    attendanceRate: 82,
    repetitionRate: 7.4,
    dropoutRate: 12.4,
    abandonmentRate: 5.2,
  },
  {
    id: "ak_fsegn_2026s2",
    institutionId: "fsegn",
    reportingPeriodId: "rp_2026_s2",
    successRate: 84,
    attendanceRate: 87,
    repetitionRate: 4.8,
    dropoutRate: 8.1,
    abandonmentRate: 3.3,
  },
  {
    id: "ak_insat_2026s2",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    successRate: 73,
    attendanceRate: 76,
    repetitionRate: 9.9,
    dropoutRate: 17.2,
    abandonmentRate: 6.8,
  },
];

export const insertionKpis: InsertionKpiRecord[] = [
  {
    id: "ik_fst_2026s2",
    institutionId: "fst",
    reportingPeriodId: "rp_2026_s2",
    nationalConventionRate: 46,
    internationalConventionRate: 19,
    employabilityRate: 74,
    insertionDelayMonths: 5.2,
  },
  {
    id: "ik_fsegn_2026s2",
    institutionId: "fsegn",
    reportingPeriodId: "rp_2026_s2",
    nationalConventionRate: 58,
    internationalConventionRate: 24,
    employabilityRate: 78,
    insertionDelayMonths: 4.1,
  },
  {
    id: "ik_insat_2026s2",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    nationalConventionRate: 63,
    internationalConventionRate: 31,
    employabilityRate: 82,
    insertionDelayMonths: 3.4,
  },
];

export const financeKpis: FinanceKpiRecord[] = [
  {
    id: "fk_fst_2026s2",
    institutionId: "fst",
    reportingPeriodId: "rp_2026_s2",
    budgetAllocated: 12000000,
    budgetConsumed: 8160000,
    costPerStudent: 5400,
  },
  {
    id: "fk_fsegn_2026s2",
    institutionId: "fsegn",
    reportingPeriodId: "rp_2026_s2",
    budgetAllocated: 9700000,
    budgetConsumed: 7857000,
    costPerStudent: 4900,
  },
  {
    id: "fk_insat_2026s2",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    budgetAllocated: 14300000,
    budgetConsumed: 8437000,
    costPerStudent: 7100,
  },
];

export const esgKpis: EsgKpiRecord[] = [
  {
    id: "ek_fst_2026s2",
    institutionId: "fst",
    reportingPeriodId: "rp_2026_s2",
    energyConsumptionIndex: 61,
    carbonFootprintIndex: 57,
    recyclingRate: 33,
    mobilityIndex: 48,
  },
  {
    id: "ek_fsegn_2026s2",
    institutionId: "fsegn",
    reportingPeriodId: "rp_2026_s2",
    energyConsumptionIndex: 54,
    carbonFootprintIndex: 50,
    recyclingRate: 41,
    mobilityIndex: 55,
  },
  {
    id: "ek_insat_2026s2",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    energyConsumptionIndex: 72,
    carbonFootprintIndex: 69,
    recyclingRate: 28,
    mobilityIndex: 43,
  },
];

export const processKpis: ProcessKpiRecord[] = [
  {
    id: "pk1",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    processKey: "scolarite",
    processLabel: "Scolarité",
    metricLabel: "Taux de présence",
    metricValue: 76,
    metricUnit: "%",
  },
  {
    id: "pk2",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    processKey: "examens",
    processLabel: "Examens",
    metricLabel: "Taux de réussite",
    metricValue: 73,
    metricUnit: "%",
  },
  {
    id: "pk3",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    processKey: "finance",
    processLabel: "Finance",
    metricLabel: "Budget consommé",
    metricValue: 59,
    metricUnit: "%",
  },
  {
    id: "pk4",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    processKey: "recherche",
    processLabel: "Recherche",
    metricLabel: "Projets actifs",
    metricValue: 18,
    metricUnit: "count",
  },
  {
    id: "pk5",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    processKey: "infrastructure",
    processLabel: "Infrastructure",
    metricLabel: "Indice énergie",
    metricValue: 72,
    metricUnit: "index",
  },
];

export const studentProfiles: StudentProfileRecord[] = [
  {
    id: "student_insat_01",
    institutionId: "insat",
    studentCode: "INSAT-2026-001",
    fullName: "Ahmed Gharbi",
    programName: "Computer Engineering",
    levelLabel: "2nd Year",
  },
  {
    id: "student_insat_02",
    institutionId: "insat",
    studentCode: "INSAT-2026-002",
    fullName: "Sarra Louati",
    programName: "Industrial Systems",
    levelLabel: "3rd Year",
  },
  {
    id: "student_fst_01",
    institutionId: "fst",
    studentCode: "FST-2026-003",
    fullName: "Amira Ben Salem",
    programName: "Applied Mathematics",
    levelLabel: "1st Year",
  },
];

export const studentMetrics: StudentMetricRecord[] = [
  {
    id: "sm_insat_01",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    averageGrade: 9.1,
    attendanceRate: 58,
    riskScore: 88,
  },
  {
    id: "sm_insat_02",
    studentProfileId: "student_insat_02",
    reportingPeriodId: "rp_2026_s2",
    averageGrade: 10.4,
    attendanceRate: 62,
    riskScore: 74,
  },
  {
    id: "sm_fst_01",
    studentProfileId: "student_fst_01",
    reportingPeriodId: "rp_2026_s2",
    averageGrade: 11.2,
    attendanceRate: 71,
    riskScore: 68,
  },
];

export const riskAlerts: RiskAlertRecord[] = [
  {
    id: "ra_inst_insat",
    scopeType: "institution",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    severity: "high",
    title: "Institution risk rising",
    explanation:
      "Success and attendance indicators weakened while budget consumption and ESG pressure remain outside the peer median.",
    predictedImpact: "Elevated operational and academic risk next cycle",
  },
  {
    id: "ra_student_ahmed",
    scopeType: "student",
    institutionId: "insat",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    severity: "high",
    title: "Student at academic risk",
    explanation: "Attendance dropped sharply and recent grades remain below cohort average.",
    predictedImpact: "Likely increased dropout risk without intervention",
  },
];

export const recommendations: RecommendationRecord[] = [
  {
    id: "rec1",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    recommendationText: "Meet your academic advisor this week.",
    displayOrder: 1,
  },
  {
    id: "rec2",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    recommendationText: "Prioritize the two modules with the steepest grade decline.",
    displayOrder: 2,
  },
  {
    id: "rec3",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    recommendationText: "Follow the attendance recovery plan for the next 14 days.",
    displayOrder: 3,
  },
];

export const generatedReports: GeneratedReportRecord[] = [
  {
    id: "gr_ucar_01",
    scopeType: "ucar",
    reportingPeriodId: "rp_2026_s2",
    title: "UCAR Consolidated Performance Report",
    generatedAt: "2026-04-25T12:00:00Z",
    summaryText:
      "Cross-establishment monitoring shows INSAT as the highest-priority intervention site this period.",
  },
  {
    id: "gr_inst_01",
    scopeType: "institution",
    institutionId: "insat",
    reportingPeriodId: "rp_2026_s2",
    title: "INSAT Institutional Summary",
    generatedAt: "2026-04-25T12:00:00Z",
    summaryText: "Attendance, student risk, and budget execution require immediate follow-up.",
  },
  {
    id: "gr_student_01",
    scopeType: "student",
    institutionId: "insat",
    studentProfileId: "student_insat_01",
    reportingPeriodId: "rp_2026_s2",
    title: "Student Risk Summary",
    generatedAt: "2026-04-25T12:00:00Z",
    summaryText: "The student requires coordinated academic and attendance intervention.",
  },
];

export const roleLabels: Record<UserRole, string> = {
  ucar_admin: "UCAR Admin",
  institution_admin: "Institution Admin",
  student: "Student",
};

export function getInstitutionById(institutionId?: string) {
  if (!institutionId) {
    return null;
  }
  return institutions.find((institution) => institution.id === institutionId) ?? null;
}

export function getUserById(userId: string) {
  return users.find((user) => user.id === userId) ?? null;
}

export function getInstitutionDashboardData(institutionId: string): InstitutionDashboardView | null {
  const institution = getInstitutionById(institutionId);
  const academic = academicKpis.find((item) => item.institutionId === institutionId);
  const insertion = insertionKpis.find((item) => item.institutionId === institutionId);
  const finance = financeKpis.find((item) => item.institutionId === institutionId);
  const process = processKpis.filter((item) => item.institutionId === institutionId);
  const alerts = riskAlerts.filter((item) => item.scopeType === "student" && item.institutionId === institutionId);

  if (!institution || !academic || !insertion || !finance) {
    return null;
  }

  const riskList: StudentRisk[] = alerts
    .map((alert) => {
      const profile = studentProfiles.find((item) => item.id === alert.studentProfileId);
      const metric = studentMetrics.find((item) => item.studentProfileId === alert.studentProfileId);
      if (!profile || !metric) {
        return null;
      }
      return {
        id: profile.id,
        name: profile.fullName,
        attendance: metric.attendanceRate,
        averageGrade: metric.averageGrade,
        riskScore: metric.riskScore,
        reason: alert.explanation,
      };
    })
    .filter((item): item is StudentRisk => item !== null);

  return {
    institution,
    academic,
    insertion,
    finance,
    hr: null,
    research: null,
    infrastructure: null,
    partnership: null,
    process,
    riskList,
  };
}

export function getStudentDashboardData(studentProfileId: string): StudentDashboardView | null {
  const profile = studentProfiles.find((item) => item.id === studentProfileId);
  const metrics = studentMetrics.find((item) => item.studentProfileId === studentProfileId);
  const alert = riskAlerts.find((item) => item.scopeType === "student" && item.studentProfileId === studentProfileId);
  const actions = recommendations
    .filter((item) => item.studentProfileId === studentProfileId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((item) => item.recommendationText);

  if (!profile || !metrics || !alert) {
    return null;
  }

  const institution = getInstitutionById(profile.institutionId);
  if (!institution) {
    return null;
  }

  return {
    studentName: profile.fullName,
    institutionName: institution.name,
    averageGrade: metrics.averageGrade,
    attendance: metrics.attendanceRate,
    riskScore: metrics.riskScore,
    riskExplanation: alert.explanation,
    recommendations: actions,
  };
}

export function getUcarDashboardData(): UcarDashboardView {
  const generated = generatedReports.find((item) => item.scopeType === "ucar");
  const academicAvg = Math.round(
    academicKpis.reduce((sum, item) => sum + item.successRate, 0) / academicKpis.length,
  );
  const budgetAvg = Math.round(
    financeKpis.reduce((sum, item) => sum + (item.budgetConsumed / item.budgetAllocated) * 100, 0) / financeKpis.length,
  );

  return {
    institutions,
    academicAverage: academicAvg,
    budgetAverage: budgetAvg,
    criticalAlerts: riskAlerts.filter((item) => item.scopeType === "institution" && item.severity === "high"),
    generatedReportSummary: generated?.summaryText ?? "",
  };
}
