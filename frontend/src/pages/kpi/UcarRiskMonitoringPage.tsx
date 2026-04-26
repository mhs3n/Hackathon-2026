import { useEffect, useState } from "react";

import { KpiBarChart, KpiPieChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { AnomalyTable } from "../../components/ui/AnomalyTable";
import { StatCard } from "../../components/ui/StatCard";
import { usePeriod } from "../../period/PeriodContext";
import { fetchUcarDashboard } from "../../lib/api";
import type { UcarDashboardView } from "../../types";

export function UcarRiskMonitoringPage() {
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

  const riskBuckets =
    dashboard?.institutions.reduce(
      (acc, i) => {
        acc[i.riskLevel] = (acc[i.riskLevel] ?? 0) + 1;
        return acc;
      },
      { Low: 0, Medium: 0, High: 0 } as Record<string, number>,
    ) ?? {};

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Risk"
      title="UCAR Risk Monitoring"
      description="Identify institutions at risk and prepare interventions."
      loading={!dashboard}
      error={error}
    >
      {dashboard && (
        <>
          <div className="stats-grid">
            <StatCard label="High Risk" value={String(riskBuckets.High ?? 0)} helper="Institutions critical." accent="red" />
            <StatCard label="Medium Risk" value={String(riskBuckets.Medium ?? 0)} helper="Need monitoring." accent="orange" />
            <StatCard label="Low Risk" value={String(riskBuckets.Low ?? 0)} helper="Stable institutions." accent="green" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Risk distribution</h3>
                <span>By level</span>
              </div>
              <KpiPieChart data={Object.entries(riskBuckets).map(([name, value]) => ({ name, value }))} />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Dropout rate by institution</h3>
                <span>Risk indicator</span>
              </div>
              <KpiBarChart
                color="#e85d6c"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.dropoutRate }))}
              />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>AI anomaly detection</h3>
              <span>
                {dashboard.criticalAlerts.length} signal{dashboard.criticalAlerts.length === 1 ? "" : "s"} ·
                click a row for details · click a column to sort
              </span>
            </div>
            <AnomalyTable
              alerts={dashboard.criticalAlerts}
              institutions={dashboard.institutions}
              emptyText="No anomalies detected this period."
            />
          </section>
        </>
      )}
    </KpiPageLayout>
  );
}
