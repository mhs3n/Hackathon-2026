import { KpiBarChart, KpiPieChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function InsertionKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const i = dashboard?.insertion;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Insertion"
      title="Employment & Insertion"
      description="Employability outcomes, conventions, and insertion delays."
      loading={!dashboard}
      error={error}
    >
      {i && (
        <>
          <div className="stats-grid">
            <StatCard label="Employability" value={`${i.employabilityRate}%`} helper="Graduates employed within target window." accent="green" />
            <StatCard label="Insertion Delay" value={`${i.insertionDelayMonths} mo`} helper="Average time to first job." accent="orange" />
            <StatCard label="National Conventions" value={`${i.nationalConventionRate}%`} helper="Active national agreements." accent="blue" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Convention split</h3>
                <span>Distribution by type</span>
              </div>
              <KpiPieChart
                data={[
                  { name: "National", value: i.nationalConventionRate },
                  { name: "International", value: i.internationalConventionRate },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Insertion indicators</h3>
                <span>Comparative view</span>
              </div>
              <KpiBarChart
                data={[
                  { name: "Employability", value: i.employabilityRate },
                  { name: "National Conv.", value: i.nationalConventionRate },
                  { name: "Intl. Conv.", value: i.internationalConventionRate },
                ]}
              />
            </section>
          </div>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="insertion"
                metricKey="employabilityRate"
                metricLabel="Employability rate"
                color="#27ae60"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="insertion"
                metricKey="insertionDelayMonths"
                metricLabel="Insertion delay (months)"
                color="#f4b740"
              />
            </div>
          )}
        </>
      )}
    </KpiPageLayout>
  );
}
