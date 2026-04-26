import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { KpiPieChart, KpiRadialGauge } from "../components/charts/KpiCharts";
import { AnomalyTable } from "../components/ui/AnomalyTable";
import { PeriodBadge } from "../components/ui/PeriodBadge";
import { StatCard } from "../components/ui/StatCard";
import { usePeriod } from "../period/PeriodContext";
import { fetchUcarDashboard } from "../lib/api";
import type { UcarDashboardView } from "../types";

const QUICK_LINKS = [
  { to: "/admin/institutions", label: "All Institutions", desc: "Detailed list", icon: "🏛️" },
  { to: "/admin/kpi-comparison", label: "KPI Comparison", desc: "Side-by-side charts", icon: "📊" },
  { to: "/admin/risk-monitoring", label: "Risk Monitoring", desc: "Alerts & predictions", icon: "⚠️" },
  { to: "/admin/reports", label: "Reports", desc: "Generate UCAR report", icon: "📑" },
];

export function UcarAdminDashboard() {
  const [dashboard, setDashboard] = useState<UcarDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { periodId } = usePeriod();

  useEffect(() => {
    if (!periodId) return;
    let isActive = true;
    fetchUcarDashboard(periodId)
      .then((d) => isActive && (setDashboard(d), setError(null)))
      .catch((err: Error) => isActive && setError(err.message));
    return () => {
      isActive = false;
    };
  }, [periodId]);

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">UCAR Admin</span>
            <h2>UCAR Overview</h2>
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
            <span className="shell__eyebrow">UCAR Admin</span>
            <h2>UCAR Overview</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const riskBuckets = dashboard.institutions.reduce(
    (acc, i) => {
      acc[i.riskLevel] = (acc[i.riskLevel] ?? 0) + 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0 } as Record<string, number>,
  );
  const riskPie = Object.entries(riskBuckets).map(([name, value]) => ({ name, value }));

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">UCAR Admin</span>
          <h2>UCAR Overview</h2>
          <p>Headline indicators across {dashboard.institutions.length} institutions.</p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
        <button className="primary-button" type="button">
          Generate UCAR Report
        </button>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard label="Institutions" value={String(dashboard.institutions.length)} helper="Tracked." accent="blue" />
        <StatCard label="Critical Alerts" value={String(dashboard.criticalAlerts.length)} helper="Active risks." accent="red" />
        <StatCard label="Avg Success" value={`${dashboard.academicAverage}%`} helper="UCAR-wide." accent="green" />
        <StatCard label="Avg Budget Consumed" value={`${dashboard.budgetAverage}%`} helper="Average consumption rate." accent="orange" />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Average success</h3>
            <span>UCAR-wide</span>
          </div>
          <KpiRadialGauge value={dashboard.academicAverage} label="Success" color="#27ae60" />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Risk distribution</h3>
            <span>Institutions by level</span>
          </div>
          <KpiPieChart data={riskPie} />
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>AI critical alerts</h3>
          <Link to="/admin/risk-monitoring" style={{ fontSize: 12 }}>View all ({dashboard.criticalAlerts.length}) →</Link>
        </div>
        <AnomalyTable
          alerts={dashboard.criticalAlerts.slice(0, 6)}
          institutions={dashboard.institutions}
          emptyText="No anomalies detected this period."
        />
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Quick navigation</h3>
          <span>Jump into details</span>
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
