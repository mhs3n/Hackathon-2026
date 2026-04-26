import type { ReactNode } from "react";

type KpiPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  children: ReactNode;
};

export function KpiPageLayout({ eyebrow, title, description, loading, error, children }: KpiPageLayoutProps) {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {error ? (
        <div className="panel">
          <p style={{ color: "#e85d6c" }}>{error}</p>
        </div>
      ) : loading ? (
        <div className="panel">
          <p>Loading data…</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
