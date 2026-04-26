import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { FutureModulePage } from "./FutureModulePage";
import {
  STUDENT_LEVELS,
  deriveInstitutionStudents,
  isStudentsPanelEnabled,
  type MockStudent,
  type StudentLevel,
} from "../lib/institutionStudentsMock";

const cellStyle: CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid var(--border, #eef1f6)",
  whiteSpace: "nowrap",
};

const SLUG_FROM_LEVEL: Record<StudentLevel, string> = {
  "First grade": "first-grade",
  "Second grade": "second-grade",
  "Third grade": "third-grade",
  "Master degree": "master-degree",
};

type RiskRow = MockStudent & { riskScore: number; riskBand: "High" | "Medium" };

function computeRiskScore(s: MockStudent): number {
  // Higher score = higher risk. Combines low grade and low attendance.
  const gradeFactor = Math.max(0, (12 - s.averageGrade) / 12); // 0..1
  const attFactor = Math.max(0, (80 - s.attendanceRate) / 80); // 0..1
  return Math.round((gradeFactor * 0.6 + attFactor * 0.4) * 100);
}

function bandFor(score: number): "High" | "Medium" {
  return score >= 50 ? "High" : "Medium";
}

const bandStyles: Record<"High" | "Medium", { color: string; bg: string }> = {
  High: { color: "#c0392b", bg: "#fdecea" },
  Medium: { color: "#b07d11", bg: "#fdf3dc" },
};

type LevelFilter = "all" | StudentLevel;
type BandFilter = "all" | "High" | "Medium";

