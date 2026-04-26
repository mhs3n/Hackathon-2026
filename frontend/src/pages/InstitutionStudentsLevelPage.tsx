import { useMemo, type CSSProperties } from "react";
import { Navigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import {
  STUDENT_LEVELS,
  deriveInstitutionStudents,
  isStudentsPanelEnabled,
  type StudentLevel,
} from "../lib/institutionStudentsMock";

const SLUG_TO_LEVEL: Record<string, StudentLevel> = {
  "first-grade": "First grade",
  "second-grade": "Second grade",
  "third-grade": "Third grade",
  "master-degree": "Master degree",
};

export const STUDENT_LEVEL_SLUGS = Object.keys(SLUG_TO_LEVEL);

const cellStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--border, #eef1f6)",
  whiteSpace: "nowrap",
};

export function InstitutionStudentsLevelPage() {
  const { user } = useAuth();
  const { levelSlug } = useParams<{ levelSlug: string }>();

  const level = levelSlug ? SLUG_TO_LEVEL[levelSlug] : undefined;
  const institutionId = user?.institutionId ?? "";
  const enabled = isStudentsPanelEnabled(institutionId);

  const byLevel = useMemo(
    () => (enabled ? deriveInstitutionStudents(institutionId) : null),
    [enabled, institutionId],
  );

  if (!level) {
    return <Navigate to="/institution/dashboard" replace />;
  }

  if (!enabled || !byLevel) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Institution Admin</span>
            <h2>Students · {level}</h2>
            <p>Student rosters are not available for this institution.</p>
          </div>
        </header>
      </section>
    );
  }

  const students = byLevel[level];
  const totalAll = STUDENT_LEVELS.reduce((sum, lvl) => sum + byLevel[lvl].length, 0);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Institution Admin · Data Import</span>
          <h2>{level} students</h2>
          <p>
            {user?.institutionShortName ?? "Institution"} · {students.length} students enrolled in
            {" "}
            <strong>{level}</strong> ({totalAll} total across all levels).
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel__header">
          <h3>Roster</h3>
          <span>{students.length} students</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted, #5b6878)" }}>
                {[
                  "#",
                  "Student ID",
                  "Full name",
                  "Gender",
                  "Email",
                  "Enrolled",
                  "Avg. grade",
                  "Attendance",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--border, #e3e7ee)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const statusColor =
                  s.status === "At risk"
                    ? "#c0392b"
                    : s.status === "On leave"
                    ? "#b07d11"
                    : "#1f8a3a";
                const statusBg =
                  s.status === "At risk"
                    ? "#fdecea"
                    : s.status === "On leave"
                    ? "#fdf3dc"
                    : "#e7f6ec";
                return (
                  <tr key={s.id}>
                    <td style={cellStyle}>{idx + 1}</td>
                    <td style={{ ...cellStyle, fontFamily: "monospace", color: "var(--muted, #5b6878)" }}>
                      {s.studentId}
                    </td>
                    <td style={cellStyle}>{s.name}</td>
                    <td style={cellStyle}>{s.gender}</td>
                    <td style={{ ...cellStyle, color: "var(--muted, #5b6878)" }}>{s.email}</td>
                    <td style={cellStyle}>{s.enrollmentYear}</td>
                    <td style={cellStyle}>{s.averageGrade.toFixed(2)} / 20</td>
                    <td style={cellStyle}>{s.attendanceRate}%</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          color: statusColor,
                          background: statusBg,
                        }}
                      >
                        {s.status}
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
