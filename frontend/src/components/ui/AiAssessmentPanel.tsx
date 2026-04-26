import type { AiAssessment } from "../../types";

const LEVEL_COLOR: Record<AiAssessment["level"], string> = {
  Low: "#27ae60",
  Medium: "#f4b740",
  High: "#e85d6c",
};

export function AiAssessmentPanel({
  title = "AI Risk Assessment",
  subtitle = "Explainable score from the UCAR engine",
  assessment,
}: {
  title?: string;
  subtitle?: string;
  assessment: AiAssessment;
}) {
  const color = LEVEL_COLOR[assessment.level];
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: `conic-gradient(${color} ${assessment.score * 3.6}deg, #eef2f7 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: "#13263b" }}>
              {assessment.score}
            </span>
            <span style={{ fontSize: 10, color: "#60758a", textTransform: "uppercase" }}>
              risk
            </span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 12,
              background: `${color}22`,
              color,
              fontWeight: 600,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {assessment.level} risk
          </span>
          <p style={{ marginTop: 8, color: "#3d4f63", lineHeight: 1.5, fontSize: 13 }}>
            {assessment.summary}
          </p>
        </div>
      </div>

      <div>
        <span style={{ fontSize: 11, color: "#60758a", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Top contributing factors
        </span>
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
          {assessment.topFactors.map((factor) => {
            const maxImpact = Math.max(...assessment.topFactors.map((f) => f.impact), 1);
            const pct = (factor.impact / maxImpact) * 100;
            return (
              <li key={factor.feature} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "#3d4f63" }}>{factor.explanation}</span>
                  <span style={{ color: "#60758a", fontVariantNumeric: "tabular-nums" }}>
                    +{factor.impact.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: 6, background: "#eef2f7", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: color,
                      transition: "width 300ms",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
