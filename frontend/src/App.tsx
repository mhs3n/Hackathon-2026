import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import { AppShell, type SidebarItem } from "./components/layout/AppShell";
import { DataImportPage } from "./pages/DataImportPage";
import { InstitutionStudentsLevelPage } from "./pages/InstitutionStudentsLevelPage";
import { InstitutionRiskListPage } from "./pages/InstitutionRiskListPage";
import { InstitutionReportPage } from "./pages/InstitutionReportPage";
import { StudentReportPage } from "./pages/student/StudentReportPage";
import { isStudentsPanelEnabled } from "./lib/institutionStudentsMock";
import { FutureModulePage } from "./pages/FutureModulePage";
import { InstitutionDetailPage } from "./pages/InstitutionDetailPage";
import { InstitutionDashboard } from "./pages/InstitutionDashboard";
import { InstitutionsPage } from "./pages/InstitutionsPage";
import { InstitutionIsoPage, UcarIsoPage } from "./pages/IsoCertificatesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { AcademicRecordPage } from "./pages/student/AcademicRecordPage";
import { AiGuidancePage } from "./pages/student/AiGuidancePage";
import { RegistrationCertificatePage } from "./pages/student/RegistrationCertificatePage";
import { StudentAcademicKpiPage } from "./pages/student/kpi/StudentAcademicKpiPage";
import { StudentAttendanceKpiPage } from "./pages/student/kpi/StudentAttendanceKpiPage";
import { StudentEngagementKpiPage } from "./pages/student/kpi/StudentEngagementKpiPage";
import { StudentSkillsKpiPage } from "./pages/student/kpi/StudentSkillsKpiPage";
import { StudentWellnessKpiPage } from "./pages/student/kpi/StudentWellnessKpiPage";
import { UcarAdminDashboard } from "./pages/UcarAdminDashboard";
import { AcademicKpiPage } from "./pages/kpi/AcademicKpiPage";
import { FinanceKpiPage } from "./pages/kpi/FinanceKpiPage";
import { HrKpiPage } from "./pages/kpi/HrKpiPage";
import { InfrastructureKpiPage } from "./pages/kpi/InfrastructureKpiPage";
import { InsertionKpiPage } from "./pages/kpi/InsertionKpiPage";
import { PartnershipKpiPage } from "./pages/kpi/PartnershipKpiPage";
import { ResearchKpiPage } from "./pages/kpi/ResearchKpiPage";
import { UcarKpiComparisonPage } from "./pages/kpi/UcarKpiComparisonPage";
import { UcarRiskMonitoringPage } from "./pages/kpi/UcarRiskMonitoringPage";
import { RequireAuth, RequireRole, getHomePath } from "./routes/guards";

function AuthHomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomePath(user.role)} replace />;
}

