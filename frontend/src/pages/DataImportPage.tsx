import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Field, SelectInput, TextInput } from "../components/ui/FormControls";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBanner } from "../components/ui/StatusBanner";
import {
  commitImport,
  fetchImportHistory,
  fetchPeriods,
  fetchUcarDashboard,
  previewImport,
  type ImportBatch,
  type IngestionPreview,
  type ReportingPeriod,
} from "../lib/api";
import type { Institution } from "../types";

const KPI_DOMAIN_LABEL: Record<string, string> = {
  academic: "Academic KPIs",
  finance: "Finance KPIs",
  esg: "ESG / Energy & Carbon",
  hr: "Human Resources",
  research: "Research & Innovation",
  infrastructure: "Infrastructure",
  partnership: "Partnerships & Mobility",
  insertion: "Graduate Insertion",
};

const DOMAIN_ORDER = [
  "academic",
  "finance",
  "esg",
  "hr",
  "research",
  "infrastructure",
  "partnership",
  "insertion",
] as const;

const FIELD_LABEL: Record<string, string> = {
  // academic
  success_rate: "Success rate (%)",
  attendance_rate: "Attendance rate (%)",
  dropout_rate: "Dropout rate (%)",
  abandonment_rate: "Abandonment rate (%)",
  repetition_rate: "Repetition rate (%)",
  // finance
  budget_allocated: "Budget allocated (TND)",
  budget_consumed: "Budget consumed (TND)",
  cost_per_student: "Cost per student (TND)",
  // esg
  energy_consumption_index: "Energy consumption index",
  carbon_footprint_index: "Carbon footprint index",
  recycling_rate: "Recycling rate (%)",
  mobility_index: "Mobility index",
  // hr
  teaching_headcount: "Teaching headcount",
  admin_headcount: "Admin headcount",
  absenteeism_rate: "Absenteeism rate (%)",
  training_completed_pct: "Training completed (%)",
  teaching_load_hours: "Teaching load (hours)",
  team_stability_index: "Team stability index",
  // research
  publications_count: "Publications",
  active_projects: "Active projects",
  funding_secured_tnd: "Funding secured (TND)",
  academic_partnerships: "Academic partnerships",
  patents_filed: "Patents filed",
  // infrastructure
  classroom_occupancy_pct: "Classroom occupancy (%)",
  equipment_availability_pct: "Equipment availability (%)",
  it_equipment_status: "IT equipment status",
  ongoing_projects_count: "Ongoing projects",
  maintenance_backlog_days: "Maintenance backlog (days)",
  // partnership
  active_agreements_count: "Active agreements",
  student_mobility_incoming: "Mobility — incoming",
  student_mobility_outgoing: "Mobility — outgoing",
  international_projects: "International projects",
  academic_networks_count: "Academic networks",
  // insertion
  national_convention_rate: "National conventions (%)",
  international_convention_rate: "International conventions (%)",
  employability_rate: "Employability rate (%)",
  insertion_delay_months: "Insertion delay (months)",
};

type HistorySortKey = "importedAt" | "institution" | "period" | "sourceFile" | "fileType";

