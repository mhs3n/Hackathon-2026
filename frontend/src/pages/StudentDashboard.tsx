import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "../auth/AuthContext";
import {
  KpiForecastChart,
  KpiLineChart,
  KpiRadarChart,
  KpiRadialGauge,
} from "../components/charts/KpiCharts";
import { AiAssessmentPanel } from "../components/ui/AiAssessmentPanel";
import { PeriodBadge } from "../components/ui/PeriodBadge";
import { StatCard } from "../components/ui/StatCard";
import { deriveRegistrationMock } from "../lib/studentMockProfile";
import { useStudentSnapshot } from "../lib/useStudentSnapshot";

const QUICK_LINKS = [
  { to: "/student/academic-record", label: "Academic Record", desc: "Grades & attendance history", icon: "📚" },
  { to: "/student/ai-guidance", label: "AI Guidance", desc: "Personalized recommendations", icon: "🤖" },
  { to: "/student/certificate", label: "Registration Certificate", desc: "Download official certificate", icon: "🎓" },
  { to: "/student/report", label: "My Report", desc: "Generate a personal report", icon: "📑" },
];

const KPI_LINKS = [
  { to: "/student/kpi/academic", label: "Academic", desc: "Grades, GPA, modules", icon: "🎓" },
  { to: "/student/kpi/attendance", label: "Attendance", desc: "Presence trends & absences", icon: "📅" },
  { to: "/student/kpi/engagement", label: "Engagement", desc: "Participation & consistency", icon: "⚡" },
  { to: "/student/kpi/wellness", label: "Wellness", desc: "Workload, stress, sleep", icon: "🧘" },
  { to: "/student/kpi/skills", label: "Skills & Career", desc: "Tech, soft skills, readiness", icon: "💼" },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const { snapshot, derived, error, activePeriod } = useStudentSnapshot();
  const seedKey = user?.studentProfileId ?? snapshot?.studentName ?? "student";
  const reg = useMemo(
    () => (snapshot ? deriveRegistrationMock(snapshot, seedKey) : null),
    [snapshot, seedKey],
  );

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Student Dashboard</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!snapshot || !derived || !reg) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Student Dashboard</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const riskColor = snapshot.riskScore > 70 ? "#e85d6c" : snapshot.riskScore > 40 ? "#f4b740" : "#27ae60";
  const gradeColor = snapshot.averageGrade >= 14 ? "#27ae60" : snapshot.averageGrade >= 10 ? "#f4b740" : "#e85d6c";
  const attendanceColor = snapshot.attendance >= 80 ? "#27ae60" : snapshot.attendance >= 60 ? "#f4b740" : "#e85d6c";

  const radarData = [
    { name: "Grades", value: Math.round(snapshot.averageGrade * 5) },
    { name: "Attendance", value: snapshot.attendance },
    { name: "Engagement", value: derived.engagementScore },
    { name: "Consistency", value: derived.consistencyScore },
    { name: "Wellness", value: derived.wellnessScore },
    { name: "Stability", value: Math.round(100 - snapshot.riskScore) },
  ];

  const gradeTrend = derived.semesterTrend.map((s) => ({ name: s.name, value: s.grade }));

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Student</span>
          <h2>{snapshot.studentName}</h2>
          <p>{snapshot.institutionName} · personalized snapshot.</p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
        <Link to="/student/ai-guidance" className="primary-button" style={{ textDecoration: "none" }}>
          Open AI Guidance
        </Link>
      </header>

      <section className="panel">
        <div className="panel__header">
          <h3>My profile</h3>
          <Link to="/student/certificate" style={{ fontSize: 12 }}>
            Download registration certificate →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Full name", value: snapshot.studentName },
            { label: "Student code", value: reg.studentCode },
            { label: "Specialty", value: "SIC" },
            { label: "Level", value: reg.level },
            { label: "Institution", value: snapshot.institutionName },
            { label: "University", value: "University of Carthage" },
            { label: "Academic year", value: activePeriod ? `${activePeriod.year}/${activePeriod.year + 1}` : "—" },
            { label: "Status", value: reg.registrationStatus },
          ].map((item) => (
            <div key={item.label}>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "#60758a",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {item.label}
              </span>
              <strong style={{ color: "#13263b", fontSize: 14 }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="stats-grid stats-grid--four">
        <StatCard
          label="Average Grade"
          value={`${snapshot.averageGrade}/20`}
          helper={`GPA ${derived.gpa} across ${derived.modules.length} modules`}
          accent="blue"
        />
        <StatCard
          label="Attendance"
          value={`${snapshot.attendance}%`}
          helper="Current period"
          accent="orange"
        />
        <StatCard
          label="Risk Score"
          value={`${snapshot.riskScore}/100`}
          helper="Lower is better"
          accent="red"
        />
        <StatCard
          label="Modules Passing"
          value={`${derived.passingCount}/${derived.modules.length}`}
          helper={`${derived.atRiskCount} at risk · ${derived.failingCount} failing`}
          accent="green"
        />
      </div>

      <div className="panel-grid panel-grid--three">
        <section className="panel">
          <div className="panel__header">
            <h3>Risk score</h3>
            <span>Lower is better</span>
          </div>
          <KpiRadialGauge value={snapshot.riskScore} label="Risk" color={riskColor} />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Average grade</h3>
            <span>Out of 100 (graded /20 ×5)</span>
          </div>
          <KpiRadialGauge
            value={Math.round(snapshot.averageGrade * 5)}
            label="Grade"
            color={gradeColor}
          />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Attendance</h3>
            <span>Current period</span>
          </div>
          <KpiRadialGauge value={snapshot.attendance} label="Present" color={attendanceColor} />
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Student profile radar</h3>
            <span>Holistic performance view</span>
          </div>
          <KpiRadarChart data={radarData} />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>You vs institution peers</h3>
            <span>Higher is better</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={derived.peerCompare} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
              <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
              <YAxis stroke="#60758a" fontSize={11} />
              <Tooltip />
              <Legend verticalAlign="top" height={24} iconSize={10} />
              <Bar dataKey="you" name="You" fill="#1d5394" radius={[6, 6, 0, 0]} />
              <Bar dataKey="peer" name="Peer avg" fill="#7dbce8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Grade progression</h3>
            <span>Across recent semesters · /20</span>
          </div>
          <KpiLineChart data={gradeTrend} color="#1d5394" />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Risk score forecast</h3>
            <span>AI projection for next period</span>
          </div>
          <KpiForecastChart data={derived.riskForecast} color={riskColor} forecastColor="#f4b740" />
        </section>
      </div>

      {snapshot.aiAssessment ? (
        <AiAssessmentPanel
          title="AI risk explanation"
          subtitle="Why you were flagged · explainable model"
          assessment={snapshot.aiAssessment}
        />
      ) : (
        <section className="panel">
          <div className="panel__header">
            <h3>AI risk explanation</h3>
            <span>Why you were flagged</span>
          </div>
          <p className="body-copy">{snapshot.riskExplanation}</p>
        </section>
      )}

      {snapshot.recommendations && snapshot.recommendations.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h3>Personalized recommendations</h3>
            <span>Generated by the UCAR AI engine</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "#3d4f63" }}>
            {snapshot.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="panel__header">
          <h3>KPI monitoring</h3>
          <span>Drill into each performance area</span>
        </div>
        <div className="kpi-link-grid">
          {KPI_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="kpi-link-card">
              <span className="kpi-link-card__icon" aria-hidden>{link.icon}</span>
              <strong>{link.label}</strong>
              <span>{link.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Explore your record</h3>
          <span>Detailed views</span>
        </div>
        <div className="kpi-link-grid">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="kpi-link-card">
              <span className="kpi-link-card__icon" aria-hidden>{link.icon}</span>
              <strong>{link.label}</strong>
              <span>{link.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