function InstitutionAppShell() {
  const { user } = useAuth();
  const showStudents = isStudentsPanelEnabled(user?.institutionId);

  const items: SidebarItem[] = [
    { to: "/institution/dashboard", label: "Institution Dashboard", icon: "dashboard" },
    {
      label: "KPI Monitoring",
      icon: "monitoring",
      children: [
        { to: "/institution/kpi/academic", label: "Academic", icon: "academic" },
        { to: "/institution/kpi/insertion", label: "Insertion", icon: "insertion" },
        { to: "/institution/kpi/finance", label: "Finance", icon: "finance" },
        { to: "/institution/kpi/hr", label: "Human Resources", icon: "hr" },
        { to: "/institution/kpi/research", label: "Research", icon: "research" },
        { to: "/institution/kpi/infrastructure", label: "Infrastructure", icon: "infrastructure" },
        { to: "/institution/kpi/partnership", label: "Partnerships", icon: "partnership" },
      ],
    },
    { to: "/institution/iso", label: "ISO Certifications", icon: "iso" },
    { to: "/institution/data-import", label: "Data Import", icon: "import" },
  ];

  if (showStudents) {
    items.push({
      label: "Students",
      icon: "hr",
      children: [
        { to: "/institution/students/first-grade", label: "First grade", icon: "academic" },
        { to: "/institution/students/second-grade", label: "Second grade", icon: "academic" },
        { to: "/institution/students/third-grade", label: "Third grade", icon: "academic" },
        { to: "/institution/students/master-degree", label: "Master degree", icon: "academic" },
      ],
    });
  }

  items.push(
    { to: "/institution/student-risk-list", label: "Student Risk List", icon: "risk" },
    { to: "/institution/report", label: "Generate Institution Report", icon: "reports" },
  );

  return <AppShell items={items} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AuthHomeRedirect />} />

      <Route element={<RequireAuth />}>
        <Route element={<RequireRole role="ucar_admin" />}>
          <Route
            path="/admin"
            element={
              <AppShell
                items={[
                  { to: "/admin/dashboard", label: "Overview", icon: "dashboard" },
                  { to: "/admin/institutions", label: "View All Institutions", icon: "institutions" },
                  {
                    label: "KPI Monitoring",
                    icon: "monitoring",
                    children: [
                      { to: "/admin/kpi-comparison", label: "Comparison Overview", icon: "kpi" },
                      { to: "/admin/risk-monitoring", label: "Risk Monitoring", icon: "risk" },
                    ],
                  },
                  { to: "/admin/iso", label: "ISO Certifications", icon: "iso" },
                  { to: "/admin/data-import", label: "Data Import", icon: "import" },
                  { to: "/admin/reports", label: "Generate UCAR Report", icon: "reports" },
                ]}
              />
            }
          >
            <Route path="dashboard" element={<UcarAdminDashboard />} />
            <Route path="institutions" element={<InstitutionsPage />} />
            <Route path="institutions/:institutionId" element={<InstitutionDetailPage />} />
            <Route path="data-import" element={<DataImportPage />} />
            <Route path="kpi-comparison" element={<UcarKpiComparisonPage />} />
            <Route path="risk-monitoring" element={<UcarRiskMonitoringPage />} />
            <Route path="iso" element={<UcarIsoPage />} />
            <Route
              path="reports"
              element={
                <ReportsPage
                  title="Generate UCAR Report"
                  description="A central export surface for leadership-ready cross-institution reporting."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole role="institution_admin" />}>
          <Route path="/institution" element={<InstitutionAppShell />}>
            <Route path="dashboard" element={<InstitutionDashboard />} />
            <Route path="data-import" element={<DataImportPage />} />
            <Route path="students/:levelSlug" element={<InstitutionStudentsLevelPage />} />
            <Route path="kpi/academic" element={<AcademicKpiPage />} />
            <Route path="kpi/insertion" element={<InsertionKpiPage />} />
            <Route path="kpi/finance" element={<FinanceKpiPage />} />
            <Route path="kpi/hr" element={<HrKpiPage />} />
            <Route path="kpi/research" element={<ResearchKpiPage />} />
            <Route path="kpi/infrastructure" element={<InfrastructureKpiPage />} />
            <Route path="kpi/partnership" element={<PartnershipKpiPage />} />
            <Route path="iso" element={<InstitutionIsoPage />} />
            <Route path="student-risk-list" element={<InstitutionRiskListPage />} />
            <Route path="report" element={<InstitutionReportPage />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="student" />}>
          <Route
            path="/student"
            element={
              <AppShell
                items={[
                  { to: "/student/dashboard", label: "Student Dashboard", icon: "dashboard" },
                  { to: "/student/academic-record", label: "Academic Record", icon: "record" },
                  {
                    label: "KPI Monitoring",
                    icon: "monitoring",
                    children: [
                      { to: "/student/kpi/academic", label: "Academic", icon: "academic" },
                      { to: "/student/kpi/attendance", label: "Attendance", icon: "kpi" },
                      { to: "/student/kpi/engagement", label: "Engagement", icon: "kpi" },
                      { to: "/student/kpi/wellness", label: "Wellness", icon: "kpi" },
                      { to: "/student/kpi/skills", label: "Skills & Career", icon: "kpi" },
                    ],
                  },
                  { to: "/student/ai-guidance", label: "AI Guidance", icon: "guidance" },
                  { to: "/student/certificate", label: "Registration Certificate", icon: "record" },
                  { to: "/student/report", label: "Generate My Report", icon: "reports" },
                ]}
              />
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="academic-record" element={<AcademicRecordPage />} />
            <Route path="kpi/academic" element={<StudentAcademicKpiPage />} />
            <Route path="kpi/attendance" element={<StudentAttendanceKpiPage />} />
            <Route path="kpi/engagement" element={<StudentEngagementKpiPage />} />
            <Route path="kpi/wellness" element={<StudentWellnessKpiPage />} />
            <Route path="kpi/skills" element={<StudentSkillsKpiPage />} />
            <Route path="ai-guidance" element={<AiGuidancePage />} />
            <Route path="certificate" element={<RegistrationCertificatePage />} />
            <Route path="report" element={<StudentReportPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
