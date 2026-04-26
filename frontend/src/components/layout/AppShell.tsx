import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { usePeriod } from "../../period/PeriodContext";
import { ChatWidget } from "../ChatWidget";
import { SelectInput } from "../ui/FormControls";

export type SidebarItem = {
  to?: string;
  label: string;
  icon: string;
  future?: boolean;
  children?: Array<{ to: string; label: string; icon: string }>;
};

type AppShellProps = {
  items: SidebarItem[];
};

function SidebarIcon({ kind }: { kind: string }) {
  switch (kind) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "institutions":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16" />
          <path d="M6 20V8l6-4 6 4v12" />
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
          <path d="M9 16h.01" />
          <path d="M15 16h.01" />
        </svg>
      );
    case "import":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v11" />
          <path d="m8 10 4 4 4-4" />
          <path d="M4 17v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
        </svg>
      );
    case "kpi":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19v-4" />
        </svg>
      );
    case "risk":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="m10.29 3.86-7.84 14A2 2 0 0 0 4.2 21h15.6a2 2 0 0 0 1.75-3.14l-7.84-14a2 2 0 0 0-3.42 0Z" />
        </svg>
      );
    case "reports":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v5h5" />
          <path d="M6 8V5a2 2 0 0 1 2-2h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3" />
          <path d="M9 15h6" />
          <path d="M9 11h3" />
        </svg>
      );
    case "record":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h10" />
          <path d="M8 12h10" />
          <path d="M8 18h10" />
          <path d="M4 6h.01" />
          <path d="M4 12h.01" />
          <path d="M4 18h.01" />
        </svg>
      );
    case "guidance":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        </svg>
      );
    case "academic":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5a6 4 0 0 0 12 0v-5" />
        </svg>
      );
    case "insertion":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m22 11-3 3-2-2" />
        </svg>
      );
    case "finance":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "hr":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "research":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case "infrastructure":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      );
    case "partnership":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="4" />
          <circle cx="17" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case "iso":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "monitoring":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 5-6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function NavItem({ item }: { item: SidebarItem }) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children!.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState<boolean>(Boolean(isChildActive));

  if (hasChildren) {
    return (
      <div className={`shell__group ${open ? "shell__group--open" : ""}`}>
        <button
          type="button"
          className={`shell__link shell__link--group ${isChildActive ? "shell__link--active" : ""}`}
          title={item.label}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="shell__icon" aria-hidden="true">
            <SidebarIcon kind={item.icon} />
          </span>
          <span className="shell__label">{item.label}</span>
          <span className={`shell__chevron ${open ? "shell__chevron--open" : ""}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        {open ? (
          <div className="shell__subnav">
            {item.children!.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  isActive ? "shell__link shell__link--sub shell__link--active" : "shell__link shell__link--sub"
                }
                title={child.label}
              >
                <span className="shell__icon" aria-hidden="true">
                  <SidebarIcon kind={child.icon} />
                </span>
                <span className="shell__label">{child.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
      className={({ isActive }) => (isActive ? "shell__link shell__link--active" : "shell__link")}
      title={item.label}
    >
      <span className="shell__icon" aria-hidden="true">
        <SidebarIcon kind={item.icon} />
      </span>
      <span className="shell__label">{item.label}</span>
      {item.future ? <em className="shell__badge">Soon</em> : null}
    </NavLink>
  );
}

export function AppShell({ items }: AppShellProps) {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="ucar-page auth-app">
      {/* Top utility bar (matches landing) */}
      <div className="ucar-topbar">
        <div className="ucar-topbar__inner">
          <span>Avenue de la République, BP 77 — 1054 Amilcar, Tunisia</span>
          <div className="ucar-topbar__links">
            <Link to="/">Public site</Link>
            <a href="https://ucar.rnu.tn" target="_blank" rel="noreferrer">
              ucar.rnu.tn
            </a>
            {user ? (
              <span>
                {user.name} · <em style={{ fontStyle: "normal", opacity: 0.8 }}>{user.role.replace("_", " ")}</em>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main header (matches landing) */}
      <header className="ucar-header">
        <div className="ucar-header__inner">
          <Link className="ucar-brand" to="/">
            <img src="/assets/ucar-logo.png" alt="University of Carthage" />
            <div className="ucar-brand__text">
              <strong>University of Carthage</strong>
              <span>Insight Platform</span>
            </div>
          </Link>
          <nav className="ucar-nav ucar-nav--auth">
            {user?.role === "institution_admin" && user.institutionName ? (
              <div className="ucar-nav__institution">
                {user.institutionLogoPath ? (
                  <img src={user.institutionLogoPath} alt={`${user.institutionName} logo`} />
                ) : null}
                <div>
                  <strong>{user.institutionShortName}</strong>
                  <span>{user.institutionName}</span>
                </div>
              </div>
            ) : null}
            <button className="ucar-nav__signout" onClick={logout} type="button">
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <div className={sidebarCollapsed ? "shell shell--collapsed" : "shell"}>
        <aside className="shell__sidebar">
          <button
            type="button"
            className="shell__toggle"
            onClick={() => setSidebarCollapsed((value) => !value)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            <span aria-hidden="true">{sidebarCollapsed ? ">" : "<"}</span>
          </button>
          <nav className="shell__nav">
            {items.map((item) => (
              <NavItem key={item.to ?? item.label} item={item} />
            ))}
          </nav>

          <div className="shell__account">
            <div className="shell__account-copy">
              <div className="shell__account-name">{user?.name}</div>
              <div className="shell__account-role">{user?.role.replace("_", " ")}</div>
            </div>
          </div>
        </aside>

        <main className="shell__content">
          <Outlet />
        </main>
      </div>

      {/* Full UCAR-style footer (matches landing) */}
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
              <li><a href="https://ucar.rnu.tn/alumni/" target="_blank" rel="noreferrer">Alumni</a></li>
              <li><a href="https://proemploi.ucar.rnu.tn" target="_blank" rel="noreferrer">Pro emploi</a></li>
              <li><a href="https://pmo.ucar.rnu.tn/" target="_blank" rel="noreferrer">PMO</a></li>
              <li><a href="http://www.concours.ucar.rnu.tn" target="_blank" rel="noreferrer">Admission</a></li>
              <li><a href="https://ucar.rnu.tn/projects/" target="_blank" rel="noreferrer">Projects</a></li>
            </ul>
          </div>
          <div>
            <h4>Platform</h4>
            <ul className="ucar-footer__links">
              <li><Link to="/">Public site</Link></li>
              <li><Link to="/app">Dashboard</Link></li>
              <li><button className="ucar-footer__btn" onClick={logout} type="button">Sign out</button></li>
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

      <ChatWidget />
    </div>
  );
}

export function PeriodSelector() {
  const { periods, periodId, setPeriodId, loading } = usePeriod();
  if (loading || periods.length === 0) return null;
  return (
    <div className="period-selector">
      <span>Period</span>
      <SelectInput
        value={periodId}
        onChange={(e) => setPeriodId(e.target.value)}
      >
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}
