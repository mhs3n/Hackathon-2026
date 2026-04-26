export function ReportsPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Reporting</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="panel">
        <div className="panel__header">
          <h3>Generated Summary Preview</h3>
          <span>Explainable output</span>
        </div>
        <p className="body-copy">
          This report layer is where UCAR Insight will generate decision-ready summaries, exportable PDF
          views, and executive narratives from the structured KPI data and AI alerts.
        </p>
      </div>
    </section>
  );
}
