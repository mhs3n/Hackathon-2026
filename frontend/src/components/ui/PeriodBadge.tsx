export function PeriodBadge({ label = "S2 2026", history = 4 }: { label?: string; history?: number }) {
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
      Reporting period · {label}
      <span style={{ fontWeight: 400, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>
        ({history} historical periods on record)
      </span>
    </span>
  );
}
