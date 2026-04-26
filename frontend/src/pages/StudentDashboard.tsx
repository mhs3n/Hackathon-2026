import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { KpiRadialGauge } from "../components/charts/KpiCharts";
import { AiAssessmentPanel } from "../components/ui/AiAssessmentPanel";
import { PeriodBadge } from "../components/ui/PeriodBadge";
import { StatCard } from "../components/ui/StatCard";
import { fetchStudentDashboard } from "../lib/api";
import type { StudentDashboardView } from "../types";

const QUICK_LINKS = [
  { to: "/student/academic-record", label: "Academic Record", desc: "Grades & attendance history", icon: "📚" },
  { to: "/student/ai-guidance", label: "AI Guidance", desc: "Personalized recommendations", icon: "🤖" },
];

export function StudentDashboard() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<StudentDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.studentProfileId) return;
    let isActive = true;
    fetchStudentDashboard(user.studentProfileId)
      .then((payload) => isActive && setSnapshot(payload))
      .catch((err: Error) => isActive && setError(err.message));
    return () => {
      isActive = false;
    };
  }, [user?.studentProfileId]);

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

  if (!snapshot) {
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
      </header>

      <div className="stats-grid">
        <StatCard label="Average Grade" value={`${snapshot.averageGrade}/20`} helper="Current modules." accent="blue" />
        <StatCard label="Attendance" value={`${snapshot.attendance}%`} helper="Current period." accent="orange" />
        <StatCard label="Risk Score" value={`${snapshot.riskScore}/100`} helper="Lower is better." accent="red" />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Risk score</h3>
            <span>Lower is better</span>
          </div>
          <KpiRadialGauge value={snapshot.riskScore} label="Risk" color={riskColor} />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Quick actions</h3>
            <span>Where to go next</span>
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
    </section>
  );
}
