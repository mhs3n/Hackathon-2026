import { KpiBarChart, KpiRadarChart, KpiRadialGauge } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function InfrastructureKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const i = dashboard?.infrastructure;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Infrastructure"
      title="Infrastructure"
      description="Facilities, equipment, and maintenance backlog."
      loading={!dashboard}
      error={error}
    >
      {i ? (
        <>
          <div className="stats-grid">
            <StatCard label="Classroom Use" value={`${i.classroomOccupancyPct}%`} helper="Occupancy rate." accent="blue" />
            <StatCard label="Equipment" value={`${i.equipmentAvailabilityPct}%`} helper="Available and operational." accent="green" />
            <StatCard label="Maintenance Backlog" value={`${i.maintenanceBacklogDays} days`} helper="Pending issues." accent="red" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Facility health</h3>
                <span>Multi-factor radar</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Classrooms", value: i.classroomOccupancyPct },
                  { name: "Equipment", value: i.equipmentAvailabilityPct },
                  { name: "IT", value: i.itEquipmentStatus },
                  { name: "Projects", value: Math.min(i.ongoingProjectsCount * 10, 100) },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Equipment availability</h3>
                <span>Gauge</span>
              </div>
              <KpiRadialGauge value={i.equipmentAvailabilityPct} label="Available" color="#16a085" />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Asset metrics</h3>
              <span>Detailed view</span>
            </div>
            <KpiBarChart
              color="#16a085"
              data={[
                { name: "Classroom %", value: i.classroomOccupancyPct },
                { name: "Equipment %", value: i.equipmentAvailabilityPct },
                { name: "IT %", value: i.itEquipmentStatus },
                { name: "Projects", value: i.ongoingProjectsCount },
                { name: "Backlog", value: i.maintenanceBacklogDays },
              ]}
            />
          </section>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="infrastructure"
                metricKey="equipmentAvailabilityPct"
                metricLabel="Equipment availability"
                color="#27ae60"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="infrastructure"
                metricKey="maintenanceBacklogDays"
                metricLabel="Maintenance backlog (days)"
                color="#e85d6c"
              />
            </div>
          )}
        </>
      ) : (
        <div className="panel"><p>No infrastructure data for this institution.</p></div>
      )}
    </KpiPageLayout>
  );
}
