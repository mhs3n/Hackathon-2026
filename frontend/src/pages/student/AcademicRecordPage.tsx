import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiLineChart } from "../../components/charts/KpiCharts";
import { PeriodBadge } from "../../components/ui/PeriodBadge";
import { StatCard } from "../../components/ui/StatCard";
import { useStudentSnapshot } from "../../lib/useStudentSnapshot";

const STATUS_LABEL: Record<"passing" | "at_risk" | "failing", { label: string; color: string }> = {
  passing: { label: "Passing", color: "#27ae60" },
  at_risk: { label: "At risk", color: "#f4b740" },
  failing: { label: "Failing", color: "#e85d6c" },
};

export function AcademicRecordPage() {
  const { snapshot, derived, error } = useStudentSnapshot();

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Academic Record</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!snapshot || !derived) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Academic Record</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const moduleBars = derived.modules.map((m) => ({ name: m.code, value: m.grade }));
  const attendanceBars = derived.modules.map((m) => ({ name: m.code, value: m.attendance }));
  const semesterGradeLine = derived.semesterTrend.map((s) => ({ name: s.name, value: s.grade }));
  const semesterAttLine = derived.semesterTrend.map((s) => ({ name: s.name, value: s.attendance }));

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Student</span>
          <h2>Academic Record</h2>
          <p>{snapshot.studentName} · {snapshot.institutionName}</p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard label="GPA" value={`${derived.gpa}/20`} helper="Across all current modules" accent="blue" />
        <StatCard
          label="Modules"
          value={`${derived.modules.length}`}
          helper={`${derived.passingCount} passing · ${derived.failingCount} failing`}
          accent="green"
        />
        <StatCard
          label="Avg attendance"
          value={`${snapshot.attendance}%`}
          helper="Current semester"
          accent="orange"
        />
        <StatCard
          label="Credits enrolled"
          value={`${derived.modules.reduce((s, m) => s + m.credits, 0)}`}
          helper="ECTS-style units"
          accent="red"
        />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Grades by module</h3>
            <span>Out of 20 · pass mark 10</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={moduleBars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
              <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
              <YAxis domain={[0, 20]} stroke="#60758a" fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" name="Grade" fill="#1d5394" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Attendance by module</h3>
            <span>Percent present</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={attendanceBars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
              <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#60758a" fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" name="Attendance %" fill="#f4b740" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Grade progression</h3>
            <span>Per semester · /20</span>
          </div>
          <KpiLineChart data={semesterGradeLine} color="#1d5394" />
        </section>
        <section className="panel">
          <div className="panel__header">
            <h3>Attendance progression</h3>
            <span>Per semester · %</span>
          </div>
          <KpiLineChart data={semesterAttLine} color="#27ae60" />
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Weekly attendance (last 8 weeks)</h3>
          <span>Trend in current semester</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={derived.attendanceWeekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3eaf3" />
            <XAxis dataKey="name" stroke="#60758a" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#60758a" fontSize={11} />
            <Tooltip />
            <Legend verticalAlign="top" height={24} iconSize={10} />
            <Bar dataKey="attendance" name="Attendance %" fill="#2f86c8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Module breakdown</h3>
          <span>{derived.modules.length} modules in the current semester</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#60758a", borderBottom: "1px solid #e3eaf3" }}>
                <th style={{ padding: "10px 8px" }}>Code</th>
                <th style={{ padding: "10px 8px" }}>Module</th>
                <th style={{ padding: "10px 8px" }}>Credits</th>
                <th style={{ padding: "10px 8px" }}>Grade</th>
                <th style={{ padding: "10px 8px" }}>Attendance</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {derived.modules.map((m) => {
                const meta = STATUS_LABEL[m.status];
                return (
                  <tr key={m.code} style={{ borderBottom: "1px solid #f0f4f8" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#13263b" }}>{m.code}</td>
                    <td style={{ padding: "10px 8px", color: "#3d4f63" }}>{m.name}</td>
                    <td style={{ padding: "10px 8px", color: "#3d4f63" }}>{m.credits}</td>
                    <td style={{ padding: "10px 8px", color: "#13263b", fontVariantNumeric: "tabular-nums" }}>
                      {m.grade.toFixed(1)}/20
                    </td>
                    <td style={{ padding: "10px 8px", color: "#3d4f63", fontVariantNumeric: "tabular-nums" }}>
                      {m.attendance}%
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 12,
                          background: `${meta.color}22`,
                          color: meta.color,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
