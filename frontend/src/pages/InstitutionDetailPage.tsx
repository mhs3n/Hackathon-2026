import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AiAssessmentPanel } from "../components/ui/AiAssessmentPanel";
import { KpiTrendPanel } from "../components/ui/KpiTrendPanel";
import { PeriodBadge } from "../components/ui/PeriodBadge";
import { StatCard } from "../components/ui/StatCard";
import { fetchInstitutionDashboard } from "../lib/api";
import { usePeriod } from "../period/PeriodContext";
import type { InstitutionDashboardView } from "../types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export function InstitutionDetailPage() {
  const { institutionId } = useParams<{ institutionId: string }>();
  const { periodId } = usePeriod();
  const [dashboard, setDashboard] = useState<InstitutionDashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId || !periodId) {
      return;
    }
    let isActive = true;
    setDashboard(null);
    setError(null);
    fetchInstitutionDashboard(institutionId, periodId)
      .then((payload) => {
        if (isActive) {
          setDashboard(payload);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (isActive) {
          setDashboard(null);
          setError(err.message);
        }
      });

    return () => {
      isActive = false;
    };
  }, [institutionId, periodId]);

  if (error) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">UCAR Admin</span>
            <h2>Institution Detail</h2>
            <p>{error}</p>
          </div>
          <Link className="primary-button" to="/admin/institutions">
            Back to institutions
          </Link>
        </header>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <section className="page">
        <header className="page__header">
          <div>
            <span className="shell__eyebrow">UCAR Admin</span>
            <h2>Institution Detail</h2>
            <p>Loading institution KPIs…</p>
          </div>
        </header>
      </section>
    );
  }

  const { institution, academic, insertion, finance, hr, research, infrastructure, partnership, process, riskList } = dashboard;
  const budgetUsage = finance.budgetAllocated > 0
    ? Math.round((finance.budgetConsumed / finance.budgetAllocated) * 100)
    : 0;

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <span className="shell__eyebrow">UCAR Admin</span>
          <h2>{institution.name}</h2>
          <p>
            {institution.shortName} · {institution.region} · detailed KPI and risk overview for the selected period.
          </p>
          <div style={{ marginTop: 8 }}>
            <PeriodBadge />
          </div>
        </div>
        <Link className="primary-button" to="/admin/institutions">
          Back to institutions
        </Link>
      </header>

      <div className="stats-grid stats-grid--four">
        <StatCard label="Success Rate" value={`${academic.successRate}%`} helper="Academic performance." accent="green" />
        <StatCard label="Employability" value={`${insertion.employabilityRate}%`} helper="Graduate insertion." accent="blue" />
        <StatCard label="Budget Consumed" value={`${budgetUsage}%`} helper="Consumed vs allocated." accent="orange" />
        <StatCard label="Risk Level" value={institution.riskLevel} helper={`${riskList.length} at-risk students listed.`} accent="red" />
      </div>

      <div className="panel-grid">
        {dashboard.aiAssessment && (
          <AiAssessmentPanel
            title="AI Risk Assessment"
            subtitle={`${institution.shortName} · explainable score`}
            assessment={dashboard.aiAssessment}
          />
        )}

        <section className="panel">
          <div className="panel__header">
            <h3>Core KPI snapshot</h3>
            <span>Current reporting period</span>
          </div>
          <ul className="metric-list">
            <li><span>Attendance rate</span><strong>{academic.attendanceRate}%</strong></li>
            <li><span>Dropout rate</span><strong>{academic.dropoutRate}%</strong></li>
            <li><span>Abandonment rate</span><strong>{academic.abandonmentRate}%</strong></li>
            <li><span>Insertion delay</span><strong>{insertion.insertionDelayMonths} months</strong></li>
            <li><span>Cost per student</span><strong>{formatNumber(finance.costPerStudent)} TND</strong></li>
          </ul>
        </section>
      </div>

      <div className="panel-grid">
        <KpiTrendPanel
          institutionId={institution.id}
          domain="academic"
          metricKey="successRate"
          metricLabel="Success rate"
          color="#27ae60"
        />
        <KpiTrendPanel
          institutionId={institution.id}
          domain="academic"
          metricKey="dropoutRate"
          metricLabel="Dropout rate"
          color="#e85d6c"
        />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Finance & insertion</h3>
            <span>Budget and employability</span>
          </div>
          <ul className="metric-list">
            <li><span>Budget allocated</span><strong>{formatNumber(finance.budgetAllocated)} TND</strong></li>
            <li><span>Budget consumed</span><strong>{formatNumber(finance.budgetConsumed)} TND</strong></li>
            <li><span>National conventions</span><strong>{insertion.nationalConventionRate}%</strong></li>
            <li><span>International conventions</span><strong>{insertion.internationalConventionRate}%</strong></li>
          </ul>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>Operations & people</h3>
            <span>HR and infrastructure</span>
          </div>
          <ul className="metric-list">
            {hr && <li><span>Teaching headcount</span><strong>{formatNumber(hr.teachingHeadcount)}</strong></li>}
            {hr && <li><span>Absenteeism rate</span><strong>{hr.absenteeismRate}%</strong></li>}
            {infrastructure && <li><span>Equipment availability</span><strong>{infrastructure.equipmentAvailabilityPct}%</strong></li>}
            {infrastructure && <li><span>Maintenance backlog</span><strong>{formatNumber(infrastructure.maintenanceBacklogDays)} days</strong></li>}
          </ul>
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__header">
            <h3>Research & partnerships</h3>
            <span>Activity indicators</span>
          </div>
          <ul className="metric-list">
            {research && <li><span>Publications</span><strong>{formatNumber(research.publicationsCount)}</strong></li>}
            {research && <li><span>Active projects</span><strong>{formatNumber(research.activeProjects)}</strong></li>}
            {research && <li><span>Funding secured</span><strong>{formatNumber(research.fundingSecuredTnd)} TND</strong></li>}
            {partnership && <li><span>Active agreements</span><strong>{formatNumber(partnership.activeAgreementsCount)}</strong></li>}
            {partnership && <li><span>International projects</span><strong>{formatNumber(partnership.internationalProjects)}</strong></li>}
          </ul>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h3>At-risk students</h3>
            <span>Priority follow-up list</span>
          </div>
          {riskList.length > 0 ? (
            <ul className="recommendation-list">
              {riskList.slice(0, 5).map((student) => (
                <li key={student.id}>
                  <strong>{student.name}</strong>
                  <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                    Risk score {student.riskScore} · attendance {student.attendance}% · grade {student.averageGrade}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{student.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: "var(--muted)" }}>No at-risk students flagged for this period.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h3>Process KPIs</h3>
          <span>Operational detail</span>
        </div>
        {process.length > 0 ? (
          <ul className="metric-list">
            {process.map((item) => (
              <li key={item.id}>
                <span>{item.processLabel} · {item.metricLabel}</span>
                <strong>{item.metricValue} {item.metricUnit}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0, color: "var(--muted)" }}>No process metrics available for this institution.</p>
        )}
      </section>
    </section>
  );
}
