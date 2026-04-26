import { Fragment, useMemo } from "react";
import jsPDF from "jspdf";

import { useAuth } from "../../auth/AuthContext";
import { deriveRegistrationMock, type StudentRegistrationMock } from "../../lib/studentMockProfile";
import { useStudentSnapshot } from "../../lib/useStudentSnapshot";
import type { StudentSnapshot } from "../../types";

const PRINT_STYLE_ID = "ucar-cert-print-style";

function ensurePrintStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      .cert-printable, .cert-printable * { visibility: visible !important; }
      .cert-printable {
        position: absolute !important;
        left: 0; top: 0;
        width: 100%;
        margin: 0 !important;
        padding: 24mm 22mm !important;
        box-shadow: none !important;
        border: none !important;
        background: #fff !important;
      }
      .cert-noprint { display: none !important; }
      @page { size: A4 portrait; margin: 0; }
    }
  `;
  document.head.appendChild(style);
}

function formatTodayLong(): string {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function certificateNumber(studentCode: string | null | undefined, year: string | null | undefined) {
  const code = studentCode ?? "STUDENT";
  const yr = (year ?? new Date().getFullYear().toString()).replace(/[^0-9]/g, "").slice(0, 4) || String(new Date().getFullYear());
  return `UCAR/${yr}/${code}`;
}

function downloadCertificatePdf(args: {
  snapshot: StudentSnapshot;
  reg: StudentRegistrationMock;
  yearLabel: string;
  registrationDateLabel: string;
  issueDate: string;
  certNo: string;
}) {
  const { snapshot, reg, yearLabel, registrationDateLabel, issueDate, certNo } = args;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;

  // Header band
  doc.setFillColor(29, 83, 148);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Top header text
  doc.setTextColor(96, 117, 138);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "REPUBLIQUE TUNISIENNE - MINISTERE DE L'ENSEIGNEMENT SUPERIEUR",
    marginX,
    16,
  );

  doc.setTextColor(19, 38, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("University of Carthage", marginX, 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(61, 79, 99);
  const instLine = `${snapshot.institutionName}${snapshot.institutionRegion ? ` - ${snapshot.institutionRegion}` : ""}`;
  doc.text(instLine, marginX, 30);

  // Right side: cert number & issue date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(96, 117, 138);
  doc.text(`No ${certNo}`, pageWidth - marginX, 22, { align: "right" });
  doc.text(`Issued: ${issueDate}`, pageWidth - marginX, 27, { align: "right" });

  // Divider
  doc.setDrawColor(29, 83, 148);
  doc.setLineWidth(0.6);
  doc.line(marginX, 35, pageWidth - marginX, 35);

  // Title
  doc.setTextColor(29, 83, 148);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ATTESTATION D'INSCRIPTION", pageWidth / 2, 50, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(96, 117, 138);
  doc.text("Certificate of Registration", pageWidth / 2, 57, { align: "center" });

  // Body
  doc.setTextColor(19, 38, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const bodyText =
    `The Director of ${snapshot.institutionName} (University of Carthage) certifies that the ` +
    `student identified below is regularly registered at this institution for the academic year ${yearLabel}.`;
  const bodyLines = doc.splitTextToSize(bodyText, contentWidth);
  doc.text(bodyLines, marginX, 70);

  // Identity card
  const rows: Array<[string, string]> = [
    ["Full name", snapshot.studentName],
    ["Sex", reg.sex === "F" ? "Female" : "Male"],
    ["Date of birth", reg.dateOfBirth],
    ["Place of birth", reg.placeOfBirth],
    ["Nationality", reg.nationality],
    ["National ID (CIN)", reg.cin],
    ["Address", reg.address],
    ["Student code", reg.studentCode],
    ["Specialty", "SIC"],
    ["Level", reg.level],
    ["Institution", snapshot.institutionName],
    ["University", "University of Carthage"],
    ["Academic year", yearLabel],
    ["Registration date", registrationDateLabel],
  ];

  const cardTop = 84;
  const rowHeight = 7;
  const cardHeight = rows.length * rowHeight + 6;
  doc.setFillColor(247, 250, 253);
  doc.setDrawColor(227, 234, 243);
  doc.roundedRect(marginX, cardTop, contentWidth, cardHeight, 2, 2, "FD");

  doc.setFontSize(10);
  rows.forEach(([label, value], idx) => {
    const y = cardTop + 8 + idx * rowHeight;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(96, 117, 138);
    doc.text(label, marginX + 4, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(19, 38, 59);
    doc.text(String(value ?? "-"), marginX + 60, y);
  });

  // Footer text
  const afterCardY = cardTop + cardHeight + 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(61, 79, 99);
  doc.text(
    "This certificate is issued at the request of the concerned party to serve any legal purpose.",
    marginX,
    afterCardY,
  );

  // Signature block
  const sigY = afterCardY + 28;
  doc.setDrawColor(200, 213, 227);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(marginX, sigY - 12, pageWidth - marginX, sigY - 12);
  doc.setLineDashPattern([], 0);

  // Verification code (left)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(96, 117, 138);
  doc.text("Verification code:", marginX, sigY - 5);
  doc.setFont("courier", "normal");
  doc.setTextColor(19, 38, 59);
  doc.text(certNo.replace(/\//g, "-"), marginX, sigY);

  // Signature (right)
  const sigRightX = pageWidth - marginX;
  doc.setDrawColor(19, 38, 59);
  doc.setLineWidth(0.4);
  doc.line(sigRightX - 60, sigY - 4, sigRightX, sigY - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(19, 38, 59);
  doc.text(reg.directorName, sigRightX, sigY + 2, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(61, 79, 99);
  doc.text(
    `Director - ${snapshot.institutionShortName ?? snapshot.institutionName}`,
    sigRightX,
    sigY + 7,
    { align: "right" },
  );
  doc.setTextColor(154, 167, 182);
  doc.text("Signature & official stamp", sigRightX, sigY + 12, { align: "right" });

  // Bottom note
  doc.setFontSize(8);
  doc.setTextColor(154, 167, 182);
  doc.text(
    `UCAR Insight Platform - Generated electronically on ${issueDate}`,
    pageWidth / 2,
    287,
    { align: "center" },
  );

  const safeCode = (snapshot.studentCode ?? "student").replace(/[^a-z0-9_-]/gi, "_");
  doc.save(`registration-certificate-${safeCode}.pdf`);
}

export function RegistrationCertificatePage() {
  const { user } = useAuth();
  const { snapshot, error, loading, activePeriod } = useStudentSnapshot();
  const seedKey = user?.studentProfileId ?? snapshot?.studentName ?? "student";
  const reg = useMemo(
    () => (snapshot ? deriveRegistrationMock(snapshot, seedKey) : null),
    [snapshot, seedKey],
  );

  ensurePrintStyle();

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Registration Certificate</h2>
            <p>{error}</p>
          </div>
        </header>
      </section>
    );
  }

  if (loading || !snapshot || !reg) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">Student</span>
            <h2>Registration Certificate</h2>
            <p>Loading…</p>
          </div>
        </header>
      </section>
    );
  }

  const issueDate = formatTodayLong();
  const yearLabel = activePeriod
    ? `${activePeriod.year}/${activePeriod.year + 1}`
    : "—";
  const registrationDateLabel = activePeriod
    ? `15/09/${activePeriod.year}`
    : reg.registrationDate;
  const certNo = certificateNumber(snapshot.studentCode, String(activePeriod?.year ?? ""));

  return (
    <section className="page">
      <header className="page__header cert-noprint">
        <div>
          <span className="shell__eyebrow">Student</span>
          <h2>Registration Certificate</h2>
          <p>Official attestation of enrollment for the current academic year.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            downloadCertificatePdf({
              snapshot,
              reg,
              yearLabel,
              registrationDateLabel,
              issueDate,
              certNo,
            })
          }
        >
          Download PDF
        </button>
      </header>

      {/* Printable certificate */}
      <article
        className="cert-printable"
        style={{
          background: "#fff",
          color: "#13263b",
          border: "1px solid #d6e0ec",
          borderRadius: 8,
          padding: "48px 56px",
          margin: "0 auto",
          maxWidth: 840,
          boxShadow: "0 8px 24px rgba(26, 54, 93, 0.06)",
          fontFamily: "'Times New Roman', Times, serif",
          lineHeight: 1.6,
          position: "relative",
        }}
      >
        {/* Header band */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #1d5394",
            paddingBottom: 18,
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.2, color: "#60758a", textTransform: "uppercase" }}>
              République Tunisienne · Ministère de l'Enseignement Supérieur
            </div>
            <h1 style={{ fontSize: 22, margin: "6px 0 2px 0", color: "#13263b" }}>
              University of Carthage
            </h1>
            <div style={{ fontSize: 14, color: "#3d4f63", fontWeight: 600 }}>
              {snapshot.institutionName}
              {snapshot.institutionRegion ? ` · ${snapshot.institutionRegion}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#60758a" }}>
            <div>N° {certNo}</div>
            <div>Issued: {issueDate}</div>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            textAlign: "center",
            fontSize: 26,
            letterSpacing: 3,
            margin: "16px 0 32px 0",
            textTransform: "uppercase",
            color: "#1d5394",
          }}
        >
          Attestation d'Inscription
          <br />
          <span style={{ fontSize: 14, letterSpacing: 1.5, color: "#60758a", textTransform: "uppercase" }}>
            Certificate of Registration
          </span>
        </h2>

        {/* Body */}
        <p style={{ fontSize: 15, marginBottom: 18 }}>
          The Director of <strong>{snapshot.institutionName}</strong> (University of Carthage)
          certifies that the student identified below is regularly registered at this institution
          for the academic year <strong>{yearLabel}</strong>.
        </p>

        {/* Identity list (one under another) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            rowGap: 10,
            columnGap: 18,
            padding: "20px 24px",
            background: "#f7fafd",
            border: "1px solid #e3eaf3",
            borderRadius: 6,
            marginBottom: 24,
            fontSize: 13.5,
          }}
        >
          {[
            ["Full name", snapshot.studentName],
            ["Sex", reg.sex === "F" ? "Female" : "Male"],
            ["Date of birth", reg.dateOfBirth],
            ["Place of birth", reg.placeOfBirth],
            ["Nationality", reg.nationality],
            ["National ID (CIN)", reg.cin],
            ["Address", reg.address],
            ["Student code", reg.studentCode],
            ["Specialty", "SIC"],
            ["Level", reg.level],
            ["Institution", snapshot.institutionName],
            ["University", "University of Carthage"],
            ["Academic year", yearLabel],
            ["Registration date", registrationDateLabel],
          ].map(([k, v]) => (
            <Fragment key={k}>
              <div style={{ color: "#60758a", fontWeight: 600 }}>{k}</div>
              <div style={{ color: "#13263b", fontWeight: 600 }}>{v}</div>
            </Fragment>
          ))}
        </div>

        <p style={{ fontSize: 14, marginBottom: 36 }}>
          This certificate is issued at the request of the concerned party to serve any legal purpose.
        </p>

        {/* Footer / signature */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px dashed #c8d5e3",
            paddingTop: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "#60758a" }}>
            Verification code:
            <div style={{ fontFamily: "monospace", color: "#13263b", marginTop: 4 }}>
              {certNo.replace(/\//g, "-")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 200,
                borderBottom: "1px solid #13263b",
                marginBottom: 6,
                height: 36,
              }}
            />
            <div style={{ fontSize: 12, color: "#13263b", fontWeight: 600 }}>
              {reg.directorName}
            </div>
            <div style={{ fontSize: 11, color: "#3d4f63", marginTop: 2 }}>
              Director · {snapshot.institutionShortName ?? snapshot.institutionName}
            </div>
            <div style={{ fontSize: 10, color: "#60758a", marginTop: 2 }}>
              Signature & official stamp
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 18,
            left: 56,
            right: 56,
            textAlign: "center",
            fontSize: 10,
            color: "#9aa7b6",
            letterSpacing: 0.5,
          }}
        >
          UCAR Insight Platform · Generated electronically on {issueDate}
        </div>
      </article>
    </section>
  );
}
