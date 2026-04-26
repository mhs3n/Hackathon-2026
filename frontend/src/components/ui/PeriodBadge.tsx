import { usePeriod } from "../../period/PeriodContext";

export function PeriodBadge({ label, history }: { label?: string; history?: number } = {}) {
  const { periods, periodId } = usePeriod();
  const active = periods.find((p) => p.id === periodId);
  const resolvedLabel = label ?? active?.label ?? "Current period";
  const resolvedHistory = history ?? Math.max(periods.length - 1, 0);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 10px",
        borderRadius: 999,
        background: "#eef4fa",
        color: "#1d5394",
        fontSize: 11.5,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#27ae60",
          display: "inline-block",
        }}
      />
      Reporting period · {resolvedLabel}
      <span style={{ fontWeight: 400, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>
        ({resolvedHistory} historical periods on record)
      </span>
    </span>
  );
}
