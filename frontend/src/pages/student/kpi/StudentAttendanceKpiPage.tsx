import { KpiBarChart, KpiLineChart, KpiPieChart, KpiRadialGauge } from "../../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../../components/layout/KpiPageLayout";
import { StatCard } from "../../../components/ui/StatCard";
import { useStudentSnapshot } from "../../../lib/useStudentSnapshot";

export function StudentAttendanceKpiPage() {
  const { snapshot, derived, error, loading } = useStudentSnapshot();

  return (
    <KpiPageLayout
      eyebrow="My KPIs · Attendance"
      title="Attendance & Presence"
      description="Class attendance trends, per-module presence, and absence breakdown."
      loading={loading}
      error={error}
    >
      {snapshot && derived && (() => {
        const att = snapshot.attendance;
        const color = att >= 80 ? "#27ae60" : att >= 60 ? "#f4b740" : "#e85d6c";
        const lowest = [...derived.modules].sort((a, b) => a.attendance - b.attendance)[0];
        const absencePoints = derived.absenceReasons.filter((r) => r.value > 0);
        return (
          <>
            <div className="stats-grid stats-grid--four">
              <StatCard label="Attendance" value={`${att}%`} helper="Current period" accent="blue" />
              <StatCard
                label="Punctuality"
                value={`${derived.punctualityScore}/100`}
                helper="On-time arrival score"
                accent="green"
              />
              <StatCard
                label="Absent days (est.)"
                value={`${Math.round((100 - att) * 0.6)}`}
                helper="This semester"
                accent="orange"
              />
              <StatCard
                label="Lowest module"
                value={lowest ? `${lowest.code}` : "—"}
                helper={lowest ? `${lowest.attendance}% present` : ""}
                accent="red"
              />
            </div>

            <div className="panel-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>Attendance gauge</h3>
                  <span>Target ≥ 80%</span>
                </div>
                <KpiRadialGauge value={att} label="Present" color={color} />
              </section>
              <section className="panel">
                <div className="panel__header">
                  <h3>Attendance per module</h3>
                  <span>%</span>
                </div>
                <KpiBarChart
                  data={derived.modules.map((m) => ({ name: m.code, value: m.attendance }))}
                  color="#2f86c8"
                />
              </section>
            </div>

            <div className="panel-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>Weekly trend (last 8 weeks)</h3>
                  <span>%</span>
                </div>
                <KpiLineChart
                  data={derived.attendanceWeekly.map((w) => ({ name: w.name, value: w.attendance }))}
                  color="#1d5394"
                />
              </section>
              <section className="panel">
                <div className="panel__header">
                  <h3>Monthly trend</h3>
                  <span>This semester</span>
                </div>
                <KpiLineChart data={derived.monthlyAttendance} color="#27ae60" />
              </section>
            </div>

            <section className="panel">
              <div className="panel__header">
                <h3>Absence reasons</h3>
                <span>Distribution of absences</span>
              </div>
              {absencePoints.length > 0 ? (
                <KpiPieChart data={absencePoints} />
              ) : (
                <p className="body-copy">No recorded absences. Keep it up!</p>
              )}
            </section>
          </>
        );
      })()}
    </KpiPageLayout>
  );
}
