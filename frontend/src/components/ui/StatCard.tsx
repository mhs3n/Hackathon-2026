import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  accent: "blue" | "orange" | "green" | "red";
  children?: ReactNode;
};

export function StatCard({ label, value, helper, accent, children }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        <strong className="stat-card__value">{value}</strong>
      </div>
      <p className="stat-card__helper">{helper}</p>
      {children}
    </article>
  );
}
