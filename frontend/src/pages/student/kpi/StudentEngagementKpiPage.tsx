import { KpiBarChart, KpiRadarChart, KpiRadialGauge } from "../../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../../components/layout/KpiPageLayout";
import { StatCard } from "../../../components/ui/StatCard";
import { useStudentSnapshot } from "../../../lib/useStudentSnapshot";

export function StudentEngagementKpiPage() {
  const { snapshot, derived, error, loading } = useStudentSnapshot();

  return (
    <KpiPageLayout
      eyebrow="My KPIs · Engagement"
      title="Engagement & Behavior"
      description="Participation, consistency, assignment delivery and forum activity."
      loading={loading}
      error={error}
    >
      {snapshot && derived && (
        <>
          <div className="stats-grid stats-grid--four">
            <StatCard
              label="Engagement"
              value={`${derived.engagementScore}/100`}
              helper="Composite signal"
              accent="blue"
            />
            <StatCard
              label="Participation"
              value={`${derived.participationScore}/100`}
              helper="In-class activity"
              accent="green"
            />
            <StatCard
              label="Assignments"
              value={`${derived.assignmentSubmissionRate}%`}
              helper="Submitted on time"
              accent="orange"
            />
            <StatCard
              label="Consistency"
              value={`${derived.consistencyScore}/100`}
              helper="Stability of effort"
              accent="red"
            />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Engagement gauge</h3>
                <span>Higher is better</span>
              </div>
              <KpiRadialGauge
                value={derived.engagementScore}
                label="Engagement"
                color={derived.engagementScore >= 70 ? "#27ae60" : derived.engagementScore >= 50 ? "#f4b740" : "#e85d6c"}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Engagement radar</h3>
                <span>Across behavioral dimensions</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Participation", value: derived.participationScore },
                  { name: "Punctuality", value: derived.punctualityScore },
                  { name: "Submissions", value: derived.assignmentSubmissionRate },
                  { name: "Forum", value: derived.forumActivityScore },
                  { name: "Consistency", value: derived.consistencyScore },
                ]}
              />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Behavioral signals</h3>
              <span>Score per dimension</span>
            </div>
            <KpiBarChart
              data={[
                { name: "Participation", value: derived.participationScore },
                { name: "Punctuality", value: derived.punctualityScore },
                { name: "Submissions", value: derived.assignmentSubmissionRate },
                { name: "Forum activity", value: derived.forumActivityScore },
                { name: "Consistency", value: derived.consistencyScore },
              ]}
              color="#9b59b6"
            />
          </section>
        </>
      )}
    </KpiPageLayout>
  );
}
