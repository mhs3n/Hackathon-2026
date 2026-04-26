import { KpiBarChart, KpiLineChart, KpiPieChart, KpiRadialGauge } from "../../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../../components/layout/KpiPageLayout";
import { StatCard } from "../../../components/ui/StatCard";
import { useStudentSnapshot } from "../../../lib/useStudentSnapshot";

export function StudentAcademicKpiPage() {
  const { snapshot, derived, error, loading } = useStudentSnapshot();

  return (
    <KpiPageLayout
      eyebrow="My KPIs · Academic"
      title="Academic Performance"
      description="Grades, GPA progression, and module-level success."
      loading={loading}
      error={error}
    >
      {snapshot && derived && (
        <>
          <div className="stats-grid stats-grid--four">
            <StatCard label="Average grade" value={`${snapshot.averageGrade}/20`} helper="Current period" accent="blue" />
            <StatCard label="GPA" value={`${derived.gpa}/20`} helper="Across all modules" accent="green" />
            <StatCard
              label="Passing"
              value={`${derived.passingCount}/${derived.modules.length}`}
              helper={`${derived.atRiskCount} at risk · ${derived.failingCount} failing`}
              accent="orange"
            />
            <StatCard
              label="Credits earned"
              value={`${derived.modules.filter((m) => m.status !== "failing").reduce((s, m) => s + m.credits, 0)}`}
              helper="Of enrolled credits"
              accent="red"
            />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Grades by module</h3>
                <span>/20 · pass mark 10</span>
              </div>
              <KpiBarChart
                data={derived.modules.map((m) => ({ name: m.code, value: m.grade }))}
                color="#1d5394"
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Average grade gauge</h3>
                <span>Out of 100 · /20 ×5</span>
              </div>
              <KpiRadialGauge
                value={Math.round(snapshot.averageGrade * 5)}
                label="Grade"
                color={snapshot.averageGrade >= 14 ? "#27ae60" : snapshot.averageGrade >= 10 ? "#f4b740" : "#e85d6c"}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>GPA progression</h3>
                <span>Last 5 semesters</span>
              </div>
              <KpiLineChart
                data={derived.semesterTrend.map((s) => ({ name: s.name, value: s.grade }))}
                color="#1d5394"
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Module status mix</h3>
                <span>Pass / at risk / fail</span>
              </div>
              <KpiPieChart
                data={[
                  { name: "Passing", value: derived.passingCount },
                  { name: "At risk", value: derived.atRiskCount },
                  { name: "Failing", value: derived.failingCount },
                ]}
              />
            </section>
          </div>
        </>
      )}
    </KpiPageLayout>
  );
}
