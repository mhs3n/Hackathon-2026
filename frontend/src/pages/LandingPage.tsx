import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const HERO_SLIDES = [
  "/assets/hero/hero-1.jpeg",
  "/assets/hero/hero-2.jpeg",
  "/assets/hero/hero-3.webp",
];

const NEWS = [
  {
    tag: "International",
    date: "March 2026",
    title: "Higher Education at the Heart of the 2030 Agenda",
    excerpt:
      "International workshop in Sidi Dhrif gathers UCAR institutions around sustainability and global goals.",
    image: "/assets/news/news-international.jpg",
  },
  {
    tag: "Hackathon",
    date: "February 2026",
    title: "HACK4UCAR — National University Hackathon",
    excerpt:
      "AI, Digitalization, and Green Sustainability take center stage with student teams across 35 institutions.",
    image: "/assets/news/news-hackathon.jpg",
  },
  {
    tag: "Energy",
    date: "January 2026",
    title: "UCAR at the Heart of the Sustainable Energy Transition",
    excerpt:
      "Cross-border collaboration on renewable energy solutions opens new research and partnership pathways.",
    image: "/assets/news/news-energy.jpg",
  },
];

const STATS = [
  { value: 35, suffix: "", label: "Academic institutions" },
  { value: 7, suffix: "", label: "KPI domains tracked" },
  { value: 1988, suffix: "", label: "Founded" },
  { value: 100, suffix: "%", label: "Data centralized" },
];

const PILLARS = [
  {
    title: "Academic Programs",
    body:
      "From undergraduate to postgraduate studies, the platform consolidates academic indicators across every UCAR institution.",
    cta: "Learn more",
  },
  {
    title: "Research Excellence",
    body:
      "Research activity, doctoral schools, and innovation outputs are tracked with explainable, comparable indicators.",
    cta: "Learn more",
  },
  {
    title: "Global Partnerships",
    body:
      "National and international agreements, mobility, and employability — all unified in a single governance view.",
    cta: "Learn more",
  },
];

const INSTITUTION_GROUPS = [
  { letter: "E", names: ["ENICarthage", "ENSTAB", "ENSI", "EPT", "ESC Tunis"] },
  { letter: "F", names: ["FSB", "FSEG Nabeul", "FSEG Jendouba", "FSJPS Jendouba"] },
  { letter: "I", names: ["INSAT", "ISSAT Mateur", "ISLAIB Béja", "ISCAE Manouba"] },
  { letter: "T", names: ["IPEIN", "IHEC Carthage", "ISG Tunis", "ISTLS Sousse"] },
];

