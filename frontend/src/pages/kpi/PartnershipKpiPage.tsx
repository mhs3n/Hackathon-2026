import { KpiBarChart, KpiPieChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function PartnershipKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const p = dashboard?.partnership;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Partnerships"
      title="Partnerships & Mobility"
      description="Agreements, student mobility, and academic networks."
      loading={!dashboard}
      error={error}
    >
      {p ? (
        <>
          <div className="stats-grid">
            <StatCard label="Active Agreements" value={`${p.activeAgreementsCount}`} helper="Partnerships in force." accent="blue" />
            <StatCard label="Total Mobility" value={`${p.studentMobilityIncoming + p.studentMobilityOutgoing}`} helper="Incoming + outgoing students." accent="green" />
            <StatCard label="Intl. Projects" value={`${p.internationalProjects}`} helper="International collaborations." accent="orange" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Mobility flow</h3>
                <span>Incoming vs outgoing</span>
              </div>
              <KpiPieChart
                data={[
                  { name: "Incoming", value: p.studentMobilityIncoming },
                  { name: "Outgoing", value: p.studentMobilityOutgoing },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Partnership metrics</h3>
                <span>Counts</span>
              </div>
              <KpiBarChart
                color="#2f86c8"
                data={[
                  { name: "Agreements", value: p.activeAgreementsCount },
                  { name: "Incoming", value: p.studentMobilityIncoming },
                  { name: "Outgoing", value: p.studentMobilityOutgoing },
                  { name: "Intl. Proj.", value: p.internationalProjects },
                  { name: "Networks", value: p.academicNetworksCount },
                ]}
              />
            </section>
          </div>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="partnership"
                metricKey="activeAgreementsCount"
                metricLabel="Active agreements"
                color="#1d5394"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="partnership"
                metricKey="studentMobilityIncoming"
                metricLabel="Student mobility (incoming)"
                color="#27ae60"
              />
            </div>
          )}
        </>
      ) : (
        <div className="panel"><p>No partnership data for this institution.</p></div>
      )}
    </KpiPageLayout>
  );
}
