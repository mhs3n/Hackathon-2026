import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import { usePeriod } from "../period/PeriodContext";
import { useInstitutionDashboard } from "../lib/useInstitutionDashboard";
import {
  STUDENT_LEVELS,
  deriveInstitutionStudents,
  isStudentsPanelEnabled,
  type MockStudent,
} from "../lib/institutionStudentsMock";
import type { InstitutionDashboardView } from "../types";

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function n(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${Number.isInteger(value) ? value : value.toFixed(2)}${suffix}`;
}

type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } };

function downloadInstitutionReportPdf(
  dashboard: InstitutionDashboardView,
  periodLabel: string,
  atRisk: MockStudent[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as AutoTableDoc;
  const pageWidth = 210;
  const marginX = 16;
  const today = formatToday();
  const inst = dashboard.institution;

  // Header band
  doc.setFillColor(22, 58, 94);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Institution Report", marginX, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${inst.shortName} - ${inst.name}`, marginX, 23);
  doc.setFontSize(9);
  doc.text(`Period: ${periodLabel}`, marginX, 28);
  doc.text(`Generated on ${today}`, pageWidth - marginX, 28, { align: "right" });

  // Identity block
  doc.setTextColor(19, 38, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(96, 117, 138);
  doc.text(
    `Region: ${inst.region}    University of Carthage`,
    marginX,
    42,
  );

  // Headline KPIs
  autoTable(doc, {
    startY: 50,
    theme: "grid",
    head: [["Indicator", "Value"]],
    body: [
      ["Success rate", n(dashboard.academic.successRate, "%")],
      ["Attendance rate", n(dashboard.academic.attendanceRate, "%")],
      ["Dropout rate", n(dashboard.academic.dropoutRate, "%")],
      ["Repetition rate", n(dashboard.academic.repetitionRate, "%")],
      ["Employability rate", n(dashboard.insertion.employabilityRate, "%")],
      ["Insertion delay (months)", n(dashboard.insertion.insertionDelayMonths)],
      ["Budget allocated (TND)", n(dashboard.finance.budgetAllocated)],
      ["Budget consumed (TND)", n(dashboard.finance.budgetConsumed)],
      ["Cost per student (TND)", n(dashboard.finance.costPerStudent)],
    ],
    styles: { fontSize: 10, cellPadding: 2.5 },
    headStyles: { fillColor: [36, 81, 127], textColor: 255 },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: "auto" } },
    margin: { left: marginX, right: marginX },
  });

  // Operational KPIs (HR, research, infra, partnership)
  if (dashboard.hr || dashboard.research || dashboard.infrastructure || dashboard.partnership) {
    const opsBody: Array<[string, string]> = [];
    if (dashboard.hr) {
      opsBody.push(
        ["Teaching headcount", n(dashboard.hr.teachingHeadcount)],
        ["Admin headcount", n(dashboard.hr.adminHeadcount)],
        ["Absenteeism rate", n(dashboard.hr.absenteeismRate, "%")],
      );
    }
    if (dashboard.research) {
      opsBody.push(
        ["Publications", n(dashboard.research.publicationsCount)],
        ["Active research projects", n(dashboard.research.activeProjects)],
        ["Research funding (TND)", n(dashboard.research.fundingSecuredTnd)],
      );
    }
    if (dashboard.infrastructure) {
      opsBody.push(
        ["Classroom occupancy", n(dashboard.infrastructure.classroomOccupancyPct, "%")],
        ["Equipment availability", n(dashboard.infrastructure.equipmentAvailabilityPct, "%")],
      );
    }
    if (dashboard.partnership) {
      opsBody.push(
        ["Active agreements", n(dashboard.partnership.activeAgreementsCount)],
        ["Mobility incoming", n(dashboard.partnership.studentMobilityIncoming)],
        ["Mobility outgoing", n(dashboard.partnership.studentMobilityOutgoing)],
      );
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      theme: "grid",
      head: [["Operations", "Value"]],
      body: opsBody,
      styles: { fontSize: 10, cellPadding: 2.5 },
      headStyles: { fillColor: [36, 81, 127], textColor: 255 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: "auto" } },
      margin: { left: marginX, right: marginX },
    });
  }

  // AI assessment
  if (dashboard.aiAssessment) {
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(19, 38, 59);
    doc.text("AI assessment", marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(61, 79, 99);
    const lines = doc.splitTextToSize(
      dashboard.aiAssessment.summary ?? "",
      pageWidth - marginX * 2,
    );
    doc.text(lines, marginX, y);
  }

  // At-risk students table on a new page when present
  if (atRisk.length) {
    doc.addPage("a4", "portrait");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(19, 38, 59);
    doc.text("Students at risk", marginX, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(96, 117, 138);
    doc.text(
      `${atRisk.length} student${atRisk.length === 1 ? "" : "s"} flagged on grades < 10/20 or attendance < 70%.`,
      marginX,
      24,
    );

    autoTable(doc, {
      startY: 30,
      theme: "striped",
      head: [["Student ID", "Name", "Level", "Avg. grade", "Attendance"]],
      body: atRisk.map((s) => [
        s.studentId,
        s.name,
        s.level,
        `${s.averageGrade.toFixed(2)} / 20`,
        `${s.attendanceRate}%`,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [192, 57, 43], textColor: 255 },
      alternateRowStyles: { fillColor: [253, 236, 234] },
      margin: { left: marginX, right: marginX },
    });
  }

  // Page footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(154, 167, 182);
    doc.text(
      `UCAR Insight - ${inst.shortName} - Page ${i}/${totalPages}`,
      pageWidth / 2,
      287,
      { align: "center" },
    );
  }

  const safe = inst.shortName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
  doc.save(`institution-report-${safe}.pdf`);
}

export function InstitutionReportPage() {
  const { dashboard, error } = useInstitutionDashboard();
  const { periods, periodId } = usePeriod();
  const [generating, setGenerating] = useState(false);

  const periodLabel =
    periods.find((p) => p.id === periodId)?.label ?? periodId ?? "Current period";

  const atRisk: MockStudent[] = (() => {
    const id = dashboard?.institution.id ?? "";
    if (!id || !isStudentsPanelEnabled(id)) return [];
    const byLevel = deriveInstitutionStudents(id);
    if (!byLevel) return [];
    const list: MockStudent[] = [];
    STUDENT_LEVELS.forEach((lvl) => {
      byLevel[lvl].forEach((s) => {
        if (s.status === "At risk") list.push(s);
      });
    });
    list.sort((a, b) => a.averageGrade - b.averageGrade);
    return list;
  })();

  const onGenerate = () => {
    if (!dashboard) return;
    try {
      setGenerating(true);
      downloadInstitutionReportPdf(dashboard, periodLabel, atRisk);
    } finally {
      setGenerating(false);
    }
  };

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Institution Admin</span>
            <h2>Generate Institution Report</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Institution Admin</span>
            <h2>Generate Institution Report</h2>
            <p>Loading institution data…</p>
          </div>
        </header>
      </section>
    );
  }

  const a = dashboard.academic;
  const f = dashboard.finance;
  const i = dashboard.insertion;

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Institution Admin</span>
          <h2>Generate Institution Report</h2>
          <p>
            One-click PDF for <strong>{dashboard.institution.shortName}</strong> · {periodLabel}.
            Includes academic, finance, operations, AI assessment, and at-risk students.
          </p>
        </div>
        <Button type="button" onClick={onGenerate} disabled={generating}>
          {generating ? "Generating…" : "Download PDF"}
        </Button>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard label="Success rate" value={n(a.successRate, "%")} helper="Academic period" accent="green" />
        <StatCard label="Attendance" value={n(a.attendanceRate, "%")} helper="Of enrolled students" accent="blue" />
        <StatCard label="Budget usage" value={n(f.budgetAllocated ? (f.budgetConsumed / f.budgetAllocated) * 100 : null, "%")} helper="Consumed vs allocated" accent="orange" />
        <StatCard label="Employability" value={n(i.employabilityRate, "%")} helper="Recent graduates" accent="green" />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Report contents</h3>
          <span>One-click PDF</span>
        </div>
        <ul className="recommendation-list">
          <li>Headline KPIs: success, attendance, dropout, repetition, employability, finance.</li>
          <li>Operational metrics: HR, research, infrastructure, partnerships (where available).</li>
          {dashboard.aiAssessment ? <li>AI assessment summary for this period.</li> : null}
          {atRisk.length ? (
            <li>
              Dedicated page listing the <strong>{atRisk.length}</strong> at-risk student
              {atRisk.length === 1 ? "" : "s"} (grades or attendance below threshold).
            </li>
          ) : null}
        </ul>
      </section>
    </section>
  );
}
