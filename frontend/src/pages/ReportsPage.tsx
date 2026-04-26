import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui/Button";
import { Field, SelectInput, TextInput } from "../components/ui/FormControls";
import { StatCard } from "../components/ui/StatCard";
import { fetchPeriods, fetchUcarDashboard, fetchUcarReport, type ReportingPeriod } from "../lib/api";
import type { Institution, UcarReportResponse, UcarReportRow } from "../types";

const CSV_COLUMNS: Array<{ key: keyof UcarReportRow; label: string }> = [
  { key: "institutionShortName", label: "Institution" },
  { key: "institutionName", label: "Institution name" },
  { key: "region", label: "Region" },
  { key: "periodLabel", label: "Period" },
  { key: "successRate", label: "Success rate" },
  { key: "attendanceRate", label: "Attendance rate" },
  { key: "repetitionRate", label: "Repetition rate" },
  { key: "dropoutRate", label: "Dropout rate" },
  { key: "employabilityRate", label: "Employability rate" },
  { key: "budgetAllocated", label: "Budget allocated" },
  { key: "budgetConsumed", label: "Budget consumed" },
  { key: "budgetUsage", label: "Budget usage" },
  { key: "costPerStudent", label: "Cost per student" },
  { key: "teachingHeadcount", label: "Teaching headcount" },
  { key: "adminHeadcount", label: "Admin headcount" },
  { key: "absenteeismRate", label: "Absenteeism rate" },
  { key: "publicationsCount", label: "Publications" },
  { key: "activeProjects", label: "Research projects" },
  { key: "fundingSecuredTnd", label: "Research funding" },
  { key: "classroomOccupancyPct", label: "Classroom occupancy" },
  { key: "equipmentAvailabilityPct", label: "Equipment availability" },
  { key: "activeAgreementsCount", label: "Active agreements" },
  { key: "studentMobilityIncoming", label: "Incoming mobility" },
  { key: "studentMobilityOutgoing", label: "Outgoing mobility" },
  { key: "energyConsumptionIndex", label: "Energy index" },
  { key: "carbonFootprintIndex", label: "Carbon index" },
  { key: "recyclingRate", label: "Recycling rate" },
  { key: "mobilityIndex", label: "Mobility index" },
  { key: "riskScore", label: "AI risk score" },
  { key: "riskLevel", label: "AI risk level" },
  { key: "riskSummary", label: "AI risk summary" },
];

