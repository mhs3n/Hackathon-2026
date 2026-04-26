import type { StudentDashboardView } from "../types";

// Deterministic pseudo-random based on a string seed (so a given student
// always sees the same module/grade breakdown across reloads).
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MODULE_CATALOG = [
  { code: "CS101", name: "Algorithms" },
  { code: "CS215", name: "Data Structures" },
  { code: "MA110", name: "Linear Algebra" },
  { code: "MA220", name: "Probability" },
  { code: "EN105", name: "Technical English" },
  { code: "DB330", name: "Databases" },
  { code: "AI410", name: "Machine Learning" },
  { code: "SE250", name: "Software Engineering" },
];

export type ModuleGrade = {
  code: string;
  name: string;
  grade: number;
  attendance: number;
  credits: number;
  status: "passing" | "at_risk" | "failing";
};

export type SemesterPoint = {
  name: string;
  grade: number;
  attendance: number;
};

export type AttendanceWeekPoint = {
  name: string;
  attendance: number;
};

export type PeerComparePoint = {
  name: string;
  you: number;
  peer: number;
};

export type SkillScore = { name: string; value: number };

export type StudentDerived = {
  modules: ModuleGrade[];
  semesterTrend: SemesterPoint[];
  attendanceWeekly: AttendanceWeekPoint[];
  peerCompare: PeerComparePoint[];
  riskForecast: { name: string; actual?: number; forecast?: number }[];
  engagementScore: number;
  consistencyScore: number;
  wellnessScore: number;
  passingCount: number;
  atRiskCount: number;
  failingCount: number;
  gpa: number;
  // Engagement breakdown
  participationScore: number;
  punctualityScore: number;
  assignmentSubmissionRate: number;
  forumActivityScore: number;
  // Wellness sub-indicators
  workloadBalance: number;
  sleepIndex: number;
  stressIndex: number; // higher = more stress
  socialIntegration: number;
  // Skills (career readiness)
  technicalSkills: SkillScore[];
  softSkills: SkillScore[];
  internshipReadiness: number;
  cvCompleteness: number;
  languageLevel: number;
  // Attendance breakdown
  absenceReasons: { name: string; value: number }[];
  monthlyAttendance: { name: string; value: number }[];
};

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

