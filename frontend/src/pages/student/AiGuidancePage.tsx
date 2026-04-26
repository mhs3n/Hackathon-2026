import { KpiForecastChart, KpiRadarChart } from "../../components/charts/KpiCharts";
import { AiAssessmentPanel } from "../../components/ui/AiAssessmentPanel";
import { PeriodBadge } from "../../components/ui/PeriodBadge";
import { StatCard } from "../../components/ui/StatCard";
import { useStudentSnapshot } from "../../lib/useStudentSnapshot";
import type { StudentDashboardView } from "../../types";

type ActionItem = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

const PRIORITY_COLOR: Record<ActionItem["priority"], string> = {
  high: "#e85d6c",
  medium: "#f4b740",
  low: "#27ae60",
};

function buildActionPlan(snapshot: StudentDashboardView): ActionItem[] {
  const items: ActionItem[] = [];
  if (snapshot.attendance < 75) {
    items.push({
      title: "Boost weekly attendance to ≥ 80%",
      detail: "Use the academic record page to find your two lowest-attendance modules and prioritize those sessions.",
      priority: snapshot.attendance < 60 ? "high" : "medium",
    });
  }
  if (snapshot.averageGrade < 12) {
    items.push({
      title: "Schedule tutoring on weakest module",
      detail: "Pair with the academic affairs office; book at least one tutoring slot per week for the next 4 weeks.",
      priority: snapshot.averageGrade < 10 ? "high" : "medium",
    });
  }
  if (snapshot.riskScore > 60) {
    items.push({
      title: "Open a counsellor follow-up",
      detail: "Schedule a 30-min meeting with the student-success advisor to review intervention options.",
      priority: "high",
    });
  }
  if (items.length === 0) {
    items.push({
      title: "Maintain current trajectory",
      detail: "Your indicators are healthy. Keep current study routine and continue tracking weekly attendance.",
      priority: "low",
    });
  }
  // pad with a generic study habit suggestion
  items.push({
    title: "Run a 25/5 focused study cycle",
    detail: "Two Pomodoro cycles per evening on weak modules typically improves grade by 1.5/20 within a semester.",
    priority: "low",
  });
  return items;
}

export function AiGuidancePage() {
  const { snapshot, derived, error } = useStudentSnapshot();

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>AI Guidance</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!snapshot || !derived) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>AI Guidance</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const riskColor = snapshot.riskScore > 70 ? "#e85d6c" : snapshot.riskScore > 40 ? "#f4b740" : "#27ae60";
  const actions = buildActionPlan(snapshot);

  const radarData = [
    { name: "Grades", value: Math.round(snapshot.averageGrade * 5) },
    { name: "Attendance", value: snapshot.attendance },
    { name: "Engagement", value: derived.engagementScore },
    { name: "Consistency", value: derived.consistencyScore },
    { name: "Wellness", value: derived.wellnessScore },
    { name: "Stability", value: Math.round(100 - snapshot.riskScore) },
  ];

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Student</span>
          <h2>AI Guidance</h2>
          <p>{snapshot.studentName} · personalized explainable guidance.</p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          label="Risk score"
          value={`${snapshot.riskScore}/100`}
          helper="Lower is better"
          accent="red"
        />
        <StatCard
          label="Engagement"
          value={`${derived.engagementScore}/100`}
          helper="Composite of grades + attendance"
          accent="blue"
        />
        <StatCard
          label="Wellness index"
          value={`${derived.wellnessScore}/100`}
          helper="Stability of academic load"
          accent="green"
        />
      </div>

      <div className="panel-grid">
        {snapshot.aiAssessment ? (
          <AiAssessmentPanel
            title="Why you were flagged"
            subtitle="Top contributing factors · explainable model"
            assessment={snapshot.aiAssessment}
          />
        ) : (
          <section className="panel">
            <div className="panel__header">
              <h3>Why you were flagged</h3>
              <span>Explainable model</span>
            </div>
            <p className="body-copy">{snapshot.riskExplanation}</p>
          </section>
        )}
        <section className="panel">
          <div className="panel__header">
            <h3>Holistic profile</h3>
            <span>Six-dimension snapshot</span>
          </div>
          <KpiRadarChart data={radarData} />
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Risk score forecast</h3>
          <span>AI projection for the next reporting period</span>
        </div>
        <KpiForecastChart data={derived.riskForecast} color={riskColor} forecastColor="#f4b740" />
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Recommended action plan</h3>
          <span>Prioritized & explainable</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {actions.map((item, idx) => {
            const color = PRIORITY_COLOR[item.priority];
            return (
              <li
                key={idx}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: idx === actions.length - 1 ? "none" : "1px solid #f0f4f8",
                }}
              >
                <span
                  style={{
                    minWidth: 70,
                    textAlign: "center",
                    padding: "4px 8px",
                    borderRadius: 12,
                    background: `${color}22`,
                    color,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {item.priority}
                </span>
                <div>
                  <strong style={{ color: "#13263b", display: "block", marginBottom: 4 }}>
                    {item.title}
                  </strong>
                  <span style={{ color: "#3d4f63", fontSize: 13, lineHeight: 1.5 }}>
                    {item.detail}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {snapshot.recommendations && snapshot.recommendations.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h3>UCAR engine recommendations</h3>
            <span>Generated for the current period</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "#3d4f63" }}>
            {snapshot.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
