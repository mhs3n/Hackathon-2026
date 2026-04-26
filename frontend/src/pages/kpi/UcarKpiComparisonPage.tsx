import { useEffect, useState } from "react";

import { KpiBarChart, KpiPieChart, KpiRadarChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { AnomalyTable } from "../../components/ui/AnomalyTable";
import { usePeriod } from "../../period/PeriodContext";
import { fetchUcarDashboard } from "../../lib/api";
import type { UcarDashboardView } from "../../types";

export function UcarKpiComparisonPage() {
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

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Comparison"
      title="KPI Comparison Across Institutions"
      description="Side-by-side comparison of academic, employability, dropout, and budget indicators."
      loading={!dashboard}
      error={error}
    >
      {dashboard && (
        <>
          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Success rate</h3>
                <span>Higher is better</span>
              </div>
              <KpiBarChart
                color="#27ae60"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.successRate }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Attendance rate</h3>
                <span>Higher is better</span>
              </div>
              <KpiBarChart
                color="#1d5394"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.attendanceRate }))}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Employability</h3>
                <span>Insertion outcome</span>
              </div>
              <KpiBarChart
                color="#2f86c8"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.employabilityRate }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Dropout rate</h3>
                <span>Lower is better</span>
              </div>
              <KpiBarChart
                color="#e85d6c"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.dropoutRate }))}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Budget Consumed</h3>
                <span>Consumption %</span>
              </div>
              <KpiBarChart
                color="#f4b740"
                data={dashboard.institutions.map((i) => ({ name: i.shortName, value: i.budgetUsage }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Cross-KPI radar</h3>
                <span>UCAR averages</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Success", value: dashboard.academicAverage },
                  { name: "Budget", value: dashboard.budgetAverage },
                  {
                    name: "Employability",
                    value: Math.round(
                      dashboard.institutions.reduce((s, i) => s + i.employabilityRate, 0) /
                        dashboard.institutions.length,
                    ),
                  },
                  {
                    name: "Attendance",
                    value: Math.round(
                      dashboard.institutions.reduce((s, i) => s + i.attendanceRate, 0) /
                        dashboard.institutions.length,
                    ),
                  },
                ]}
              />
            </section>
          </div>

          {dashboard.criticalAlerts.length > 0 && (
            <section className="panel">
              <div className="panel__header">
                <h3>Peer outliers detected by AI</h3>
                <span>Z-score anomaly detection across {dashboard.institutions.length} institutions</span>
              </div>
              <AnomalyTable alerts={dashboard.criticalAlerts} institutions={dashboard.institutions} />
            </section>
          )}
        </>
      )}
    </KpiPageLayout>
  );
}
