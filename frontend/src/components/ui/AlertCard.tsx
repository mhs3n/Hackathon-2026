import type { RiskAlertRecord } from "../../types";

const SEVERITY_STYLE: Record<RiskAlertRecord["severity"], { color: string; label: string; bg: string }> = {
  high: { color: "#e85d6c", label: "High", bg: "#fdecee" },
  medium: { color: "#f4b740", label: "Medium", bg: "#fdf5e3" },
  low: { color: "#2f86c8", label: "Low", bg: "#e8f1fa" },
};

export function AlertCard({
  alert,
  institutionLabel,
}: {
  alert: RiskAlertRecord;
  institutionLabel?: string;
}) {
  const style = SEVERITY_STYLE[alert.severity];
  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid #e3eaf3",
        borderLeft: `4px solid ${style.color}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 8,
              background: style.bg,
              color: style.color,
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {style.label}
          </span>
          <h4 style={{ margin: "6px 0 0", fontSize: 14, color: "#13263b", fontWeight: 600 }}>
            {alert.title}
          </h4>
          {institutionLabel && (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{institutionLabel}</span>
          )}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: "#3d4f63", lineHeight: 1.5 }}>
        {alert.explanation}
      </p>
      {alert.predictedImpact && (
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)", borderTop: "1px dashed #e3eaf3", paddingTop: 6 }}>
          <strong style={{ color: "#3d4f63" }}>Predicted impact:</strong> {alert.predictedImpact}
        </p>
      )}
    </article>
  );
}