export function deriveStudent(snapshot: StudentDashboardView, studentProfileId: string): StudentDerived {
  const rng = mulberry32(hashSeed(studentProfileId || snapshot.studentName));
  const baseGrade = snapshot.averageGrade; // /20
  const baseAttendance = snapshot.attendance; // %
  const baseRisk = snapshot.riskScore; // /100

  // Modules (6 of 8 picked deterministically)
  const moduleSet = MODULE_CATALOG.slice(0, 6);
  const modules: ModuleGrade[] = moduleSet.map((m) => {
    const drift = (rng() - 0.5) * 5; // +/- 2.5 around the avg /20
    const grade = +clamp(baseGrade + drift, 0, 20).toFixed(1);
    const attDrift = (rng() - 0.5) * 18;
    const attendance = Math.round(clamp(baseAttendance + attDrift, 30, 100));
    let status: ModuleGrade["status"] = "passing";
    if (grade < 10) status = "failing";
    else if (grade < 12) status = "at_risk";
    return {
      code: m.code,
      name: m.name,
      grade,
      attendance,
      credits: 3 + Math.round(rng() * 2),
      status,
    };
  });

  const passingCount = modules.filter((m) => m.status === "passing").length;
  const atRiskCount = modules.filter((m) => m.status === "at_risk").length;
  const failingCount = modules.filter((m) => m.status === "failing").length;
  const gpa = +(modules.reduce((acc, m) => acc + m.grade, 0) / modules.length).toFixed(2);

  // Semester trend (last 4 + current)
  const labels = ["S1 23/24", "S2 23/24", "S1 24/25", "S2 24/25", "Current"];
  const semesterTrend: SemesterPoint[] = labels.map((name, idx) => {
    const progress = idx / (labels.length - 1);
    const target = baseGrade;
    const start = clamp(baseGrade - 2 + (rng() - 0.5), 6, 18);
    const grade = +clamp(start + (target - start) * progress + (rng() - 0.5) * 0.6, 0, 20).toFixed(1);
    const attendance = Math.round(
      clamp(baseAttendance - 6 + (baseAttendance - (baseAttendance - 6)) * progress + (rng() - 0.5) * 5, 30, 100),
    );
    return { name, grade, attendance };
  });

  // Weekly attendance (last 8 weeks)
  const attendanceWeekly: AttendanceWeekPoint[] = Array.from({ length: 8 }, (_, i) => ({
    name: `W${i + 1}`,
    attendance: Math.round(clamp(baseAttendance + (rng() - 0.5) * 22, 20, 100)),
  }));

  // Peer comparison (you vs institution average)
  const peerCompare: PeerComparePoint[] = [
    { name: "Avg grade", you: +(baseGrade * 5).toFixed(1), peer: 68 },
    { name: "Attendance", you: baseAttendance, peer: 78 },
    { name: "On-time", you: Math.round(clamp(85 - baseRisk * 0.4, 30, 99)), peer: 72 },
    { name: "Engagement", you: Math.round(clamp(70 + (baseGrade - 12) * 4, 20, 99)), peer: 65 },
  ];

  // Risk forecast (5 historic + 1 forecast point)
  const riskForecast = [
    { name: "S1 23/24", actual: Math.round(clamp(baseRisk + (rng() - 0.5) * 18, 0, 100)) },
    { name: "S2 23/24", actual: Math.round(clamp(baseRisk + (rng() - 0.5) * 16, 0, 100)) },
    { name: "S1 24/25", actual: Math.round(clamp(baseRisk + (rng() - 0.5) * 12, 0, 100)) },
    { name: "S2 24/25", actual: Math.round(clamp(baseRisk + (rng() - 0.5) * 8, 0, 100)) },
    { name: "Current", actual: baseRisk },
    { name: "Next (AI)", forecast: Math.round(clamp(baseRisk + (baseRisk > 50 ? 6 : -4), 0, 100)) },
  ];

  // Soft scores derived from main signals
  const engagementScore = Math.round(clamp(0.6 * baseAttendance + 2 * baseGrade - 0.2 * baseRisk, 0, 100));
  const consistencyScore = Math.round(clamp(95 - baseRisk * 0.5 - failingCount * 6, 0, 100));
  const wellnessScore = Math.round(clamp(80 - baseRisk * 0.4 + (baseAttendance - 70) * 0.3, 0, 100));

  // Engagement breakdown
  const participationScore = Math.round(clamp(engagementScore + (rng() - 0.5) * 14, 0, 100));
  const punctualityScore = Math.round(clamp(baseAttendance + (rng() - 0.5) * 12, 0, 100));
  const assignmentSubmissionRate = Math.round(
    clamp(75 + baseGrade * 1.2 - baseRisk * 0.3 + (rng() - 0.5) * 12, 0, 100),
  );
  const forumActivityScore = Math.round(clamp(40 + (engagementScore - 50) + (rng() - 0.5) * 20, 0, 100));

  // Wellness sub-indicators
  const workloadBalance = Math.round(clamp(80 - baseRisk * 0.5 + (rng() - 0.5) * 14, 0, 100));
  const sleepIndex = Math.round(clamp(70 - baseRisk * 0.3 + (rng() - 0.5) * 18, 0, 100));
  const stressIndex = Math.round(clamp(30 + baseRisk * 0.5 + (rng() - 0.5) * 14, 0, 100));
  const socialIntegration = Math.round(clamp(65 + (engagementScore - 50) * 0.6 + (rng() - 0.5) * 16, 0, 100));

  // Skills
  const techBase = Math.round(clamp(baseGrade * 4 + (rng() - 0.5) * 10, 0, 100));
  const softBase = Math.round(clamp(engagementScore + (rng() - 0.5) * 12, 0, 100));
  const technicalSkills: SkillScore[] = [
    { name: "Programming", value: Math.round(clamp(techBase + (rng() - 0.5) * 14, 0, 100)) },
    { name: "Algorithms", value: Math.round(clamp(techBase + (rng() - 0.5) * 16, 0, 100)) },
    { name: "Databases", value: Math.round(clamp(techBase + (rng() - 0.5) * 18, 0, 100)) },
    { name: "Web/Mobile", value: Math.round(clamp(techBase + (rng() - 0.5) * 20, 0, 100)) },
    { name: "AI / Data", value: Math.round(clamp(techBase + (rng() - 0.5) * 22, 0, 100)) },
  ];
  const softSkills: SkillScore[] = [
    { name: "Communication", value: Math.round(clamp(softBase + (rng() - 0.5) * 12, 0, 100)) },
    { name: "Teamwork", value: Math.round(clamp(softBase + (rng() - 0.5) * 14, 0, 100)) },
    { name: "Problem solving", value: Math.round(clamp(softBase + (rng() - 0.5) * 12, 0, 100)) },
    { name: "Leadership", value: Math.round(clamp(softBase + (rng() - 0.5) * 18, 0, 100)) },
    { name: "Time mgmt", value: Math.round(clamp(softBase + (rng() - 0.5) * 14, 0, 100)) },
  ];
  const internshipReadiness = Math.round(
    clamp(0.4 * techBase + 0.3 * softBase + 0.3 * baseAttendance, 0, 100),
  );
  const cvCompleteness = Math.round(clamp(50 + engagementScore * 0.4 + (rng() - 0.3) * 20, 0, 100));
  const languageLevel = Math.round(clamp(60 + (rng() - 0.4) * 30, 20, 100));

  // Absence reasons (sums to absence rate ~ approx)
  const absent = Math.max(100 - baseAttendance, 0);
  const r1 = rng();
  const r2 = rng();
  const r3 = rng();
  const r4 = rng();
  const total = r1 + r2 + r3 + r4 || 1;
  const absenceReasons = [
    { name: "Health", value: Math.round((absent * r1) / total) },
    { name: "Personal", value: Math.round((absent * r2) / total) },
    { name: "Transport", value: Math.round((absent * r3) / total) },
    { name: "Unjustified", value: Math.round((absent * r4) / total) },
  ];

  // Monthly attendance over current semester (5 months)
  const monthlyAttendance = ["Sep", "Oct", "Nov", "Dec", "Jan"].map((m) => ({
    name: m,
    value: Math.round(clamp(baseAttendance + (rng() - 0.5) * 14, 30, 100)),
  }));

  return {
    modules,
    semesterTrend,
    attendanceWeekly,
    peerCompare,
    riskForecast,
    engagementScore,
    consistencyScore,
    wellnessScore,
    passingCount,
    atRiskCount,
    failingCount,
    gpa,
    participationScore,
    punctualityScore,
    assignmentSubmissionRate,
    forumActivityScore,
    workloadBalance,
    sleepIndex,
    stressIndex,
    socialIntegration,
    technicalSkills,
    softSkills,
    internshipReadiness,
    cvCompleteness,
    languageLevel,
    absenceReasons,
    monthlyAttendance,
  };
}
