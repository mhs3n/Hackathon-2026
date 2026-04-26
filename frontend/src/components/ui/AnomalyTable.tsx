import { Fragment, useMemo, useState } from "react";

import type { Institution, RiskAlertRecord } from "../../types";

const SEVERITY_STYLE: Record<RiskAlertRecord["severity"], { color: string; bg: string; label: string }> = {
  high: { color: "#e85d6c", bg: "#fdecee", label: "High" },
  medium: { color: "#f4b740", bg: "#fdf5e3", label: "Med" },
  low: { color: "#2f86c8", bg: "#e8f1fa", label: "Low" },
};

const SEVERITY_RANK: Record<RiskAlertRecord["severity"], number> = { high: 3, medium: 2, low: 1 };

function prettifyMetric(metric: string): string {
  return metric
    .replace(/_/g, " ")
    .replace(/pct/i, "%")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(metric: string, value: number): string {
  if (metric.includes("rate") || metric.includes("pct")) return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

type SortKey = "severity" | "institution" | "metric" | "z";

export function AnomalyTable({
  alerts,
  institutions,
  emptyText = "No anomalies detected this period.",
}: {
  alerts: RiskAlertRecord[];
  institutions: Institution[];
  emptyText?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDesc, setSortDesc] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const instById = useMemo(
    () => new Map(institutions.map((i) => [i.id, i])),
    [institutions],
  );

  const sorted = useMemo(() => {
    const list = [...alerts];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "severity") {
        cmp = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      } else if (sortKey === "institution") {
        const ai = instById.get(a.institutionId ?? "")?.shortName ?? "";
        const bi = instById.get(b.institutionId ?? "")?.shortName ?? "";
        cmp = ai.localeCompare(bi);
      } else if (sortKey === "metric") {
        cmp = (a.anomaly?.metric ?? "").localeCompare(b.anomaly?.metric ?? "");
      } else if (sortKey === "z") {
        cmp = Math.abs(a.anomaly?.zScore ?? 0) - Math.abs(b.anomaly?.zScore ?? 0);
      }
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [alerts, instById, sortKey, sortDesc]);

  if (alerts.length === 0) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>{emptyText}</p>;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const headerCell = (label: string, key: SortKey, align: "left" | "right" = "left") => (
    <th
      onClick={() => handleSort(key)}
      style={{
        textAlign: align,
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        color: "var(--muted)",
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {sortKey === key && <span style={{ marginLeft: 4 }}>{sortDesc ? "↓" : "↑"}</span>}
    </th>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e3eaf3" }}>
            {headerCell("Severity", "severity")}
            {headerCell("Institution", "institution")}
            {headerCell("KPI", "metric")}
            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--muted)" }}>
              Value
            </th>
            <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--muted)" }}>
              UCAR avg
            </th>
            {headerCell("z-score", "z", "right")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((alert) => {
            const inst = instById.get(alert.institutionId ?? "");
            const sev = SEVERITY_STYLE[alert.severity];
            const meta = alert.anomaly;
            const isOpen = openId === alert.id;
            const z = meta?.zScore ?? 0;
            return (
              <Fragment key={alert.id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : alert.id)}
                  style={{
                    borderBottom: isOpen ? "none" : "1px solid #eef2f7",
                    cursor: "pointer",
                    background: isOpen ? "#f7f9fc" : "transparent",
                  }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: sev.bg,
                        color: sev.color,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: sev.color }} />
                      {sev.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#13263b", fontWeight: 500 }}>
                    <div>{inst?.shortName ?? alert.institutionId}</div>
                    {inst && (
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{inst.region}</div>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#3d4f63" }}>
                    {meta ? prettifyMetric(meta.metric) : alert.title}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#13263b", fontVariantNumeric: "tabular-nums" }}>
                    {meta ? formatValue(meta.metric, meta.value) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                    {meta ? formatValue(meta.metric, meta.peerMean) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: z > 0 ? "#e85d6c" : "#2f86c8" }}>
                    {meta ? `${z >= 0 ? "+" : ""}${z.toFixed(2)}σ` : "—"}
                  </td>
                </tr>
                {isOpen && (
                  <tr style={{ borderBottom: "1px solid #eef2f7", background: "#f7f9fc" }}>
                    <td colSpan={6} style={{ padding: "0 12px 12px" }}>
                      <div style={{ fontSize: 12.5, color: "#3d4f63", lineHeight: 1.5 }}>
                        {alert.explanation}
                      </div>
                      {alert.predictedImpact && (
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
                          <strong style={{ color: "#3d4f63" }}>Predicted impact:</strong>{" "}
                          {alert.predictedImpact}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
