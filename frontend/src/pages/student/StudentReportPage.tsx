import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "../../components/ui/Button";
import { StatCard } from "../../components/ui/StatCard";
import { useStudentSnapshot } from "../../lib/useStudentSnapshot";
import type { StudentSnapshot } from "../../types";

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function riskLabel(score: number): { label: string; color: [number, number, number] } {
  if (score >= 70) return { label: "High", color: [192, 57, 43] };
  if (score >= 40) return { label: "Medium", color: [176, 125, 17] };
  return { label: "Low", color: [31, 138, 58] };
}

function downloadStudentReportPdf(snapshot: StudentSnapshot, periodLabel: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginX = 18;
  const today = formatToday();

  // Header band
  doc.setFillColor(22, 58, 94);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Personal Performance Report", marginX, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`UCAR Insight - ${snapshot.institutionName}`, marginX, 23);
  doc.setFontSize(9);
  doc.text(`Generated on ${today}`, pageWidth - marginX, 23, { align: "right" });

  // Identity block
  doc.setTextColor(19, 38, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(snapshot.studentName, marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(96, 117, 138);
  const subline = [
    snapshot.programName ?? null,
    snapshot.levelLabel ?? null,
    snapshot.studentCode ? `Code ${snapshot.studentCode}` : null,
  ]
    .filter(Boolean)
    .join("  -  ");
  if (subline) doc.text(subline, marginX, 48);
  doc.text(`Academic period: ${periodLabel}`, marginX, 53);

  // KPI summary table
  const risk = riskLabel(snapshot.riskScore);
  autoTable(doc, {
    startY: 62,
    theme: "grid",
    head: [["Indicator", "Value"]],
    body: [
      ["Average grade", `${snapshot.averageGrade.toFixed(2)} / 20`],
      ["Attendance", `${snapshot.attendance.toFixed(1)}%`],
      ["Risk score", `${snapshot.riskScore.toFixed(0)} / 100 (${risk.label})`],
    ],
    styles: { fontSize: 11, cellPadding: 3 },
    headStyles: { fillColor: [36, 81, 127], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 80 } },
    margin: { left: marginX, right: marginX },
  });

  // Risk explanation
  let cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(19, 38, 59);
  doc.text("Risk explanation", marginX, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(61, 79, 99);
  const explanation = doc.splitTextToSize(
    snapshot.riskExplanation || "No specific risk factors identified.",
    pageWidth - marginX * 2,
  );
  doc.text(explanation, marginX, cursorY);
  cursorY += explanation.length * 5 + 4;

  // Recommendations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(19, 38, 59);
  doc.text("Recommendations", marginX, cursorY);
  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(61, 79, 99);
  const recs = snapshot.recommendations.length
    ? snapshot.recommendations
    : ["Keep up the good work and maintain your current habits."];
  recs.forEach((rec) => {
    const wrapped = doc.splitTextToSize(`- ${rec}`, pageWidth - marginX * 2);
    doc.text(wrapped, marginX, cursorY);
    cursorY += wrapped.length * 5 + 1;
  });

  // AI assessment (if present)
  if (snapshot.aiAssessment) {
    cursorY += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(19, 38, 59);
    doc.text("AI assessment", marginX, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(61, 79, 99);
    const summary = doc.splitTextToSize(
      snapshot.aiAssessment.summary ?? "",
      pageWidth - marginX * 2,
    );
    doc.text(summary, marginX, cursorY);
    cursorY += summary.length * 5;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(154, 167, 182);
  doc.text(
    `UCAR Insight Platform - ${snapshot.studentName} - Generated on ${today}`,
    pageWidth / 2,
    287,
    { align: "center" },
  );

  const safe = (snapshot.studentCode ?? snapshot.studentName).replace(/[^a-z0-9_-]/gi, "_");
  doc.save(`student-report-${safe}.pdf`);
}

export function StudentReportPage() {
  const { snapshot, error, loading, activePeriod } = useStudentSnapshot();
  const [generating, setGenerating] = useState(false);

  const periodLabel = activePeriod
    ? `${activePeriod.year}/${activePeriod.year + 1} - ${activePeriod.semester}`
    : "Current period";

  const handleGenerate = () => {
    if (!snapshot) return;
    try {
      setGenerating(true);
      downloadStudentReportPdf(snapshot, periodLabel);
    } finally {
      setGenerating(false);
    }
  };

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>My Report</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (loading || !snapshot) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>My Report</h2>
            <p>Loading your data…</p>
          </div>
        </header>
      </section>
    );
  }

  const risk = (() => {
    const s = snapshot.riskScore;
    if (s >= 70) return { label: "High", accent: "red" as const };
    if (s >= 40) return { label: "Medium", accent: "orange" as const };
    return { label: "Low", accent: "green" as const };
  })();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">Student</span>
          <h2>My Report</h2>
          <p>
            Personal performance summary for <strong>{snapshot.studentName}</strong> · {periodLabel}.
          </p>
        </div>
        <Button type="button" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Download PDF"}
        </Button>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard
          label="Average grade"
          value={`${snapshot.averageGrade.toFixed(2)} / 20`}
          helper="Across all current modules"
          accent="blue"
        />
        <StatCard
          label="Attendance"
          value={`${snapshot.attendance.toFixed(1)}%`}
          helper="Sessions attended this period"
          accent="green"
        />
        <StatCard
          label="Risk score"
          value={`${snapshot.riskScore.toFixed(0)} / 100`}
          helper={`${risk.label} risk`}
          accent={risk.accent}
        />
        <StatCard
          label="Recommendations"
          value={String(snapshot.recommendations.length)}
          helper="Actions to consider"
          accent="orange"
        />
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>What this report includes</h3>
          <span>One-click PDF</span>
        </div>
        <ul className="recommendation-list">
          <li>Identity card: name, program, level, student code, period.</li>
          <li>Headline KPIs: average grade, attendance, risk score with band.</li>
          <li>Explainable risk reasoning generated from your latest data.</li>
          <li>Personalized recommendations to improve your trajectory.</li>
          {snapshot.aiAssessment ? <li>AI assessment summary from your latest snapshot.</li> : null}
        </ul>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Risk explanation</h3>
          <span>{risk.label} risk</span>
        </div>
        <p className="body-copy">{snapshot.riskExplanation || "No specific risk factors identified."}</p>
      </section>

      <section className="panel">
        <div className="panel__header">
          <h3>Recommendations</h3>
          <span>{snapshot.recommendations.length} item{snapshot.recommendations.length === 1 ? "" : "s"}</span>
        </div>
        <ul className="recommendation-list">
          {(snapshot.recommendations.length
            ? snapshot.recommendations
            : ["Keep up the good work and maintain your current habits."]
          ).map((rec) => (
            <li key={rec}>{rec}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
