import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { roleLabels } from "../data/mockData";
import { getHomePath } from "../routes/guards";
import type { UserRole } from "../types";

const roleOptions: UserRole[] = ["ucar_admin", "institution_admin", "student"];

export function LoginPage() {
  const { user, login, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => {
    if (location.state && typeof location.state === "object" && "from" in location.state) {
      const candidate = location.state.from;
      if (typeof candidate === "string") {
        return candidate;
      }
    }
    return null;
  }, [location.state]);

  useEffect(() => {
    if (!user) {
      return;
    }
    navigate(getHomePath(user.role), { replace: true });
  }, [navigate, user]);

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
            <Link to="/">Back to landing</Link>
          </nav>
        </div>
      </header>

      <main className="login-page login-page--light">
        <div className="login-page__hero login-page__hero--light">
          <div className="login-hero__brand">
            <img className="login-hero__logo" src="/assets/ucar-logo.png" alt="University of Carthage logo" />
            <div>
              <span className="shell__eyebrow">University of Carthage</span>
              <div className="login-hero__subbrand">Platform Access</div>
            </div>
          </div>
          <h1>Login to the prototype workspace.</h1>
          <p>
            This page is intentionally separate from the public landing page. Choose a demo role to inspect
            the UCAR admin, institution admin, or student experience.
          </p>
          <div className="login-page__points">
            <span>White-first product surfaces</span>
            <span>UCAR branding with blue accents</span>
            <span>Role-based workspaces</span>
          </div>
        </div>

        <div className="login-card login-card--light">
          <div>
            <span className="shell__eyebrow">Demo Access</span>
            <h2>Login by role</h2>
            <p>Select the role path you want to test in the curated shell.</p>
            {from ? <p className="login-card__hint">You were redirected from: {from}</p> : null}
            {authError ? <p className="login-card__hint">{authError}</p> : null}
          </div>

          <div className="login-card__actions">
            {roleOptions.map((role) => (
              <button
                key={role}
                type="button"
                className="role-button role-button--light"
                onClick={async () => {
                  try {
                    await login(role);
                    navigate(getHomePath(role), { replace: true });
                  } catch {
                    // error is rendered through authError
                  }
                }}
                disabled={isAuthenticating}
              >
                <strong>{roleLabels[role]}</strong>
                <span>
                  {role === "ucar_admin"
                    ? "Global oversight across all institutions"
                    : role === "institution_admin"
                      ? "Local KPIs, risk list, and reporting"
                      : "Grades, attendance, and AI recommendations"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <strong>University of Carthage</strong>
            <p>Dedicated login flow for the prototype role-based dashboards.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