export function DataImportPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<IngestionPreview | null>(null);
  const [editedMapped, setEditedMapped] = useState<IngestionPreview["mapped"] | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready" | "committing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [committedFor, setCommittedFor] = useState<{ name: string; period: string; at: string } | null>(null);
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historySortKey, setHistorySortKey] = useState<HistorySortKey>("importedAt");
  const [historySortDirection, setHistorySortDirection] = useState<"desc" | "asc">("desc");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load institution list (only UCAR admin sees the dropdown)
  useEffect(() => {
    if (user?.role === "ucar_admin") {
      fetchUcarDashboard()
        .then((d) => {
          setInstitutions(d.institutions);
          if (d.institutions.length && !institutionId) setInstitutionId(d.institutions[0].id);
        })
        .catch(() => setInstitutions([]));
    } else if (user?.role === "institution_admin" && user.institutionId) {
      setInstitutionId(user.institutionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load reporting periods (default to most recent)
  useEffect(() => {
    fetchPeriods()
      .then((p) => {
        setPeriods(p);
        if (p.length) setPeriodId(p[p.length - 1].id);
      })
      .catch(() => setPeriods([]));
  }, []);

  const refreshHistory = () => {
    fetchImportHistory(user?.role === "ucar_admin" ? institutionId : undefined)
      .then(setHistory)
      .catch(() => setHistory([]));
  };

  // Refresh history when institution changes
  useEffect(() => {
    if (institutionId) refreshHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId]);

  const onUpload = async () => {
    if (!file || !institutionId) return;
    setStatus("uploading");
    setError(null);
    setPreview(null);
    setCommittedFor(null);
    try {
      const result = await previewImport(institutionId, file);
      setPreview(result);
      setEditedMapped(structuredClone(result.mapped));
      setStatus("ready");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const onCommit = async () => {
    if (!preview || !editedMapped || !periodId) return;
    setStatus("committing");
    setError(null);
    try {
      const result = await commitImport(preview.institutionId, periodId, editedMapped, {
        rawKpis: preview.rawKpis,
        sourceFile: preview.sourceFile,
        fileType: preview.fileType,
      });
      const periodLabel = periods.find((p) => p.id === periodId)?.label ?? periodId;
      setCommittedFor({ name: preview.institutionName, period: periodLabel, at: result.importedAt });
      setStatus("done");
      refreshHistory();
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setEditedMapped(null);
    setStatus("idle");
    setError(null);
    setCommittedFor(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateField = (domain: string, field: string, value: string) => {
    if (!editedMapped) return;
    const num = Number.parseFloat(value);
    setEditedMapped({
      ...editedMapped,
      [domain]: {
        ...((editedMapped as Record<string, Record<string, number>>)[domain] ?? {}),
        [field]: Number.isNaN(num) ? 0 : num,
      },
    });
  };

  const totalFields = useMemo(() => {
    if (!editedMapped) return 0;
    return Object.values(editedMapped).reduce(
      (n, dom) => n + (dom ? Object.keys(dom).length : 0),
      0,
    );
  }, [editedMapped]);

  const filteredHistory = useMemo(() => {
    const normalized = historyQuery.trim().toLowerCase();
    const sortable = history.map((batch) => {
      const periodLabel = periods.find((p) => p.id === batch.reportingPeriodId)?.label ?? batch.reportingPeriodId;
      const institutionLabel =
        institutions.find((i) => i.id === batch.institutionId)?.shortName ?? batch.institutionId;
      const domainCounts = Object.entries(batch.domainsWritten)
        .filter(([, fields]) => fields.length > 0)
        .map(([key, fields]) => `${key} (${fields.length})`)
        .join(", ");

      return { batch, periodLabel, institutionLabel, domainCounts };
    });

    return sortable
      .filter((row) => {
        if (!normalized) {
          return true;
        }
        return [
          row.institutionLabel,
          row.periodLabel,
          row.batch.sourceFile,
          row.batch.fileType,
          row.domainCounts,
          row.batch.userId ?? "",
        ].some((value) => value.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        const direction = historySortDirection === "desc" ? -1 : 1;
        const left = historySortKey === "institution"
          ? a.institutionLabel
          : historySortKey === "period"
            ? a.periodLabel
            : a.batch[historySortKey];
        const right = historySortKey === "institution"
          ? b.institutionLabel
          : historySortKey === "period"
            ? b.periodLabel
            : b.batch[historySortKey];
        return String(left).localeCompare(String(right)) * direction;
      });
  }, [history, historyQuery, historySortDirection, historySortKey, institutions, periods]);

  const sortHistory = (key: HistorySortKey) => {
    if (historySortKey === key) {
      setHistorySortDirection((direction) => (direction === "desc" ? "asc" : "desc"));
      return;
    }
    setHistorySortKey(key);
    setHistorySortDirection(key === "importedAt" ? "desc" : "asc");
  };

  const sortLabel = (key: HistorySortKey, label: string) => (
    <button type="button" className="data-table__sort" onClick={() => sortHistory(key)}>
      {label}{historySortKey === key ? ` ${historySortDirection === "desc" ? "down" : "up"}` : ""}
    </button>
  );

  return (
    <section className="page">
      <PageHeader
        eyebrow="Data Import"
        title="Import institutional KPIs"
        description="Drop an Excel, CSV or PDF report and the AI pipeline will extract KPIs automatically. You can review and edit the values before saving them to the current reporting period."
      />

      <section className="panel">
        <div className="panel__header">
          <h3>1. Select institution and file</h3>
          <span>Supported: .xlsx, .xls, .csv, .pdf</span>
        </div>
        <div className="form-grid">
          <Field label="Institution">
            {user?.role === "ucar_admin" ? (
              <SelectInput
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName} - {i.name}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <TextInput value={user?.institutionShortName ?? institutionId} disabled />
            )}
          </Field>
          <Field label="Reporting period">
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
          </Field>
          <Field label="File">
            <TextInput
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Button
            onClick={onUpload}
            disabled={!file || !institutionId || status === "uploading"}
          >
            {status === "uploading" ? "Extracting..." : "Extract KPIs"}
          </Button>
        </div>
        {error && (
          <div style={{ marginTop: 12 }}>
            <StatusBanner tone="danger" title="Import error">{error}</StatusBanner>
          </div>
        )}
      </section>

      {preview && editedMapped && (
        <>
          <section className="panel" style={{ marginBottom: 16 }}>
            <div className="panel__header">
              <h3>2. Review & edit extracted KPIs</h3>
              <span>
                {totalFields} value{totalFields === 1 ? "" : "s"} from{" "}
                <code style={{ background: "#f7f9fc", padding: "1px 6px", borderRadius: 4 }}>{preview.sourceFile}</code>{" "}
                · file type: <strong>{preview.fileType}</strong>
              </span>
            </div>

            {preview.warnings.length > 0 && (
              <StatusBanner tone="warning" title="Warnings">
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </StatusBanner>
            )}

            {preview.alerts.length > 0 && (
              <StatusBanner tone="danger" title="Threshold alerts detected">
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {preview.alerts.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </StatusBanner>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {(() => {
                const allDomains = Array.from(
                  new Set([
                    ...DOMAIN_ORDER,
                    ...Object.keys(editedMapped as Record<string, unknown>),
                  ]),
                );
                const visible = allDomains.filter((dom) => {
                  const fields = (editedMapped as Record<string, Record<string, number>>)[dom];
                  return fields && Object.keys(fields).length > 0;
                });
                if (visible.length === 0) {
                  return (
                    <div style={domainCardStyle}>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>
                        No KPIs extracted from this document.
                      </div>
                    </div>
                  );
                }
                return visible.map((domain) => {
                  const fields =
                    (editedMapped as Record<string, Record<string, number>>)[domain] ?? {};
                  const entries = Object.entries(fields);
                  return (
                    <div key={domain} style={domainCardStyle}>
                      <div style={domainTitle}>
                        {KPI_DOMAIN_LABEL[domain] ?? domain}
                      </div>
                      {entries.map(([field, value]) => (
                        <div
                          key={field}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 110px",
                            gap: 8,
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <label style={{ fontSize: 12.5, color: "#3d4f63" }}>
                            {FIELD_LABEL[field] ?? field}
                          </label>
                          <input
                            className="form-input form-input--number"
                            type="number"
                            step="any"
                            value={value}
                            onChange={(e) => updateField(domain, field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <Button onClick={reset} variant="secondary">Cancel</Button>
              <Button
                onClick={onCommit}
                disabled={status === "committing"}
              >
                {status === "committing" ? "Saving..." : `Save to ${preview.institutionName}`}
              </Button>
            </div>
          </section>

          <details style={{ background: "white", border: "1px solid #e3eaf3", borderRadius: 12, padding: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, color: "#13263b" }}>
              Show raw extracted values (French source keys)
            </summary>
            <pre style={{ background: "#f7f9fc", padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10, overflowX: "auto" }}>
{JSON.stringify(preview.rawKpis, null, 2)}
            </pre>
          </details>
        </>
      )}

      {status === "done" && committedFor && (
        <StatusBanner
          tone="success"
          title="KPIs saved"
          actions={<Button onClick={reset} variant="secondary">Import another file</Button>}
        >
            <strong>{committedFor.name}</strong> KPIs saved for <strong>{committedFor.period}</strong>{" "}
            at <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 4 }}>{committedFor.at}</code>.
            Dashboards refreshed.
        </StatusBanner>
      )}

      {history.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h3>Import audit log</h3>
            <span>{filteredHistory.length} of {history.length} batch{history.length === 1 ? "" : "es"}</span>
          </div>
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <Field label="Search imports">
              <TextInput
                type="search"
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Institution, file, period, type, or user"
              />
            </Field>
            <Field label="Sort by">
              <SelectInput
                value={historySortKey}
                onChange={(event) => setHistorySortKey(event.target.value as HistorySortKey)}
              >
                <option value="importedAt">Import time</option>
                <option value="institution">Institution</option>
                <option value="period">Period</option>
                <option value="sourceFile">Source file</option>
                <option value="fileType">File type</option>
              </SelectInput>
            </Field>
            <Field label="Direction">
              <SelectInput
                value={historySortDirection}
                onChange={(event) => setHistorySortDirection(event.target.value as "desc" | "asc")}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </SelectInput>
            </Field>
          </div>
          <div className="responsive-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{sortLabel("importedAt", "When")}</th>
                  <th>{sortLabel("institution", "Institution")}</th>
                  <th>{sortLabel("period", "Period")}</th>
                  <th>{sortLabel("sourceFile", "Source file")}</th>
                  <th>{sortLabel("fileType", "Type")}</th>
                  <th>Domains written</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(({ batch, periodLabel, institutionLabel, domainCounts }) => (
                  <tr key={batch.id}>
                    <td>{batch.importedAt.replace("T", " ").replace("Z", "")}</td>
                    <td><strong>{institutionLabel}</strong></td>
                    <td>{periodLabel}</td>
                    <td><code style={{ fontSize: 11 }}>{batch.sourceFile}</code></td>
                    <td>{batch.fileType}</td>
                    <td>{domainCounts || "-"}</td>
                    <td>{batch.userId ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}

const domainCardStyle: React.CSSProperties = {
  background: "#fcfdfe",
  border: "1px solid #e3eaf3",
  borderRadius: 10,
  padding: 14,
};

const domainTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  color: "#13263b",
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: "1px solid #eef2f7",
};
