import { KpiBarChart, KpiPieChart, KpiRadialGauge } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function FinanceKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const f = dashboard?.finance;
  const usage = f ? Math.round((f.budgetConsumed / f.budgetAllocated) * 100) : 0;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Finance"
      title="Finance & Budget"
      description="Budget allocation, consumption, and per-student cost."
      loading={!dashboard}
      error={error}
    >
      {f && (
        <>
          <div className="stats-grid">
            <StatCard label="Budget Allocated" value={`${f.budgetAllocated.toLocaleString()} TND`} helper="Annual envelope." accent="blue" />
            <StatCard label="Budget Consumed" value={`${f.budgetConsumed.toLocaleString()} TND`} helper="Spent to date." accent="orange" />
            <StatCard label="Cost per Student" value={`${f.costPerStudent.toLocaleString()} TND`} helper="Per-student average." accent="green" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Budget Consumed</h3>
                <span>Consumption against plan</span>
              </div>
              <KpiRadialGauge value={usage} label="Used" color="#f4b740" />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Consumed vs Remaining</h3>
                <span>Snapshot</span>
              </div>
              <KpiPieChart
                data={[
                  { name: "Consumed", value: f.budgetConsumed },
                  { name: "Remaining", value: Math.max(f.budgetAllocated - f.budgetConsumed, 0) },
                ]}
              />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Financial breakdown</h3>
              <span>Key amounts (TND)</span>
            </div>
            <KpiBarChart
              data={[
                { name: "Allocated", value: f.budgetAllocated },
                { name: "Consumed", value: f.budgetConsumed },
                { name: "Cost / Student", value: f.costPerStudent },
              ]}
            />
          </section>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="finance"
                metricKey="budgetConsumed"
                metricLabel="Budget consumed"
                color="#f4b740"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="finance"
                metricKey="costPerStudent"
                metricLabel="Cost per student"
                color="#1d5394"
              />
            </div>
          )}
        </>
      )}
    </KpiPageLayout>
  );
}
