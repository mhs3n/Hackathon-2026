import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="public-page">
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="site-brand" to="/">
            <img className="site-brand__logo" src="/assets/ucar-logo.png" alt="University of Carthage logo" />
            <div>
              <span className="site-brand__eyebrow">University of Carthage</span>
            </div>
          </Link>

          <nav className="site-header__nav">
            <a href="#platform">Platform</a>
            <a href="#roles">Roles</a>
            <a href="#reports">Reports</a>
            <Link className="site-header__login" to="/login">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <span className="site-pill">Central Intelligence Platform</span>
            <h1>One consolidated view for all UCAR establishments.</h1>
            <p>
              A smart management platform that centralizes operational, academic, financial, and
              environmental data in real time to support strategic decision-making through key performance
              indicators, intelligent alerts, periodic reports, and predictive analysis.
            </p>
            <div className="landing-hero__actions">
              <Link className="primary-button" to="/login">
                Go to Login
              </Link>
              <a className="ghost-button ghost-button--light" href="#login-section">
                View Login Section
              </a>
            </div>
          </div>

          <div className="landing-preview">
            <div className="landing-preview__panel">
              <span className="site-pill site-pill--soft">Vue consolidée multi-établissements</span>
              <h2>Aggregation, alerts, reports, and prediction</h2>
              <ul>
                <li>Aggregation and comparison of KPIs between establishments.</li>
                <li>Intelligent alerts on anomalies and critical thresholds.</li>
                <li>Automatic periodic reports and predictive analytics engine.</li>
              </ul>
            </div>
            <div className="landing-preview__stats">
              <div className="landing-stat">
                <strong>35</strong>
                <span>Institutions tracked</span>
              </div>
              <div className="landing-stat">
                <strong>3</strong>
                <span>Role-based workspaces</span>
              </div>
              <div className="landing-stat">
                <strong>1</strong>
                <span>Unified KPI language</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="platform">
          <div className="section-heading">
            <span className="site-pill site-pill--soft">Platform</span>
            <h2>Built around the real UCAR brief.</h2>
            <p>
              The platform must cover the major university processes while keeping one shared data model and
              one UCAR-wide management layer.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Academic and student life</h3>
              <p>Success rate, attendance, repetition, dropout, examinations, scolarite, and student life indicators.</p>
            </article>
            <article className="feature-card">
              <h3>Insertion, partnerships, and strategy</h3>
              <p>National and international conventions, employability, insertion delay, partnerships, and strategic follow-up.</p>
            </article>
            <article className="feature-card">
              <h3>Finance, ESG, and operations</h3>
              <p>Budget allocated versus consumed, cost per student, energy use, carbon footprint, recycling, mobility, HR, infrastructure, and equipment.</p>
            </article>
          </div>
        </section>

        <section className="landing-section" id="roles">
          <div className="section-heading">
            <span className="site-pill site-pill--soft">Coverage</span>
            <h2>Processes and synthesis dashboards.</h2>
          </div>

          <div className="role-strip">
            <div className="role-strip__item">
              <strong>Governance</strong>
              <span>Consolidated dashboard with KPI comparison and strategic synthesis reports.</span>
            </div>
            <div className="role-strip__item">
              <strong>Operations</strong>
              <span>Finance, HR, research, infrastructure, equipment, warehouse, and pedagogy process views.</span>
            </div>
            <div className="role-strip__item">
              <strong>Prediction</strong>
              <span>Forecasts, anomaly detection, and explainable signals for decision support.</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--login" id="login-section">
          <div className="section-heading">
            <span className="site-pill site-pill--soft">Login Section</span>
            <h2>Access the prototype.</h2>
            <p>Use the dedicated login page to enter one of the demo role flows.</p>
          </div>

          <div className="login-section-card">
            <div>
              <h3>Demo entry</h3>
              <p>
                The login flow is separate from the public landing page. This keeps the product entry
                cleaner and closer to a real platform structure.
              </p>
            </div>
            <Link className="primary-button" to="/login">
              Open Login
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <strong>University of Carthage</strong>
            <p>Hackathon prototype for data centralization, KPI intelligence, and explainable university analytics.</p>
          </div>
          <div className="site-footer__meta">
            <span>University of Carthage</span>
            <span>AI · Data · Governance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
