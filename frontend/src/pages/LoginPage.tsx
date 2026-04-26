import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/FormControls";
import { getHomePath } from "../routes/guards";

const demoPassword = "123456";

export function LoginPage() {
  const { user, login, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@ucar.tn");
  const [password, setPassword] = useState(demoPassword);

  useEffect(() => {
    if (!user) {
      return;
    }
    navigate(getHomePath(user.role), { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const loggedInUser = await login(email, password);
      navigate(getHomePath(loggedInUser.role), { replace: true });
    } catch {
      // error is rendered through authError
    }
  }

  return (
    <div className="ucar-page">
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
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <span className="ucar-eyebrow">University of Carthage</span>
            <h1>Sign in to UCAR Insight.</h1>
            <p>Use one of the seeded UCAR accounts to enter the workspace.</p>
          </div>

          <div className="landing-preview__panel login-panel">
            <h2>Enter your credentials</h2>

            {authError ? <p className="login-card__hint">{authError}</p> : null}

            <form className="login-form" onSubmit={handleSubmit}>
              <Field label="Email">
                <TextInput
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="owner@ucar.tn"
                  required
                />
              </Field>
              <Field label="Password">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="123456"
                  required
                />
              </Field>
              <Button type="submit" disabled={isAuthenticating}>
                {isAuthenticating ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </section>
      </main>

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
