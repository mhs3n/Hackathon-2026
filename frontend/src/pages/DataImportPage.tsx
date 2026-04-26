import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";

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
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptedExt = [".xlsx", ".xls", ".csv", ".pdf", ".png", ".jpg", ".jpeg"];

  const isAcceptedFile = (f: File) => {
    const lower = f.name.toLowerCase();
    return acceptedExt.some((ext) => lower.endsWith(ext));
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (!isAcceptedFile(f)) {
      setError(`Unsupported file type. Accepted: ${acceptedExt.join(", ")}`);
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("idle");
    setFile(f);
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // only clear when leaving the dropzone itself
    if ((e.target as HTMLElement) === e.currentTarget) setIsDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0] ?? null;
    onPickFile(dropped);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileExtIcon = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".csv")) return "CSV";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "XLS";
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "IMG";
    return "FILE";
  };

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
          <span>Supported: .xlsx, .xls, .csv, .pdf, .png, .jpg</span>
        </div>

        <div style={topGridStyle}>
          <Field label="Institution">
            {user?.role === "ucar_admin" ? (
              <SelectInput value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
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
            <SelectInput value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Drop a file here or click to browse"
          style={{
            ...dropzoneStyle,
            ...(isDragging ? dropzoneActiveStyle : null),
            ...(file ? dropzoneFilledStyle : null),
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />

          {!file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={dropIconWrap}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" />
                  <path d="m7 8 5-5 5 5" />
                  <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#13263b" }}>
                {isDragging ? "Drop the file to upload" : "Drag & drop your file here"}
              </div>
              <div style={{ fontSize: 13, color: "#5b6878" }}>
                or <span style={{ color: "#1d63d1", fontWeight: 600 }}>click to browse</span> from your computer
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 4 }}>
                {acceptedExt.map((ext) => (
                  <span key={ext} style={extChip}>{ext}</span>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={fileBadge}>{fileExtIcon(file.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#13263b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: "#5b6878", marginTop: 2 }}>
                  {formatBytes(file.size)} · {file.type || "unknown"}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                style={removeBtn}
                aria-label="Remove file"
                title="Remove file"
              >
                ×
              </button>
              <Button
                onClick={(e) => {
                  e?.stopPropagation();
                  fileRef.current?.click();
                }}
                variant="secondary"
              >
                Replace
              </Button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12.5, color: "#5b6878" }}>
            {file
              ? "Ready to extract. The AI pipeline will map your columns to KPI fields."
              : "Tip: French headers, mixed cases, and scanned PDFs are all supported."}
          </div>
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

const domainCardStyle: CSSProperties = {
  background: "#fcfdfe",
  border: "1px solid #e3eaf3",
  borderRadius: 10,
  padding: 14,
};

const domainTitle: CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
  color: "#13263b",
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: "1px solid #eef2f7",
};

const topGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const dropzoneStyle: CSSProperties = {
  border: "2px dashed #c9d4e3",
  borderRadius: 14,
  background: "linear-gradient(180deg, #fbfdff 0%, #f5f8fc 100%)",
  padding: "28px 22px",
  minHeight: 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
  outline: "none",
};

const dropzoneActiveStyle: CSSProperties = {
  borderColor: "#1d63d1",
  background: "linear-gradient(180deg, #eef5ff 0%, #e2ecff 100%)",
  boxShadow: "0 0 0 4px rgba(29, 99, 209, 0.12)",
};

const dropzoneFilledStyle: CSSProperties = {
  borderStyle: "solid",
  borderColor: "#cfdcec",
  background: "#ffffff",
  cursor: "default",
  padding: "18px 18px",
  minHeight: 0,
};

const dropIconWrap: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "rgba(29, 99, 209, 0.1)",
  color: "#1d63d1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const extChip: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.3,
  padding: "3px 8px",
  borderRadius: 999,
  background: "#eef2f8",
  color: "#3d4f63",
  textTransform: "uppercase",
};

const fileBadge: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 10,
  background: "#1d63d1",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.5,
  flexShrink: 0,
};

const removeBtn: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid #e3eaf3",
  background: "#fff",
  color: "#5b6878",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  flexShrink: 0,
};
