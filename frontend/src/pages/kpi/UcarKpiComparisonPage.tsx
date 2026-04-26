import { useEffect, useMemo, useState } from "react";

import { KpiBarChart, KpiRadarChart } from "../../components/charts/KpiCharts";
import { KpiPageLayout } from "../../components/layout/KpiPageLayout";
import { AnomalyTable } from "../../components/ui/AnomalyTable";
import { Field, SelectInput, TextInput } from "../../components/ui/FormControls";
import { usePeriod } from "../../period/PeriodContext";
import { fetchUcarDashboard } from "../../lib/api";
import type { Institution, UcarDashboardView } from "../../types";

type SortKey = "successRate" | "attendanceRate" | "employabilityRate" | "dropoutRate" | "budgetUsage";

export function UcarKpiComparisonPage() {
  const [dashboard, setDashboard] = useState<UcarDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | Institution["riskLevel"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("successRate");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const { periodId } = usePeriod();

  useEffect(() => {
    if (!periodId) return;
    let isActive = true;
    fetchUcarDashboard(periodId)
      .then((d) => isActive && (setDashboard(d), setError(null)))
      .catch((err: Error) => isActive && setError(err.message));
    return () => {
      isActive = false;
    };
  }, [periodId]);

  const institutions = useMemo(() => {
    if (!dashboard) return [];
    const normalized = query.trim().toLowerCase();
    const direction = sortDirection === "desc" ? -1 : 1;

    return dashboard.institutions
      .filter((institution) => {
        if (riskFilter !== "all" && institution.riskLevel !== riskFilter) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return [
          institution.name,
          institution.shortName,
          institution.region,
          institution.riskLevel,
        ].some((value) => value.toLowerCase().includes(normalized));
      })
      .sort((a, b) => (a[sortKey] - b[sortKey]) * direction);
  }, [dashboard, query, riskFilter, sortDirection, sortKey]);

  const scopedAlerts = useMemo(() => {
    if (!dashboard) return [];
    const ids = new Set(institutions.map((institution) => institution.id));
    return dashboard.criticalAlerts.filter((alert) => alert.institutionId && ids.has(alert.institutionId));
  }, [dashboard, institutions]);

  const average = (selector: (institution: Institution) => number) =>
    institutions.length
      ? Math.round(institutions.reduce((sum, institution) => sum + selector(institution), 0) / institutions.length)
      : 0;

  return (
    <KpiPageLayout
      eyebrow="Monitoring · Comparison"
      title="KPI Comparison Across Institutions"
      description="Side-by-side comparison of academic, employability, dropout, and budget indicators."
      loading={!dashboard}
      error={error}
    >
      {dashboard && (
        <>
          <section className="panel">
            <div className="panel__header">
              <h3>Comparison controls</h3>
              <span>{institutions.length} of {dashboard.institutions.length} institutions visible</span>
            </div>
            <div className="toolbar">
              <Field label="Search institutions">
                <TextInput
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, short name, region, or risk"
                />
              </Field>
              <Field label="Risk level">
                <SelectInput
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value as "all" | Institution["riskLevel"])}
                >
                  <option value="all">All risk levels</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </SelectInput>
              </Field>
              <Field label="Sort by">
                <SelectInput value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                  <option value="successRate">Success rate</option>
                  <option value="attendanceRate">Attendance rate</option>
                  <option value="employabilityRate">Employability</option>
                  <option value="dropoutRate">Dropout rate</option>
                  <option value="budgetUsage">Budget consumed</option>
                </SelectInput>
              </Field>
              <Field label="Direction">
                <SelectInput
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as "desc" | "asc")}
                >
                  <option value="desc">Highest first</option>
                  <option value="asc">Lowest first</option>
                </SelectInput>
              </Field>
            </div>
          </section>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Success rate</h3>
                <span>Higher is better</span>
              </div>
              <KpiBarChart
                color="#27ae60"
                data={institutions.map((i) => ({ name: i.shortName, value: i.successRate }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Attendance rate</h3>
                <span>Higher is better</span>
              </div>
              <KpiBarChart
                color="#1d5394"
                data={institutions.map((i) => ({ name: i.shortName, value: i.attendanceRate }))}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Employability</h3>
                <span>Insertion outcome</span>
              </div>
              <KpiBarChart
                color="#2f86c8"
                data={institutions.map((i) => ({ name: i.shortName, value: i.employabilityRate }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Dropout rate</h3>
                <span>Lower is better</span>
              </div>
              <KpiBarChart
                color="#e85d6c"
                data={institutions.map((i) => ({ name: i.shortName, value: i.dropoutRate }))}
              />
            </section>
          </div>

          <div className="panel-grid">
            <section className="panel">
              <div className="panel__header">
                <h3>Budget Consumed</h3>
                <span>Consumption %</span>
              </div>
              <KpiBarChart
                color="#f4b740"
                data={institutions.map((i) => ({ name: i.shortName, value: i.budgetUsage }))}
              />
            </section>
            <section className="panel">
              <div className="panel__header">
                <h3>Cross-KPI radar</h3>
                <span>UCAR averages</span>
              </div>
              <KpiRadarChart
                data={[
                  { name: "Success", value: average((i) => i.successRate) },
                  { name: "Budget", value: average((i) => i.budgetUsage) },
                  { name: "Employability", value: average((i) => i.employabilityRate) },
                  { name: "Attendance", value: average((i) => i.attendanceRate) },
                ]}
              />
            </section>
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Comparison table</h3>
              <span>Sorted by selected KPI</span>
            </div>
            <div className="responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Region</th>
                    <th>Risk</th>
                    <th>Success</th>
                    <th>Attendance</th>
                    <th>Employability</th>
                    <th>Dropout</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr key={institution.id}>
                      <td><strong>{institution.shortName}</strong> · {institution.name}</td>
                      <td>{institution.region}</td>
                      <td>
                        <span className={`risk-pill risk-pill--${institution.riskLevel.toLowerCase()}`}>
                          {institution.riskLevel}
                        </span>
                      </td>
                      <td>{institution.successRate}%</td>
                      <td>{institution.attendanceRate}%</td>
                      <td>{institution.employabilityRate}%</td>
                      <td>{institution.dropoutRate}%</td>
                      <td>{institution.budgetUsage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h3>Peer outliers detected by AI</h3>
              <span>Z-score anomaly detection across {institutions.length} visible institutions</span>
            </div>
            <AnomalyTable alerts={scopedAlerts} institutions={institutions} />
          </section>
        </>
      )}
    </KpiPageLayout>
  );
}
