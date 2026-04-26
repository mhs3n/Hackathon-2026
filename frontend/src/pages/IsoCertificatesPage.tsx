import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { fetchInstitutionDashboard, fetchUcarDashboard } from "../lib/api";
import { usePeriod } from "../period/PeriodContext";
import type { Institution } from "../types";

type IsoStandard = {
  code: string;
  title: string;
  category: "Quality" | "Education" | "Environment" | "Security" | "Safety" | "Energy" | "Continuity" | "Ethics";
  scope: string;
};

const ISO_CATALOG: IsoStandard[] = [
  {
    code: "ISO 9001",
    title: "Quality Management Systems",
    category: "Quality",
    scope: "Process quality, continuous improvement and stakeholder satisfaction.",
  },
  {
    code: "ISO 21001",
    title: "Educational Organisations Management",
    category: "Education",
    scope: "Tailored management standard for academic institutions and learners.",
  },
  {
    code: "ISO 14001",
    title: "Environmental Management",
    category: "Environment",
    scope: "Environmental impact, waste reduction and sustainability across campuses.",
  },
  {
    code: "ISO/IEC 27001",
    title: "Information Security Management",
    category: "Security",
    scope: "Protection of academic, student and research information assets.",
  },
  {
    code: "ISO 45001",
    title: "Occupational Health & Safety",
    category: "Safety",
    scope: "Safe working conditions for staff, students and external collaborators.",
  },
  {
    code: "ISO 50001",
    title: "Energy Management",
    category: "Energy",
    scope: "Energy efficiency for buildings, labs and infrastructure.",
  },
  {
    code: "ISO 22301",
    title: "Business Continuity",
    category: "Continuity",
    scope: "Resilience to disruptions affecting teaching, exams and operations.",
  },
  {
    code: "ISO 37001",
    title: "Anti-bribery Management",
    category: "Ethics",
    scope: "Ethics, anti-corruption and procurement transparency controls.",
  },
];

const CATEGORY_COLOR: Record<IsoStandard["category"], string> = {
  Quality: "#24517f",
  Education: "#7a4cff",
  Environment: "#27a36b",
  Security: "#1f9bb5",
  Safety: "#e85d6c",
  Energy: "#c9a14a",
  Continuity: "#5c6f88",
  Ethics: "#a36a26",
};

/** Stable, deterministic pseudo-random in [0, 1) seeded by a string id. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Deterministic split of the ISO catalog into "held" and "recommended" lists
 * for an institution, based on a hash of its id. Always returns at least one
 * recommendation if there are any standards left.
 */
function getIsoStatus(institutionId: string): { held: IsoStandard[]; recommended: IsoStandard[] } {
  // Order the catalog by a per-institution permutation
  const ordered = [...ISO_CATALOG]
    .map((std, i) => ({ std, key: hashSeed(`${institutionId}|${std.code}|${i}`) }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.std);

  const heldCount = 1 + Math.floor(hashSeed(`held|${institutionId}`) * 4); // 1..4
  const held = ordered.slice(0, heldCount);
  const recommended = ordered.slice(heldCount, heldCount + 3);
  return { held, recommended };
}

function CategoryBadge({ category }: { category: IsoStandard["category"] }) {
  const color = CATEGORY_COLOR[category];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: `${color}1a`,
        color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
      {category}
    </span>
  );
}