export function InstitutionRiskListPage() {
  const { user } = useAuth();
  const institutionId = user?.institutionId ?? "";
  const enabled = isStudentsPanelEnabled(institutionId);

  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [bandFilter, setBandFilter] = useState<BandFilter>("all");
  const [query, setQuery] = useState("");

  const atRiskRows: RiskRow[] = useMemo(() => {
    if (!enabled) return [];
    const byLevel = deriveInstitutionStudents(institutionId);
    if (!byLevel) return [];
    const rows: RiskRow[] = [];
    STUDENT_LEVELS.forEach((lvl) => {
      byLevel[lvl].forEach((s) => {
        if (s.status !== "At risk") return;
        const score = computeRiskScore(s);
        rows.push({ ...s, riskScore: score, riskBand: bandFor(score) });
      });
    });
    rows.sort((a, b) => b.riskScore - a.riskScore);
    return rows;
  }, [enabled, institutionId]);

  if (!enabled) {
    return (
      <FutureModulePage
        title="Student Risk List"
        description="The at-risk roster is available for institutions with imported student data."
        bullets={[
          "Aggregate students whose grades or attendance fall below the at-risk thresholds.",
          "Rank by composite risk score combining academic performance and engagement.",
          "Drill down into each level's roster from the Students sidebar group.",
        ]}
      />
    );
  }

  const totalAtRisk = atRiskRows.length;
  const counts = {
    high: atRiskRows.filter((r) => r.riskBand === "High").length,
    medium: atRiskRows.filter((r) => r.riskBand === "Medium").length,
    perLevel: STUDENT_LEVELS.reduce<Record<StudentLevel, number>>((acc, lvl) => {
      acc[lvl] = atRiskRows.filter((r) => r.level === lvl).length;
      return acc;
    }, {
      "First grade": 0,
      "Second grade": 0,
      "Third grade": 0,
      "Master degree": 0,
    }),
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = atRiskRows.filter((r) => {
    if (levelFilter !== "all" && r.level !== levelFilter) return false;
    if (bandFilter !== "all" && r.riskBand !== bandFilter) return false;
    if (normalizedQuery) {
      const hay = `${r.name} ${r.studentId} ${r.email}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
    }
    return true;
  });

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Institution Admin</span>
          <h2>Student Risk List</h2>
          <p>
            {user?.institutionShortName ?? "Institution"} · {totalAtRisk} student
            {totalAtRisk === 1 ? "" : "s"} flagged as at risk based on grades (&lt; 10/20) or
            attendance (&lt; 70%).
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <div style={summaryGrid}>
        <div style={summaryCard}>
          <div style={summaryLabel}>Total at risk</div>
          <div style={{ ...summaryValue, color: "#13263b" }}>{totalAtRisk}</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryLabel}>High risk</div>
          <div style={{ ...summaryValue, color: bandStyles.High.color }}>{counts.high}</div>
        </div>
        <div style={summaryCard}>
          <div style={summaryLabel}>Medium risk</div>
          <div style={{ ...summaryValue, color: bandStyles.Medium.color }}>{counts.medium}</div>
        </div>
        {STUDENT_LEVELS.map((lvl) => (
          <div key={lvl} style={summaryCard}>
            <div style={summaryLabel}>{lvl}</div>
            <div style={{ ...summaryValue, color: "#13263b" }}>{counts.perLevel[lvl]}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>At-risk students</h3>
          <span>
            {filteredRows.length} of {totalAtRisk}
          </span>
        </div>

        <div style={filtersBar}>
          <input
            type="search"
            placeholder="Search by name, ID or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input"
            style={{ flex: "1 1 240px", minWidth: 200 }}
          />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
            className="form-input"
            style={{ flex: "0 0 180px" }}
          >
            <option value="all">All levels</option>
            {STUDENT_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value as BandFilter)}
            className="form-input"
            style={{ flex: "0 0 160px" }}
          >
            <option value="all">All risk bands</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted, #5b6878)" }}>
                {[
                  "#",
                  "Student ID",
                  "Full name",
                  "Level",
                  "Avg. grade",
                  "Attendance",
                  "Risk score",
                  "Risk",
                  "Reason",
                  "",
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
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--muted, #5b6878)",
                    }}
                  >
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const reasons: string[] = [];
                  if (r.averageGrade < 10) reasons.push(`grade ${r.averageGrade.toFixed(2)}/20`);
                  if (r.attendanceRate < 70) reasons.push(`attendance ${r.attendanceRate}%`);
                  const reason = reasons.length ? reasons.join(" · ") : "low engagement";
                  const band = bandStyles[r.riskBand];
                  return (
                    <tr key={r.id}>
                      <td style={cellStyle}>{idx + 1}</td>
                      <td
                        style={{
                          ...cellStyle,
                          fontFamily: "monospace",
                          color: "var(--muted, #5b6878)",
                        }}
                      >
                        {r.studentId}
                      </td>
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted, #5b6878)" }}>{r.email}</div>
                      </td>
                      <td style={cellStyle}>{r.level}</td>
                      <td
                        style={{
                          ...cellStyle,
                          color: r.averageGrade < 10 ? "#c0392b" : "inherit",
                          fontWeight: r.averageGrade < 10 ? 600 : 400,
                        }}
                      >
                        {r.averageGrade.toFixed(2)} / 20
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: r.attendanceRate < 70 ? "#c0392b" : "inherit",
                          fontWeight: r.attendanceRate < 70 ? 600 : 400,
                        }}
                      >
                        {r.attendanceRate}%
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 80,
                              height: 6,
                              borderRadius: 999,
                              background: "#eef1f6",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${r.riskScore}%`,
                                height: "100%",
                                background: band.color,
                              }}
                            />
                          </div>
                          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
                            {r.riskScore}
                          </span>
                        </div>
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            color: band.color,
                            background: band.bg,
                          }}
                        >
                          {r.riskBand}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, color: "var(--muted, #5b6878)" }}>{reason}</td>
                      <td style={cellStyle}>
                        <Link
                          to={`/institution/students/${SLUG_FROM_LEVEL[r.level]}`}
                          style={{ fontSize: 13, color: "#1d63d1", fontWeight: 600 }}
                        >
                          View level
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

const summaryGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const summaryCard: CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border, #e3e7ee)",
  borderRadius: 10,
  padding: "12px 14px",
};

const summaryLabel: CSSProperties = {
  fontSize: 12,
  color: "var(--muted, #5b6878)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  fontWeight: 600,
};

const summaryValue: CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  marginTop: 4,
  fontVariantNumeric: "tabular-nums",
};

const filtersBar: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 14,
};