function useCountUp(target: number, duration = 1400, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function StatTile({ value, suffix, label, active }: { value: number; suffix: string; label: string; active: boolean }) {
  const v = useCountUp(value, 1400, active);
  return (
    <div className="ucar-stat">
      <strong>
        {v.toLocaleString()}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}

export function LandingPage() {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsActive, setStatsActive] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStatsActive(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="ucar-page">
      {/* Top utility bar */}
      <div className="ucar-topbar">
        <div className="ucar-topbar__inner">
          <span>Avenue de la République, BP 77 — 1054 Amilcar, Tunisia</span>
          <div className="ucar-topbar__links">
            <a href="#contact">Contact</a>
            <a href="https://ucar.rnu.tn" target="_blank" rel="noreferrer">
              ucar.rnu.tn
            </a>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="ucar-header">
        <div className="ucar-header__inner">
          <Link className="ucar-brand" to="/">
            <img src="/assets/ucar-logo.png" alt="University of Carthage" />
            <div className="ucar-brand__text">
              <strong>University of Carthage</strong>
              <span>Université de Carthage</span>
            </div>
          </Link>
          <nav className="ucar-nav">
            <a href="#about">About</a>
            <a href="#programs">Programs</a>
            <a href="#research">Research</a>
            <a href="#news">News</a>
            <a href="#institutions">Institutions</a>
            <a href="#contact">Contact</a>
            <Link className="ucar-nav__cta" to="/login">
              Open Platform
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="ucar-hero">
          <div className="ucar-hero__slides" aria-hidden>
            {HERO_SLIDES.map((src, i) => (
              <div
                key={src}
                className={`ucar-hero__slide${i === slide ? " ucar-hero__slide--active" : ""}`}
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
          <div className="ucar-hero__overlay" aria-hidden />
          <div className="ucar-hero__content">
            <span className="ucar-eyebrow">University of Carthage</span>
            <h1>I shall either find a way or make one.</h1>
            <p>
              A consolidated intelligence platform for all UCAR establishments — centralizing academic,
              financial, research, and operational data into a single governance view.
            </p>
            <div className="ucar-hero__actions">
              <Link className="ucar-btn ucar-btn--primary" to="/login">
                Access the Platform
              </Link>
              <a className="ucar-btn ucar-btn--ghost" href="#about">
                Discover UCAR
              </a>
            </div>
          </div>
          <div className="ucar-hero__dots" role="tablist" aria-label="Hero slides">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === slide}
                aria-label={`Go to slide ${i + 1}`}
                className={`ucar-hero__dot${i === slide ? " ucar-hero__dot--active" : ""}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
          <a className="ucar-hero__scroll" href="#about" aria-label="Scroll down">
            <span />
          </a>
        </section>

        {/* Three pillars */}
        <section className="ucar-section ucar-pillars" id="about">
          <div className="ucar-container">
            <div className="ucar-pillars__grid">
              {PILLARS.map((p) => (
                <article className="ucar-pillar" key={p.title}>
                  <div className="ucar-pillar__icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 10l9-6 9 6v10H3z" />
                      <path d="M9 20v-6h6v6" />
                    </svg>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <a className="ucar-link" href="#programs">
                    {p.cta} →
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* News & Articles */}
        <section className="ucar-section ucar-news" id="news">
          <div className="ucar-container">
            <header className="ucar-section__head">
              <span className="ucar-eyebrow ucar-eyebrow--dark">Latest updates</span>
              <h2>News &amp; Articles</h2>
              <p>
                Explore highlights from across the University of Carthage — research initiatives, hackathons,
                international workshops, and academic events.
              </p>
            </header>

            <div className="ucar-news__grid">
              {NEWS.map((n, i) => (
                <article className={`ucar-news-card ucar-news-card--${i + 1}`} key={n.title}>
                  <div
                    className="ucar-news-card__image"
                    aria-hidden
                    style={{ backgroundImage: `url(${n.image})` }}
                  />
                  <div className="ucar-news-card__body">
                    <div className="ucar-news-card__meta">
                      <span className="ucar-tag">{n.tag}</span>
                      <span>{n.date}</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.excerpt}</p>
                    <a className="ucar-link" href="#news">
                      Read more →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="ucar-section ucar-stats-section" id="programs">
          <div className="ucar-stats-section__bg" aria-hidden />
          <div className="ucar-container">
            <header className="ucar-section__head ucar-section__head--light">
              <span className="ucar-eyebrow ucar-eyebrow--light">UCAR in numbers</span>
              <h2>Among the top universities in Tunisia for research and innovation.</h2>
            </header>
            <div className="ucar-stats" ref={statsRef}>
              {STATS.map((s) => (
                <StatTile key={s.label} value={s.value} suffix={s.suffix} label={s.label} active={statsActive} />
              ))}
            </div>
          </div>
        </section>

        {/* Community */}
        <section className="ucar-section ucar-community" id="research">
          <div className="ucar-container ucar-community__grid">
            <div className="ucar-community__media" aria-hidden>
              <div className="ucar-community__photo" />
              <div className="ucar-community__badge">
                <strong>1988</strong>
                <span>Established under the Ministry of Higher Education and Scientific Research</span>
              </div>
            </div>
            <div className="ucar-community__copy">
              <span className="ucar-eyebrow ucar-eyebrow--dark">Campus life</span>
              <h2>A vibrant community for learning and growth.</h2>
              <p>
                Life at the University of Carthage offers a vibrant campus experience enriched by diverse
                cultural, social, and sports activities — fostering creativity, collaboration, and lifelong
                connections.
              </p>
              <ul className="ucar-checks">
                <li>Cultural and academic clubs across 35 institutions</li>
                <li>Sports, mobility programs and international exchanges</li>
                <li>Innovation hubs, hackathons and research initiatives</li>
              </ul>
              <a className="ucar-btn ucar-btn--primary" href="#institutions">
                Discover Campus Life
              </a>
            </div>
          </div>
        </section>

        {/* Institutions network */}
        <section className="ucar-section ucar-institutions" id="institutions">
          <div className="ucar-container">
            <header className="ucar-section__head">
              <span className="ucar-eyebrow ucar-eyebrow--dark">Network</span>
              <h2>Institutions of the University of Carthage</h2>
              <p>
                A diverse network of <strong>35 academic institutions</strong> dedicated to quality education,
                innovative research, and active community engagement.
              </p>
            </header>

            <div className="ucar-institutions__grid">
              {INSTITUTION_GROUPS.map((g) => (
                <div className="ucar-inst-col" key={g.letter}>
                  <div className="ucar-inst-col__letter">{g.letter}</div>
                  <ul>
                    {g.names.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="ucar-section ucar-newsletter" id="contact">
          <div className="ucar-container ucar-newsletter__inner">
            <div>
              <span className="ucar-eyebrow ucar-eyebrow--light">Stay informed</span>
              <h2>Subscribe Now</h2>
              <p>Don&rsquo;t miss our future updates! Get subscribed today.</p>
            </div>
            <form
              className="ucar-newsletter__form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input type="email" placeholder="Your email address" required />
              <button type="submit" className="ucar-btn ucar-btn--primary">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="ucar-footer">
        <div className="ucar-container ucar-footer__grid">
          <div>
            <div className="ucar-brand ucar-brand--footer">
              <img src="/assets/ucar-logo.png" alt="University of Carthage" />
              <div className="ucar-brand__text">
                <strong>University of Carthage</strong>
                <span>Université de Carthage</span>
              </div>
            </div>
            <p className="ucar-footer__about">
              Established in 1988, UCAR is a Tunisian public institution dedicated to education and research,
              operating under the supervision of the Ministry of Higher Education and Scientific Research.
            </p>
          </div>
          <div>
            <h4>Useful Links</h4>
            <ul className="ucar-footer__links">
              <li>
                <a href="#about">Alumni</a>
              </li>
              <li>
                <a href="#about">Pro emploi</a>
              </li>
              <li>
                <a href="#about">PMO</a>
              </li>
              <li>
                <a href="#about">Admission</a>
              </li>
              <li>
                <a href="#about">Projects</a>
              </li>
              <li>
                <a href="#about">Job alerts</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Platform</h4>
            <ul className="ucar-footer__links">
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <a href="#news">News &amp; Events</a>
              </li>
              <li>
                <a href="#institutions">Institutions</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <address className="ucar-footer__contact">
              Avenue de la République
              <br />
              BP 77 — 1054 Amilcar
              <br />
              Tunisia
            </address>
          </div>
        </div>
        <div className="ucar-footer__bottom">
          <span>©2026 University of Carthage. All Rights Reserved.</span>
          <span>AI · Data · Governance</span>
        </div>
      </footer>
    </div>
  );
}
