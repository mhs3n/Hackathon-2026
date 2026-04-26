export function FutureModulePage({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Planned Module</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel__header">
          <h3>Planned scope</h3>
          <span>Implementation roadmap</span>
        </div>
        <ul className="recommendation-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <div className="panel__header">
          <h3>UCAR alignment</h3>
          <span>Consolidated management vision</span>
        </div>
        <ul className="recommendation-list">
          <li>Feeds the consolidated multi-establishment view for UCAR leadership.</li>
          <li>Supports periodic synthesis reporting and benchmark comparison.</li>
          <li>Designed to integrate anomaly alerts and predictive analysis over time.</li>
        </ul>
      </div>
    </section>
  );
}
