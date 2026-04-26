import { KpiBarChart, KpiPieChart, KpiRadarChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function HrKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const h = dashboard?.hr;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Human Resources"
      title="Human Resources"
      description="Staffing, training, absenteeism, and team stability."
      loading={!dashboard}
      error={error}
    >
      {h ? (
        <>
          <div className="stats-grid">
            <StatCard label="Total Staff" value={`${h.teachingHeadcount + h.adminHeadcount}`} helper="Teaching + administrative." accent="blue" />
            <StatCard label="Absenteeism" value={`${h.absenteeismRate}%`} helper="Average across staff." accent="red" />
            <StatCard label="Stability Index" value={`${h.teamStabilityIndex}`} helper="Higher is better." accent="green" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Staff composition</h3>
                <span>Headcount by role</span>
              </div>
              <KpiPieChart
                data={[
                  { name: "Teaching", value: h.teachingHeadcount },
                  { name: "Admin", value: h.adminHeadcount },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>HR balance</h3>
                <span>Quality indicators</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Training", value: h.trainingCompletedPct },
                  { name: "Stability", value: h.teamStabilityIndex },
                  { name: "Attendance", value: 100 - h.absenteeismRate },
                  { name: "Load (h)", value: Math.min(h.teachingLoadHours * 4, 100) },
                ]}
              />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Operational metrics</h3>
              <span>Detailed view</span>
            </div>
            <KpiBarChart
              data={[
                { name: "Absenteeism", value: h.absenteeismRate },
                { name: "Training %", value: h.trainingCompletedPct },
                { name: "Load (h)", value: h.teachingLoadHours },
                { name: "Stability", value: h.teamStabilityIndex },
              ]}
            />
          </section>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="hr"
                metricKey="absenteeismRate"
                metricLabel="Absenteeism rate"
                color="#e85d6c"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="hr"
                metricKey="teamStabilityIndex"
                metricLabel="Team stability index"
                color="#27ae60"
              />
            </div>
          )}
        </>
      ) : (
        <div className="panel"><p>No HR data for this institution.</p></div>
      )}
    </KpiPageLayout>
  );
}
