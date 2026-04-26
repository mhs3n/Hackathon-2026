import { KpiBarChart, KpiRadarChart, KpiRadialGauge } from "../../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../../components/layout/KpiPageLayout";
import { StatCard } from "../../../components/ui/StatCard";
import { useStudentSnapshot } from "../../../lib/useStudentSnapshot";

export function StudentWellnessKpiPage() {
  const { snapshot, derived, error, loading } = useStudentSnapshot();

  return (
    <KpiPageLayout
      eyebrow="My KPIs · Wellness"
      title="Wellness & Well-being"
      description="Workload balance, stress, sleep, and social integration indicators."
      loading={loading}
      error={error}
    >
      {snapshot && derived && (
        <>
          <div className="stats-grid stats-grid--four">
            <StatCard
              label="Wellness"
              value={`${derived.wellnessScore}/100`}
              helper="Composite index"
              accent="green"
            />
            <StatCard
              label="Workload balance"
              value={`${derived.workloadBalance}/100`}
              helper="Effort vs capacity"
              accent="blue"
            />
            <StatCard
              label="Stress index"
              value={`${derived.stressIndex}/100`}
              helper="Lower is better"
              accent="red"
            />
            <StatCard
              label="Social integration"
              value={`${derived.socialIntegration}/100`}
              helper="Peer & community ties"
              accent="orange"
            />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Wellness gauge</h3>
                <span>Higher is better</span>
              </div>
              <KpiRadialGauge
                value={derived.wellnessScore}
                label="Wellness"
                color={derived.wellnessScore >= 70 ? "#27ae60" : derived.wellnessScore >= 50 ? "#f4b740" : "#e85d6c"}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Stress gauge</h3>
                <span>Inverted · lower is better</span>
              </div>
              <KpiRadialGauge
                value={derived.stressIndex}
                label="Stress"
                color={derived.stressIndex >= 60 ? "#e85d6c" : derived.stressIndex >= 40 ? "#f4b740" : "#27ae60"}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Wellness radar</h3>
                <span>Multiple dimensions</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Workload", value: derived.workloadBalance },
                  { name: "Sleep", value: derived.sleepIndex },
                  { name: "Calm", value: 100 - derived.stressIndex },
                  { name: "Social", value: derived.socialIntegration },
                  { name: "Overall", value: derived.wellnessScore },
                ]}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Indicators</h3>
                <span>Score per dimension</span>
              </div>
              <KpiBarChart
                data={[
                  { name: "Workload", value: derived.workloadBalance },
                  { name: "Sleep", value: derived.sleepIndex },
                  { name: "Calm", value: 100 - derived.stressIndex },
                  { name: "Social", value: derived.socialIntegration },
                ]}
                color="#27ae60"
              />
            </section>
          </div>
        </>
      )}
    </KpiPageLayout>
  );
}
