import { useMemo, useState } from "react";

import {
  STUDENT_LEVELS,
  deriveInstitutionStudents,
  isStudentsPanelEnabled,
  totalStudents,
  type StudentLevel,
} from "../../lib/institutionStudentsMock";

type Props = {
  institutionId: string;
  institutionShortName: string;
};

export function InstitutionStudentsPanel({ institutionId, institutionShortName }: Props) {
  const enabled = isStudentsPanelEnabled(institutionId);
  const byLevel = useMemo(
    () => (enabled ? deriveInstitutionStudents(institutionId) : null),
    [enabled, institutionId],
  );

  const [open, setOpen] = useState(false);
  const [openLevels, setOpenLevels] = useState<Set<StudentLevel>>(new Set());

  if (!enabled || !byLevel) return null;

  const total = totalStudents(byLevel);

  const toggleLevel = (level: StudentLevel) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  return (
    <section className="panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div className="panel__header" style={{ marginBottom: 0 }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                transform: open ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            >
              ▶
            </span>
            Students
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--surface-muted, #eef1f6)",
                color: "var(--muted, #5b6878)",
              }}
            >
              {total}
            </span>
          </h3>
          <span>{institutionShortName} · roster by level</span>
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {STUDENT_LEVELS.map((level) => {
            const students = byLevel[level];
            const isLevelOpen = openLevels.has(level);
            return (
              <div
                key={level}
                style={{
                  border: "1px solid var(--border, #e3e7ee)",
                  borderRadius: 10,
                  background: "var(--surface, #fff)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleLevel(level)}
                  aria-expanded={isLevelOpen}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: "12px 14px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      aria-hidden
                      style={{
                        display: "inline-block",
                        transform: isLevelOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.15s ease",
                        color: "var(--muted, #5b6878)",
                      }}
                    >
                      ▶
                    </span>
                    <strong>{level}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "var(--surface-muted, #eef1f6)",
                      color: "var(--muted, #5b6878)",
                    }}
                  >
                    {students.length} students
                  </span>
                </button>

                {isLevelOpen && (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: "0 14px 14px",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "6px 16px",
                    }}
                  >
                    {students.map((s) => (
                      <li
                        key={s.id}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: "var(--surface-muted, #f7f9fc)",
                          fontSize: 14,
                        }}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