function StatusCell({ kind }: { kind: "held" | "recommended" | "none" }) {
  if (kind === "held") {
    return (
      <span
        title="Certified"
        style={{
          display: "inline-flex",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#e8f7ee",
          color: "#1f8a4c",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        ✓
      </span>
    );
  }
  if (kind === "recommended") {
    return (
      <span
        title="Recommended"
        style={{
          display: "inline-flex",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#fdf3dc",
          color: "#a36a26",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 13,
        }}
      >
        ↗
      </span>
    );
  }
  return <span style={{ color: "#c9d1da" }}>—</span>;
}

/* ----------------------------- UCAR-wide view ----------------------------- */

export function UcarIsoPage() {
  const { periodId } = usePeriod();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!periodId) return;
    let active = true;
    fetchUcarDashboard(periodId)
      .then((d) => active && (setInstitutions(d.institutions), setError(null)))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [periodId]);

  const summary = useMemo(() => {
    let totalHeld = 0;
    let totalRecommended = 0;
    institutions.forEach((inst) => {
      const status = getIsoStatus(inst.id);
      totalHeld += status.held.length;
      totalRecommended += status.recommended.length;
    });
    return { totalHeld, totalRecommended };
  }, [institutions]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="UCAR Admin"
        title="ISO Certifications"
        breadcrumbs={[{ label: "UCAR Overview", to: "/admin/dashboard" }, { label: "ISO Certifications" }]}
        description={
          error ?? "Track which international management standards each UCAR institution holds, and which ones are recommended next."
        }
      />

      <div className="stats-grid stats-grid--four">
        <StatCard label="Institutions" value={String(institutions.length)} helper="Tracked." accent="blue" />
        <StatCard label="Certifications held" value={String(summary.totalHeld)} helper="Across the network." accent="green" />
        <StatCard label="Recommended next" value={String(summary.totalRecommended)} helper="Identified opportunities." accent="orange" />
        <StatCard label="Standards covered" value={String(ISO_CATALOG.length)} helper="In the ISO catalog." accent="blue" />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Certification matrix</h3>
          <span>
            <span style={{ marginRight: 12 }}>
              <StatusCell kind="held" /> Certified
            </span>
            <span>
              <StatusCell kind="recommended" /> Recommended
            </span>
          </span>
        </div>
        <div className="responsive-table">
          <table className="data-table">
            <thead>
              <tr style={{ borderBottom: "1px solid #e3eaf3" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--muted)",
                    position: "sticky",
                    left: 0,
                    background: "white",
                  }}
                >
                  Institution
                </th>
                {ISO_CATALOG.map((std) => (
                  <th
                    key={std.code}
                    title={std.title}
                    style={{
                      textAlign: "center",
                      padding: "10px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: CATEGORY_COLOR[std.category],
                      whiteSpace: "nowrap",
                    }}
                  >
                    {std.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => {
                const status = getIsoStatus(inst.id);
                const heldCodes = new Set(status.held.map((s) => s.code));
                const recCodes = new Set(status.recommended.map((s) => s.code));
                return (
                  <tr key={inst.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontWeight: 500,
                        color: "#13263b",
                        position: "sticky",
                        left: 0,
                        background: "white",
                      }}
                    >
                      <div>{inst.shortName}</div>
                      <small style={{ color: "var(--muted)" }}>{inst.region}</small>
                    </td>
                    {ISO_CATALOG.map((std) => {
                      const kind: "held" | "recommended" | "none" = heldCodes.has(std.code)
                        ? "held"
                        : recCodes.has(std.code)
                          ? "recommended"
                          : "none";
                      return (
                        <td key={std.code} style={{ padding: "8px 0", textAlign: "center" }}>
                          <StatusCell kind={kind} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {institutions.length === 0 ? (
                <tr>
                  <td colSpan={ISO_CATALOG.length + 1} style={{ padding: 16, color: "var(--muted)" }}>
                    Loading institutions…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>ISO catalog</h3>
          <span>{ISO_CATALOG.length} standards monitored</span>
        </div>
        <div className="iso-catalog">
          {ISO_CATALOG.map((std) => (
            <article className="iso-catalog__card" key={std.code}>
              <div className="iso-catalog__head">
                <strong>{std.code}</strong>
                <CategoryBadge category={std.category} />
              </div>
              <div className="iso-catalog__title">{std.title}</div>
              <p className="iso-catalog__scope">{std.scope}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

/* ------------------------- Single-institution view ------------------------- */

export function InstitutionIsoPage() {
  const { user } = useAuth();
  const { periodId } = usePeriod();
  const [institutionName, setInstitutionName] = useState<string>(user?.institutionName ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.institutionId || !periodId) return;
    let active = true;
    fetchInstitutionDashboard(user.institutionId, periodId)
      .then((d) => active && setInstitutionName(d.institution.name))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [user?.institutionId, periodId]);

  if (!user?.institutionId) {
    return (
      <section className="page">
        <PageHeader eyebrow="Institution" title="ISO Certifications" description="No institution attached to this account." />
      </section>
    );
  }

  const status = getIsoStatus(user.institutionId);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Institution"
        title="ISO Certifications"
        breadcrumbs={[{ label: "Institution Dashboard", to: "/institution/dashboard" }, { label: "ISO Certifications" }]}
        description={
          error
            ?? `Certifications currently held by ${institutionName} and the international standards recommended as next steps.`
        }
      />

      <div className="stats-grid stats-grid--four">
        <StatCard label="Held" value={String(status.held.length)} helper="Active certifications." accent="green" />
        <StatCard label="Recommended" value={String(status.recommended.length)} helper="Suggested next steps." accent="orange" />
        <StatCard
          label="Coverage"
          value={`${Math.round((status.held.length / ISO_CATALOG.length) * 100)}%`}
          helper="Of the ISO catalog."
          accent="blue"
        />
        <StatCard label="Catalog" value={String(ISO_CATALOG.length)} helper="Standards tracked." accent="blue" />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Current certifications</h3>
          <span>{status.held.length} active</span>
        </div>
        {status.held.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>No certifications recorded yet.</p>
        ) : (
          <div className="iso-catalog">
            {status.held.map((std) => (
              <article className="iso-catalog__card iso-catalog__card--held" key={std.code}>
                <div className="iso-catalog__head">
                  <strong>{std.code}</strong>
                  <span className="iso-catalog__pill iso-catalog__pill--held">Certified</span>
                </div>
                <div className="iso-catalog__title">{std.title}</div>
                <CategoryBadge category={std.category} />
                <p className="iso-catalog__scope">{std.scope}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Recommended next</h3>
          <span>{status.recommended.length} opportunities</span>
        </div>
        {status.recommended.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>All catalog standards are already held.</p>
        ) : (
          <div className="iso-catalog">
            {status.recommended.map((std) => (
              <article className="iso-catalog__card iso-catalog__card--rec" key={std.code}>
                <div className="iso-catalog__head">
                  <strong>{std.code}</strong>
                  <span className="iso-catalog__pill iso-catalog__pill--rec">Recommended</span>
                </div>
                <div className="iso-catalog__title">{std.title}</div>
                <CategoryBadge category={std.category} />
                <p className="iso-catalog__scope">{std.scope}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