type ReportSection = {
  id: string;
  title: string;
  description: string;
  columns: Array<{
    label: string;
    value: (row: UcarReportRow) => string | number;
  }>;
};

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`;
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(report: UcarReportResponse) {
  const lines = [
    CSV_COLUMNS.map((column) => csvEscape(column.label)).join(","),
    ...report.rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column.key])).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ucar-kpi-report-${report.filters.startPeriodId}-${report.filters.endPeriodId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const REPORT_SECTIONS: ReportSection[] = [
  {
    id: "academic",
    title: "Academic & Attendance",
    description: "Academic performance, attendance quality, repetition, and dropout indicators.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Success %", value: (row) => formatNumber(row.successRate) },
      { label: "Attendance %", value: (row) => formatNumber(row.attendanceRate) },
      { label: "Repetition %", value: (row) => formatNumber(row.repetitionRate) },
      { label: "Dropout %", value: (row) => formatNumber(row.dropoutRate) },
      { label: "Abandonment %", value: (row) => formatNumber(row.abandonmentRate) },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    description: "Allocated budget, consumed budget, execution rate, and cost per student.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Allocated", value: (row) => formatNumber(row.budgetAllocated) },
      { label: "Consumed", value: (row) => formatNumber(row.budgetConsumed) },
      { label: "Usage %", value: (row) => formatNumber(row.budgetUsage) },
      { label: "Cost / Student", value: (row) => formatNumber(row.costPerStudent) },
    ],
  },
  {
    id: "hr",
    title: "HR",
    description: "Teaching and administrative staffing with absenteeism pressure.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Teaching", value: (row) => formatNumber(row.teachingHeadcount) },
      { label: "Admin", value: (row) => formatNumber(row.adminHeadcount) },
      { label: "Absenteeism %", value: (row) => formatNumber(row.absenteeismRate) },
    ],
  },
  {
    id: "research",
    title: "Research",
    description: "Publications, active projects, and secured research funding.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Publications", value: (row) => formatNumber(row.publicationsCount) },
      { label: "Projects", value: (row) => formatNumber(row.activeProjects) },
      { label: "Funding (TND)", value: (row) => formatNumber(row.fundingSecuredTnd) },
    ],
  },
  {
    id: "infrastructure-esg",
    title: "Infrastructure & ESG",
    description: "Occupancy, equipment availability, energy, carbon, recycling, and mobility indicators.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Occupancy %", value: (row) => formatNumber(row.classroomOccupancyPct) },
      { label: "Equipment %", value: (row) => formatNumber(row.equipmentAvailabilityPct) },
      { label: "Energy", value: (row) => formatNumber(row.energyConsumptionIndex) },
      { label: "Carbon", value: (row) => formatNumber(row.carbonFootprintIndex) },
      { label: "Recycling %", value: (row) => formatNumber(row.recyclingRate) },
      { label: "Mobility", value: (row) => formatNumber(row.mobilityIndex) },
    ],
  },
  {
    id: "partnerships",
    title: "Partnerships & Mobility",
    description: "Agreements and student mobility signals across institutions.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Agreements", value: (row) => formatNumber(row.activeAgreementsCount) },
      { label: "Incoming", value: (row) => formatNumber(row.studentMobilityIncoming) },
      { label: "Outgoing", value: (row) => formatNumber(row.studentMobilityOutgoing) },
    ],
  },
  {
    id: "risk",
    title: "AI Risk Assessment",
    description: "Explainable institution risk scoring derived from the selected KPI range.",
    columns: [
      { label: "Institution", value: (row) => row.institutionShortName },
      { label: "Period", value: (row) => row.periodLabel },
      { label: "Risk Score", value: (row) => formatNumber(row.riskScore) },
      { label: "Risk Level", value: (row) => row.riskLevel ?? "-" },
      { label: "Risk Summary", value: (row) => row.riskSummary ?? "-" },
    ],
  },
];

function average(values: Array<number | null | undefined>) {
  const filtered = values.filter((value): value is number => value !== null && value !== undefined);
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function sectionHighlights(report: UcarReportResponse, sectionId: string) {
  const rows = report.rows;
  switch (sectionId) {
    case "academic":
      return {
        primary: `Avg success ${formatNumber(average(rows.map((row) => row.successRate)), "%")}`,
        secondary: `Avg attendance ${formatNumber(average(rows.map((row) => row.attendanceRate)), "%")}`,
      };
    case "finance":
      return {
        primary: `Total allocated ${formatNumber(report.summary.totalBudgetAllocated)} TND`,
        secondary: `Avg usage ${formatNumber(report.summary.budgetUsageAverage, "%")}`,
      };
    case "hr":
      return {
        primary: `Teaching headcount ${formatNumber(average(rows.map((row) => row.teachingHeadcount)))}`,
        secondary: `Avg absenteeism ${formatNumber(average(rows.map((row) => row.absenteeismRate)), "%")}`,
      };
    case "research":
      return {
        primary: `Avg publications ${formatNumber(average(rows.map((row) => row.publicationsCount)))}`,
        secondary: `Funding ${formatNumber(average(rows.map((row) => row.fundingSecuredTnd)))} TND avg`,
      };
    case "infrastructure-esg":
      return {
        primary: `Occupancy ${formatNumber(average(rows.map((row) => row.classroomOccupancyPct)), "%")}`,
        secondary: `Energy ${formatNumber(average(rows.map((row) => row.energyConsumptionIndex)))}`,
      };
    case "partnerships":
      return {
        primary: `Agreements ${formatNumber(average(rows.map((row) => row.activeAgreementsCount)))}`,
        secondary: `Mobility out ${formatNumber(average(rows.map((row) => row.studentMobilityOutgoing)))}`,
      };
    case "risk":
      return {
        primary: `High risk rows ${report.summary.highRiskCount}`,
        secondary: `Avg score ${formatNumber(average(rows.map((row) => row.riskScore)))}`,
      };
    default:
      return { primary: "-", secondary: "-" };
  }
}

function downloadPdf(report: UcarReportResponse, institutions: Institution[], periods: ReportingPeriod[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const startLabel = periods.find((period) => period.id === report.filters.startPeriodId)?.label ?? report.filters.startPeriodId;
  const endLabel = periods.find((period) => period.id === report.filters.endPeriodId)?.label ?? report.filters.endPeriodId;
  const selectedNames = institutions
    .filter((institution) => report.filters.institutionIds.includes(institution.id))
    .map((institution) => institution.shortName)
    .join(", ");

  doc.setFillColor(22, 58, 94);
  doc.rect(0, 0, 297, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("UCAR KPI Report", 14, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Period range: ${startLabel} to ${endLabel}`, 14, 25);
  doc.text(`Generated at: ${report.generatedAt.replace("T", " ").replace("Z", " UTC")}`, 14, 31);

  doc.setTextColor(20, 30, 43);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Selection", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(selectedNames || "All selected institutions", 265), 14, 57);

  autoTable(doc, {
    startY: 74,
    theme: "grid",
    head: [["Institutions", "Periods", "Rows", "Avg Success", "Avg Budget Usage", "High Risk"]],
    body: [[
      String(report.summary.institutionCount),
      String(report.summary.periodCount),
      String(report.summary.rowCount),
      formatNumber(report.summary.academicAverage, "%"),
      formatNumber(report.summary.budgetUsageAverage, "%"),
      String(report.summary.highRiskCount),
    ]],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [36, 81, 127] },
  });

  for (const section of REPORT_SECTIONS) {
    doc.addPage("a4", "landscape");
    doc.setTextColor(20, 30, 43);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(section.title, 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(99, 114, 130);
    doc.text(section.description, 14, 25);

    const highlights = sectionHighlights(report, section.id);
    doc.setTextColor(20, 30, 43);
    doc.setFontSize(10);
    doc.text(`Summary: ${highlights.primary} | ${highlights.secondary}`, 14, 33);

    autoTable(doc, {
      startY: 38,
      theme: "striped",
      head: [section.columns.map((column) => column.label)],
      body: report.rows.map((row) => section.columns.map((column) => String(column.value(row)))),
      styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
      headStyles: { fillColor: [36, 81, 127], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      margin: { left: 10, right: 10 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(99, 114, 130);
    doc.text(`Page ${page} / ${pageCount}`, 272, 205, { align: "right" });
  }

  doc.save(`ucar-kpi-report-${report.filters.startPeriodId}-${report.filters.endPeriodId}.pdf`);
}

export function ReportsPage({ title, description }: { title: string; description: string }) {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startPeriodId, setStartPeriodId] = useState("");
  const [endPeriodId, setEndPeriodId] = useState("");
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [report, setReport] = useState<UcarReportResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPeriods()
      .then((items) => {
        setPeriods(items);
        if (items.length) {
          setStartPeriodId(items[0].id);
          setEndPeriodId(items[items.length - 1].id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (user?.role !== "ucar_admin") return;
    fetchUcarDashboard()
      .then((dashboard) => {
        setInstitutions(dashboard.institutions);
        setSelectedIds(dashboard.institutions.map((institution) => institution.id));
      })
      .catch((err: Error) => setError(err.message));
  }, [user?.role]);

  const filteredInstitutions = useMemo(() => {
    const normalized = institutionQuery.trim().toLowerCase();
    if (!normalized) return institutions;
    return institutions.filter((institution) =>
      [institution.name, institution.shortName, institution.region]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [institutionQuery, institutions]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleInstitution = (institutionId: string) => {
    setSelectedIds((current) =>
      current.includes(institutionId)
        ? current.filter((id) => id !== institutionId)
        : [...current, institutionId],
    );
  };

  const generateReport = async () => {
    if (!startPeriodId || !endPeriodId || selectedIds.length === 0) return;
    setStatus("loading");
    setError(null);
    try {
      const nextReport = await fetchUcarReport({
        startPeriodId,
        endPeriodId,
        institutionIds: selectedIds,
      });
      setReport(nextReport);
      setStatus("ready");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  };

  if (user?.role !== "ucar_admin") {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Reporting</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </header>
        <div className="panel">
          <div className="panel__header">
            <h3>Institution report</h3>
            <span>Coming next</span>
          </div>
          <p className="body-copy">UCAR-wide report export is available for UCAR administrators first.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Reporting</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {report && (
          <div className="page__actions">
            <Button type="button" onClick={() => downloadPdf(report, institutions, periods)}>
              Export PDF
            </Button>
            <Button type="button" variant="secondary" onClick={() => downloadCsv(report)}>
              Export CSV
            </Button>
          </div>
        )}
      </header>

      <section className="panel">
        <div className="panel__header">
          <h3>Report selection</h3>
          <span>{selectedIds.length} institution{selectedIds.length === 1 ? "" : "s"} selected</span>
        </div>
        <div className="toolbar report-toolbar">
          <Field label="Start period">
            <SelectInput value={startPeriodId} onChange={(event) => setStartPeriodId(event.target.value)}>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.label}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="End period">
            <SelectInput value={endPeriodId} onChange={(event) => setEndPeriodId(event.target.value)}>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>{period.label}</option>
              ))}
            </SelectInput>
          </Field>
          <Button
            type="button"
            onClick={generateReport}
            disabled={!startPeriodId || !endPeriodId || selectedIds.length === 0 || status === "loading"}
          >
            {status === "loading" ? "Generating..." : "Generate Report"}
          </Button>
        </div>

        <div className="report-selector">
          <div className="report-selector__controls">
            <Field label="Filter institutions">
              <TextInput
                type="search"
                value={institutionQuery}
                onChange={(event) => setInstitutionQuery(event.target.value)}
                placeholder="Name, acronym, or region"
              />
            </Field>
            <div className="report-selector__actions">
              <Button type="button" variant="secondary" onClick={() => setSelectedIds(institutions.map((i) => i.id))}>
                Select All
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          </div>
          <div className="report-institution-grid">
            {filteredInstitutions.map((institution) => (
              <label key={institution.id} className="report-institution-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(institution.id)}
                  onChange={() => toggleInstitution(institution.id)}
                />
                <span>
                  <strong>{institution.shortName}</strong>
                  <small>{institution.name}</small>
                </span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="report-error">{error}</p>}
      </section>

      {report && (
        <>
          <div className="stats-grid stats-grid--four">
            <StatCard label="Rows" value={String(report.summary.rowCount)} helper="Institution-period records." accent="blue" />
            <StatCard label="Avg Success" value={formatNumber(report.summary.academicAverage, "%")} helper="Selected range." accent="green" />
            <StatCard label="Avg Budget Usage" value={formatNumber(report.summary.budgetUsageAverage, "%")} helper="Consumed vs allocated." accent="orange" />
            <StatCard label="High Risk Rows" value={String(report.summary.highRiskCount)} helper="AI risk model." accent="red" />
          </div>

          <section className="panel">
            <div className="panel__header">
              <h3>Report structure</h3>
              <span>Generated {report.generatedAt.replace("T", " ").replace("Z", "")}</span>
            </div>
            <div className="report-sections-grid">
              {REPORT_SECTIONS.map((section) => {
                const highlights = sectionHighlights(report, section.id);
                return (
                  <article key={section.id} className="report-section-card">
                    <div className="report-section-card__header">
                      <div>
                        <strong>{section.title}</strong>
                        <p>{section.description}</p>
                      </div>
                      <span className="report-section-card__page">1 PDF page</span>
                    </div>
                    <div className="report-section-card__highlights">
                      <span>{highlights.primary}</span>
                      <span>{highlights.secondary}</span>
                    </div>
                    <div className="responsive-table">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {section.columns.map((column) => (
                              <th key={column.label}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {report.rows.slice(0, 5).map((row) => (
                            <tr key={`${section.id}-${row.institutionId}-${row.periodId}`}>
                              {section.columns.map((column) => (
                                <td key={`${section.id}-${column.label}-${row.institutionId}-${row.periodId}`}>
                                  {column.value(row)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
