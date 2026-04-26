import { KpiBarChart, KpiRadialGauge } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function ResearchKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const r = dashboard?.research;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Research"
      title="Research & Innovation"
      description="Publications, projects, funding, partnerships, and patents."
      loading={!dashboard}
      error={error}
    >
      {r ? (
        <>
          <div className="stats-grid">
            <StatCard label="Publications" value={`${r.publicationsCount}`} helper="Peer-reviewed outputs." accent="blue" />
            <StatCard label="Active Projects" value={`${r.activeProjects}`} helper="Currently running." accent="green" />
            <StatCard label="Funding" value={`${r.fundingSecuredTnd.toLocaleString()} TND`} helper="Secured this period." accent="orange" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Output mix</h3>
                <span>Counts</span>
              </div>
              <KpiBarChart
                color="#9b59b6"
                data={[
                  { name: "Publications", value: r.publicationsCount },
                  { name: "Projects", value: r.activeProjects },
                  { name: "Partnerships", value: r.academicPartnerships },
                  { name: "Patents", value: r.patentsFiled },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Research activity index</h3>
                <span>Composite score</span>
              </div>
              <KpiRadialGauge
                value={Math.min(r.publicationsCount + r.activeProjects * 2 + r.patentsFiled * 5, 100)}
                label="Activity"
                color="#9b59b6"
              />
            </section>
          </div>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="research"
                metricKey="publicationsCount"
                metricLabel="Publications count"
                color="#1d5394"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="research"
                metricKey="fundingSecuredTnd"
                metricLabel="Funding secured (TND)"
                color="#27ae60"
              />
            </div>
          )}
        </>
      ) : (
        <div className="panel"><p>No research data for this institution.</p></div>
      )}
    </KpiPageLayout>
  );
}
