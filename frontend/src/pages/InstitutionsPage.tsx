import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePeriod } from "../period/PeriodContext";
import { fetchUcarDashboard } from "../lib/api";
import type { Institution } from "../types";

export function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { periodId } = usePeriod();

  useEffect(() => {
    if (!periodId) return;
    let isActive = true;
    setLoading(true);
    setError(null);
    fetchUcarDashboard(periodId)
      .then((payload) => {
        if (isActive) {
          setInstitutions(payload.institutions);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isActive) {
          setInstitutions([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [periodId]);

  const filteredInstitutions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return institutions;
    }
    return institutions.filter((institution) =>
      [
        institution.name,
        institution.shortName,
        institution.region,
        institution.riskLevel,
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [institutions, query]);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">UCAR Admin</span>
          <h2>All Institutions</h2>
          <p>
            {error
              ?? (loading
                ? "Refreshing institution data for the selected reporting period."
                : "A focused view for leadership to scan institutional status without leaving the admin surface.")}
          </p>
        </div>
      </header>
      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel__header">
          <h3>Search institutions</h3>
          <span>
            {filteredInstitutions.length} of {institutions.length} visible
          </span>
        </div>
        <input
          className="institution-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, short name, region, or risk level"
          aria-label="Search institutions"
        />
      </section>
      <div className="table">
        <div className="table__row table__row--head">
          <span>Name</span>
          <span>Region</span>
          <span>Dropout</span>
          <span>Budget Consumed</span>
          <span>Risk</span>
        </div>
        {filteredInstitutions.map((institution) => (
          <Link
            className="table__row table__row--interactive"
            key={institution.id}
            to={`/admin/institutions/${institution.id}`}
          >
            <span>
              <strong>{institution.name}</strong>
              <small className="table__meta">{institution.shortName}</small>
            </span>
            <span>{institution.region}</span>
            <span>{institution.dropoutRate}%</span>
            <span>{institution.budgetUsage}%</span>
            <span className={`risk-pill risk-pill--${institution.riskLevel.toLowerCase()}`}>
              {institution.riskLevel}
            </span>
          </Link>
        ))}
        {!error && filteredInstitutions.length === 0 && (
          <div className="table__row">
            <span>No institutions match “{query}”.</span>
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </section>
  );
}
