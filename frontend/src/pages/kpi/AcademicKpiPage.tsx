import { KpiBarChart, KpiRadialGauge } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { KpiTrendPanel } from "../../components/ui/KpiTrendPanel";
import { StatCard } from "../../components/ui/StatCard";
import { useInstitutionDashboard } from "../../lib/useInstitutionDashboard";

export function AcademicKpiPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const a = dashboard?.academic;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Academic"
      title="Academic Performance"
      description="Success, attendance, repetition, dropout, and abandonment indicators."
      loading={!dashboard}
      error={error}
    >
      {a && (
        <>
          <div className="stats-grid">
            <StatCard label="Success Rate" value={`${a.successRate}%`} helper="Students passing this period." accent="green" />
            <StatCard label="Attendance" value={`${a.attendanceRate}%`} helper="Average class attendance." accent="blue" />
            <StatCard label="Dropout Rate" value={`${a.dropoutRate}%`} helper="Students leaving early." accent="red" />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Indicator distribution</h3>
                <span>Current reporting period</span>
              </div>
              <KpiBarChart
                data={[
                  { name: "Success", value: a.successRate },
                  { name: "Attendance", value: a.attendanceRate },
                  { name: "Repetition", value: a.repetitionRate },
                  { name: "Dropout", value: a.dropoutRate },
                  { name: "Abandon", value: a.abandonmentRate },
                ]}
              />
            </section>

            <section className="panel">
              <div className="panel__header">
                <h3>Success rate gauge</h3>
                <span>Target: 80%</span>
              </div>
              <KpiRadialGauge value={a.successRate} label="Success" color="#27ae60" />
            </section>
          </div>

          {dashboard && (
            <div className="panel-grid">
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="academic"
                metricKey="successRate"
                metricLabel="Success rate"
                color="#27ae60"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="academic"
                metricKey="attendanceRate"
                metricLabel="Attendance rate"
                color="#1d5394"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="academic"
                metricKey="dropoutRate"
                metricLabel="Dropout rate"
                color="#e85d6c"
              />
              <KpiTrendPanel
                institutionId={dashboard.institution.id}
                domain="academic"
                metricKey="repetitionRate"
                metricLabel="Repetition rate"
                color="#9b59b6"
              />
            </div>
          )}
        </>
      )}
    </KpiPageLayout>
  );
}
