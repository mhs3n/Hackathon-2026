import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../auth/AuthContext";
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
};

const FIELD_LABEL: Record<string, string> = {
  success_rate: "Success rate (%)",
  attendance_rate: "Attendance rate (%)",
  dropout_rate: "Dropout rate (%)",
  abandonment_rate: "Abandonment rate (%)",
  repetition_rate: "Repetition rate (%)",
  budget_allocated: "Budget allocated (TND)",
  budget_consumed: "Budget consumed (TND)",
  cost_per_student: "Cost per student (TND)",
  energy_consumption_index: "Energy consumption index",
  carbon_footprint_index: "Carbon footprint index",
};

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

  return (
    <section className="page">
      <div className="page__header">
        <h1>Import institutional KPIs</h1>
        <p className="page__subtitle">
          Drop an Excel, CSV or PDF report and the AI pipeline will extract KPIs automatically. You
          can review and edit the values before saving them to the current reporting period.
        </p>
      </div>

      <section className="panel" style={{ marginBottom: 16 }}>
        <div className="panel__header">
          <h3>1. Select institution and file</h3>
          <span>Supported: .xlsx, .xls, .csv, .pdf</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.4fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              Institution
            </label>
            {user?.role === "ucar_admin" ? (
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                style={selectStyle}
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName} — {i.name}
                  </option>
                ))}
              </select>
            ) : (
              <input value={user?.institutionShortName ?? institutionId} disabled style={selectStyle} />
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              Reporting period
            </label>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              style={selectStyle}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              File
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={selectStyle}
            />
          </div>
          <button
            onClick={onUpload}
            disabled={!file || !institutionId || status === "uploading"}
            style={{
              ...primaryButton,
              opacity: !file || !institutionId || status === "uploading" ? 0.5 : 1,
            }}
          >
            {status === "uploading" ? "Extracting…" : "Extract KPIs"}
          </button>
        </div>
        {error && (
          <p style={{ color: "#e85d6c", marginTop: 12, fontSize: 13 }}>Error: {error}</p>
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
              <div style={{ background: "#fdf5e3", border: "1px solid #f4d27e", color: "#7a5800", padding: "10px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                <strong>Warnings:</strong>
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {preview.alerts.length > 0 && (
              <div style={{ background: "#fdecee", border: "1px solid #f0a4ad", color: "#9a2230", padding: "10px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                <strong>Threshold alerts detected:</strong>
                <ul style={{ margin: "6px 0 0 18px" }}>
                  {preview.alerts.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {(["academic", "finance", "esg"] as const).map((domain) => {
                const fields = editedMapped[domain] ?? {};
                const entries = Object.entries(fields);
                if (entries.length === 0) {
                  return (
                    <div key={domain} style={domainCardStyle}>
                      <div style={domainTitle}>{KPI_DOMAIN_LABEL[domain]}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12.5 }}>No values extracted.</div>
                    </div>
                  );
                }
                return (
                  <div key={domain} style={domainCardStyle}>
                    <div style={domainTitle}>{KPI_DOMAIN_LABEL[domain]}</div>
                    {entries.map(([field, value]) => (
                      <div key={field} style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <label style={{ fontSize: 12.5, color: "#3d4f63" }}>{FIELD_LABEL[field] ?? field}</label>
                        <input
                          type="number"
                          step="any"
                          value={value}
                          onChange={(e) => updateField(domain, field, e.target.value)}
                          style={numberInputStyle}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button onClick={reset} style={secondaryButton}>Cancel</button>
              <button
                onClick={onCommit}
                disabled={status === "committing"}
                style={{ ...primaryButton, opacity: status === "committing" ? 0.5 : 1 }}
              >
                {status === "committing" ? "Saving…" : `Save to ${preview.institutionName}`}
              </button>
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
        <section className="panel" style={{ background: "#e8f5ec", border: "1px solid #9ed4ad", marginBottom: 16 }}>
          <div style={{ color: "#1a6b3a", fontSize: 14 }}>
            ✅ <strong>{committedFor.name}</strong> KPIs saved for <strong>{committedFor.period}</strong>{" "}
            at <code style={{ background: "#fff", padding: "1px 6px", borderRadius: 4 }}>{committedFor.at}</code>.
            Dashboards refreshed.
          </div>
          <button onClick={reset} style={{ ...secondaryButton, marginTop: 10 }}>Import another file</button>
        </section>
      )}

      {history.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h3>Import audit log</h3>
            <span>{history.length} most recent batch{history.length === 1 ? "" : "es"}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#f7f9fc", color: "#3d4f63" }}>
                <th style={cellHead}>When</th>
                <th style={cellHead}>Institution</th>
                <th style={cellHead}>Period</th>
                <th style={cellHead}>Source file</th>
                <th style={cellHead}>Type</th>
                <th style={cellHead}>Domains written</th>
                <th style={cellHead}>By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((b) => {
                const periodLabel = periods.find((p) => p.id === b.reportingPeriodId)?.label ?? b.reportingPeriodId;
                const instLabel =
                  institutions.find((i) => i.id === b.institutionId)?.shortName ?? b.institutionId;
                const domainCounts = Object.entries(b.domainsWritten)
                  .filter(([, fields]) => fields.length > 0)
                  .map(([k, fields]) => `${k} (${fields.length})`)
                  .join(", ");
                return (
                  <tr key={b.id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={cell}>{b.importedAt.replace("T", " ").replace("Z", "")}</td>
                    <td style={cell}><strong>{instLabel}</strong></td>
                    <td style={cell}>{periodLabel}</td>
                    <td style={cell}><code style={{ fontSize: 11 }}>{b.sourceFile}</code></td>
                    <td style={cell}>{b.fileType}</td>
                    <td style={{ ...cell, color: "#3d4f63" }}>{domainCounts || "—"}</td>
                    <td style={cell}>{b.userId ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}

const cellHead: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 };
const cell: React.CSSProperties = { padding: "9px 10px", verticalAlign: "top" };

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #e3eaf3",
  borderRadius: 8,
  fontSize: 13.5,
  background: "white",
};

const numberInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #e3eaf3",
  borderRadius: 6,
  fontSize: 13,
  textAlign: "right",
};

const primaryButton: React.CSSProperties = {
  background: "#1d5394",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "white",
  color: "#3d4f63",
  border: "1px solid #e3eaf3",
  borderRadius: 8,
  padding: "10px 16px",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
};

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
