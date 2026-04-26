import { Link } from "react-router-dom";

import { KpiRadialGauge } from "../components/charts/KpiCharts";
import { AiAssessmentPanel } from "../components/ui/AiAssessmentPanel";
import { KpiTrendPanel } from "../components/ui/KpiTrendPanel";
import { PeriodBadge } from "../components/ui/PeriodBadge";
import { StatCard } from "../components/ui/StatCard";
import { useInstitutionDashboard } from "../lib/useInstitutionDashboard";

const KPI_LINKS = [
  { to: "/institution/kpi/academic", label: "Academic", desc: "Success, attendance, dropout", icon: "AC" },
  { to: "/institution/kpi/insertion", label: "Insertion", desc: "Employability & conventions", icon: "IN" },
  { to: "/institution/kpi/finance", label: "Finance", desc: "Budget execution & cost", icon: "FI" },
  { to: "/institution/kpi/hr", label: "HR", desc: "Staff & stability", icon: "HR" },
  { to: "/institution/kpi/research", label: "Research", desc: "Publications & projects", icon: "RS" },
  { to: "/institution/kpi/infrastructure", label: "Infrastructure", desc: "Facilities & equipment", icon: "IF" },
  { to: "/institution/kpi/partnership", label: "Partnerships", desc: "Mobility & agreements", icon: "PT" },
];

export function InstitutionDashboard() {
  const { dashboard, error } = useInstitutionDashboard();

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Institution Admin</span>
            <h2>Institution Dashboard</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Institution Admin</span>
            <h2>Institution Dashboard</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const { institution, academic, insertion, finance, riskList } = dashboard;
  const budgetUsage = Math.round((finance.budgetConsumed / finance.budgetAllocated) * 100);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Institution Admin</span>
          <h2>{institution.name}</h2>
          <p>{institution.region} · headline indicators at a glance.</p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
        <button className="primary-button" type="button">
          Generate Report
        </button>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard label="Success Rate" value={`${academic.successRate}%`} helper="Current performance." accent="green" />
        <StatCard label="Employability" value={`${insertion.employabilityRate}%`} helper="Insertion outcome." accent="blue" />
        <StatCard label="Budget Consumed" value={`${budgetUsage}%`} helper="Consumed vs allocated." accent="orange" />
        <StatCard label="At-Risk Students" value={String(riskList.length)} helper="Need follow-up." accent="red" />
      </div>

      <div className="panel-grid">
        {dashboard.aiAssessment && (
          <AiAssessmentPanel
            title="AI Risk Assessment"
            subtitle={`${institution.shortName} · explainable model`}
            assessment={dashboard.aiAssessment}
          />
        )}
        <section className="panel">
          <div className="panel__header">
            <h3>Overall academic health</h3>
            <span>Success rate gauge</span>
          </div>
          <KpiRadialGauge value={academic.successRate} label="Success" color="#27ae60" />
        </section>
      </div>

      <div className="panel-grid">
        <KpiTrendPanel
          institutionId={institution.id}
          domain="academic"
          metricKey="successRate"
          metricLabel="Success rate"
          color="#27ae60"
        />
        <KpiTrendPanel
          institutionId={institution.id}
          domain="academic"
          metricKey="dropoutRate"
          metricLabel="Dropout rate"
          color="#e85d6c"
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Explore KPI monitoring</h3>
          <span>Open a category for details & charts</span>
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
    </section>
  );
}
