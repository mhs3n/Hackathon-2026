import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { DataImportPage } from "./pages/DataImportPage";
import { FutureModulePage } from "./pages/FutureModulePage";
import { InstitutionDetailPage } from "./pages/InstitutionDetailPage";
import { InstitutionDashboard } from "./pages/InstitutionDashboard";
import { InstitutionsPage } from "./pages/InstitutionsPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportsPage } from "./pages/ReportsPage";
import { StudentDashboard } from "./pages/StudentDashboard";
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
                  { to: "/admin/dashboard", label: "University Dashboard", icon: "dashboard" },
                  { to: "/admin/institutions", label: "View All Institutions", icon: "institutions" },
                  {
                    label: "KPI Monitoring",
                    icon: "monitoring",
                    children: [
                      { to: "/admin/kpi-comparison", label: "Comparison Overview", icon: "kpi" },
                      { to: "/admin/risk-monitoring", label: "Risk Monitoring", icon: "risk" },
                    ],
                  },
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
          <Route
            path="/institution"
            element={
              <AppShell
                items={[
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
                  { to: "/institution/data-import", label: "Data Import", icon: "import" },
                  { to: "/institution/student-risk-list", label: "Student Risk List", icon: "risk", future: true },
                  { to: "/institution/report", label: "Generate Institution Report", icon: "reports" },
                ]}
              />
            }
          >
            <Route path="dashboard" element={<InstitutionDashboard />} />
            <Route path="data-import" element={<DataImportPage />} />
            <Route path="kpi/academic" element={<AcademicKpiPage />} />
            <Route path="kpi/insertion" element={<InsertionKpiPage />} />
            <Route path="kpi/finance" element={<FinanceKpiPage />} />
            <Route path="kpi/hr" element={<HrKpiPage />} />
            <Route path="kpi/research" element={<ResearchKpiPage />} />
            <Route path="kpi/infrastructure" element={<InfrastructureKpiPage />} />
            <Route path="kpi/partnership" element={<PartnershipKpiPage />} />
            <Route
              path="student-risk-list"
              element={
                <FutureModulePage
                  title="Student Risk List"
                  description="Intervention workspace for monitoring and following up on at-risk students."
                  bullets={[
                    "Rank students by risk score and urgency.",
                    "Inspect explainable AI reasons behind the alert.",
                    "Prepare exportable follow-up and intervention lists.",
                  ]}
                />
              }
            />
            <Route
              path="report"
              element={
                <ReportsPage
                  title="Generate Institution Report"
                  description="A local reporting surface for institution management and intervention follow-up."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole role="student" />}>
          <Route
            path="/student"
            element={
              <AppShell
                items={[
                  { to: "/student/dashboard", label: "Student Dashboard", icon: "dashboard" },
                  { to: "/student/academic-record", label: "Academic Record", icon: "record", future: true },
                  { to: "/student/ai-guidance", label: "AI Guidance", icon: "guidance", future: true },
                ]}
              />
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route
              path="academic-record"
              element={
                <FutureModulePage
                  title="Academic Record"
                  description="Detailed view for grades, modules, attendance history, and academic progression."
                  bullets={[
                    "Per-module grades and trends.",
                    "Attendance history by course and activity.",
                    "Semester-level academic progress summary.",
                  ]}
                />
              }
            />
            <Route
              path="ai-guidance"
              element={
                <FutureModulePage
                  title="AI Guidance"
                  description="Personalized explainable guidance based on attendance, grades, and predicted risk."
                  bullets={[
                    "Explain the factors affecting the student risk score.",
                    "Provide actionable recovery recommendations.",
                    "Track whether guidance improved outcomes over time.",
                  ]}
                />
              }
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
