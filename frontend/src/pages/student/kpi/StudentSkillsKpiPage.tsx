import { KpiBarChart, KpiRadarChart, KpiRadialGauge } from "../../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../../components/layout/KpiPageLayout";
import { StatCard } from "../../../components/ui/StatCard";
import { useStudentSnapshot } from "../../../lib/useStudentSnapshot";

export function StudentSkillsKpiPage() {
  const { snapshot, derived, error, loading } = useStudentSnapshot();

  return (
    <KpiPageLayout
      eyebrow="My KPIs · Skills"
      title="Skills & Career Readiness"
      description="Technical & soft skills, internship readiness, and career preparation."
      loading={loading}
      error={error}
    >
      {snapshot && derived && (
        <>
          <div className="stats-grid stats-grid--four">
            <StatCard
              label="Internship readiness"
              value={`${derived.internshipReadiness}/100`}
              helper="Composite indicator"
              accent="blue"
            />
            <StatCard
              label="CV completeness"
              value={`${derived.cvCompleteness}%`}
              helper="Profile fields filled"
              accent="green"
            />
            <StatCard
              label="Language level"
              value={`${derived.languageLevel}/100`}
              helper="Foreign language proficiency"
              accent="orange"
            />
            <StatCard
              label="Tech avg"
              value={`${Math.round(
                derived.technicalSkills.reduce((s, x) => s + x.value, 0) / derived.technicalSkills.length,
              )}/100`}
              helper="Across technical areas"
              accent="red"
            />
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Internship readiness</h3>
                <span>0–100</span>
              </div>
              <KpiRadialGauge
                value={derived.internshipReadiness}
                label="Ready"
                color={
                  derived.internshipReadiness >= 70
                    ? "#27ae60"
                    : derived.internshipReadiness >= 50
                      ? "#f4b740"
                      : "#e85d6c"
                }
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Soft skills radar</h3>
                <span>Behavioral skills</span>
              </div>
              <KpiRadarChart data={derived.softSkills} />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Technical skills</h3>
                <span>Score per area</span>
              </div>
              <KpiBarChart data={derived.technicalSkills} color="#1d5394" />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Career prep checklist</h3>
                <span>Readiness signals</span>
              </div>
              <KpiBarChart
                data={[
                  { name: "CV", value: derived.cvCompleteness },
                  { name: "Language", value: derived.languageLevel },
                  { name: "Tech", value: Math.round(
                    derived.technicalSkills.reduce((s, x) => s + x.value, 0) / derived.technicalSkills.length,
                  ) },
                  { name: "Soft", value: Math.round(
                    derived.softSkills.reduce((s, x) => s + x.value, 0) / derived.softSkills.length,
                  ) },
                  { name: "Readiness", value: derived.internshipReadiness },
                ]}
                color="#16a085"
              />
            </section>
          </div>
        </>
      )}
    </KpiPageLayout>
  );
}
