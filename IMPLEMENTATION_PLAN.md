# UCAR Insight Implementation Plan

## Goal

Build a focused hackathon prototype of a multi-tenant university intelligence platform that:

- ingests messy institutional data,
- normalizes it into a shared data model,
- displays cross-institution KPIs,
- and uses AI to generate alerts, predictions, and summaries.

The prototype should be narrow enough to finish in a hackathon, while still demonstrating a credible path to scale across 30+ institutions.

## Product Scope

### In Scope

- Multi-tenant architecture with institution-level separation
- File-based ingestion for Excel, CSV, and optionally PDF
- Unified data model for a limited set of domains
- KPI dashboard for leadership and institutional managers
- AI-powered anomaly detection or forecasting
- Auto-generated executive summary
- Exportable report output

### Out of Scope

- Full ERP replacement
- Deep workflow automation for every department
- Large-scale systems integration with existing university software
- Full Arabic/French/Tunisian administrative process coverage
- Complex role hierarchies beyond demo needs

## Recommended Domain Scope

For the prototype, focus on a high-impact slice that still reflects the real UCAR brief:

### 1. Academics and student lifecycle

- Enrollment
- Success rate
- Attendance rate
- Repetition rate
- Dropout rate
- Graduation trend

### 2. Insertion and partnerships

- National convention rate
- International convention rate
- Employability rate
- Insertion delay

### 3. Finance and ESG

- Budget allocation
- Budget consumption
- Cost per student
- Overspending or underutilization alerts
- Energy consumption
- Carbon footprint
- Recycling rate
- Mobility indicators

This is enough to show operational breadth without making the data model unmanageable.

## Core User Stories

### UCAR Leadership

- As a UCAR leader, I can compare institutions on common KPIs.
- As a UCAR leader, I can see alerts when one institution deviates from expected performance.
- As a UCAR leader, I can receive a plain-language summary of current risks and trends.

### Institution Manager

- As an institution manager, I can upload my institution's files.
- As an institution manager, I can view my institution's metrics and trends.
- As an institution manager, I can understand why the system flagged a metric.

### Data Officer

- As a data officer, I can import Excel or CSV files into the platform.
- As a data officer, I can validate mapped fields before finalizing ingestion.
- As a data officer, I can correct bad mappings or missing values.

## System Architecture

## High-Level Flow

1. Institution uploads source files.
2. Ingestion service parses and standardizes records.
3. Records are stored in a unified relational model.
4. KPI service computes metrics per institution and period.
5. AI service generates anomaly alerts, forecasts, and summaries.
6. Dashboard presents institution and UCAR-wide views.

## Suggested Architecture Components

### Frontend

- Web dashboard for leadership and administrators
- Upload interface for source documents
- KPI cards, trend charts, comparison tables, and alerts panel

### Backend API

- Authentication and role handling
- Tenant-aware data access
- File upload and parsing workflow
- KPI computation endpoints
- AI summary and prediction endpoints

### Data Layer

- Relational database with institution-scoped records
- Source file metadata and ingestion audit trail
- KPI snapshot tables for fast dashboard loading

### AI Layer

- Extraction assistance for column mapping and field interpretation
- Anomaly detection on KPI trends
- Optional simple forecasting for selected KPIs
- Plain-language report generation with explainable outputs

## Unified Data Model

Start with a small shared schema.

### Core Tables

- `institutions`
- `reporting_periods`
- `students_metrics`
- `finance_metrics`
- `hr_metrics`
- `uploaded_files`
- `ingestion_jobs`
- `kpi_snapshots`
- `alerts`
- `generated_reports`

### Example Common Dimensions

- institution_id
- reporting_period
- department or faculty
- metric_name
- metric_value
- source_file
- confidence_score

This keeps the prototype simple and avoids overengineering.

## AI Strategy

AI must be central, not cosmetic. The platform should use AI in one or more of these ways:

### 1. Smart Data Structuring

Use AI to:

- infer column meaning from uploaded spreadsheets,
- map inconsistent field names to a shared schema,
- summarize missing or suspicious fields.

Example:

- `Nbr Etud`, `Students`, and `Total inscrits` can all map to `student_count`.

### 2. Anomaly Detection

Use statistical or lightweight ML logic to identify:

- sudden dropout increases,
- unusually low budget execution,
- abnormal staffing shifts.

The result should be explainable:

- what changed,
- why it matters,
- and how it compares to peers or history.

### 3. Forecasting

Forecast one KPI such as:

- dropout rate,
- budget usage,
- or enrollment trend.

This does not need deep ML. A simple, explainable time-series method is enough for a hackathon prototype.

### 4. Auto-Generated Executive Summaries

Generate short natural-language summaries from computed KPIs and alerts.

Example output:

`Compared with the previous quarter, Institution B shows improving enrollment stability but below-average budget execution and rising HR pressure.`

## Recommended AI Feature Set for the Demo

If time is limited, prioritize this stack:

1. AI-assisted field mapping during ingestion
2. Rule-based or statistical anomaly detection
3. LLM-generated executive summary from structured metrics

This gives visible AI value across input, analysis, and output.

## Explainability Requirements

Because the target users are non-technical, every AI output should explain:

- what the system found,
- what data it used,
- what comparison was made,
- and how confident the result is.

For example, an alert should say:

- current value,
- previous value,
- peer benchmark,
- reason for flagging.

## Multi-Tenant Design

The platform should treat each institution as a tenant while allowing UCAR-level oversight.

### Required Behavior

- Institution users see only their own data
- UCAR leadership sees all institutions
- KPIs are standardized across tenants
- Comparisons are generated from shared definitions

### Why This Matters

This is a core architectural signal that the system can realistically scale to all UCAR institutions.

## UX Principles

The interface should be designed for non-technical staff.

### UX Rules

- Keep the upload flow simple and guided
- Use plain language, not technical labels
- Show high-level KPIs first, details second
- Make alerts easy to scan and understand
- Provide export-ready summaries

### Key Screens

- Login / role-based access
- Institution file upload and ingestion review
- UCAR leadership overview dashboard
- Institution comparison dashboard
- Alerts and insights page
- Generated report page

## Suggested KPI Set

Use 5 to 8 KPIs max for the prototype.

Recommended set:

- Enrollment volume
- Success rate
- Attendance rate
- Dropout rate
- Repetition rate
- Budget utilization rate
- Employability rate
- Convention rate
- Cost per student
- Energy or ESG index

Optional:
- Research output
- HR or infrastructure indicators

## Demo Dataset Strategy

Prepare a controlled synthetic dataset for 3 institutions.

### Institution Examples

- Faculty of Sciences
- Faculty of Economics
- Engineering School

### Data Inputs

- One enrollment spreadsheet
- One budget file
- One HR file
- Optional PDF report with summary statistics

### Planned Variations

Seed the data so the demo shows:

- one institution with rising dropout risk,
- one with budget underutilization,
- one with stable strong performance.

This guarantees visible AI and dashboard outputs during the demo.

## Technical Implementation Phases

## Phase 1: Foundation

- Set up project structure
- Define shared schema
- Implement tenant model
- Prepare synthetic datasets

## Phase 2: Ingestion

- Build file upload flow
- Parse CSV and Excel
- Normalize fields
- Store cleaned records

## Phase 3: KPI Engine

- Compute key metrics from normalized data
- Store KPI snapshots
- Build comparison logic across institutions

## Phase 4: AI Layer

- Add anomaly detection
- Add optional forecasting for one KPI
- Generate executive summary from structured metrics

## Phase 5: Dashboard

- Build leadership overview
- Build institution detail view
- Build alerts panel
- Build exportable report view

## Phase 6: Demo Hardening

- Improve data quality edge cases
- Validate role separation
- Test main demo path
- Prepare pitch screenshots and narrative

## Team Execution Plan

If working with multiple teammates, divide the work like this:

### Track A: Data + Backend

- schema
- ingestion
- tenant logic
- KPI computation

### Track B: AI + Analytics

- field mapping support
- anomaly detection
- forecasting
- report generation

### Track C: Frontend + Demo

- dashboard UI
- upload flow
- alerts display
- presentation polish

## Detailed Build Checklist

### Data

- [ ] define institution and reporting models
- [ ] define KPI formulas
- [ ] create 3 demo tenant datasets
- [ ] prepare ingestion templates

### Backend

- [ ] implement upload endpoint
- [ ] implement parsing pipeline
- [ ] implement normalized storage
- [ ] implement KPI calculation endpoints
- [ ] implement alerts endpoint
- [ ] implement report generation endpoint

### Frontend

- [ ] create dashboard layout
- [ ] create tenant switch or leadership view
- [ ] create upload page
- [ ] create KPI cards and charts
- [ ] create alerts panel
- [ ] create summary report page

### AI

- [ ] define field-mapping prompt or rules
- [ ] define anomaly detection logic
- [ ] define one forecast workflow
- [ ] define report-generation prompt using structured inputs

### Demo

- [ ] seed realistic sample data
- [ ] test full upload-to-dashboard flow
- [ ] test alert generation
- [ ] prepare two-minute live walkthrough

## Risks and Mitigations

### Risk: Scope explosion

Mitigation:

- keep only 3 domains,
- limit KPIs,
- build one strong AI feature well.

### Risk: Weak AI impression

Mitigation:

- make AI visible in ingestion and analytics,
- show explainable alerts and generated summaries.

### Risk: Poor demo clarity

Mitigation:

- use curated datasets,
- pre-seed notable anomalies,
- design a clean narrative around decision-making.

### Risk: Data inconsistency

Mitigation:

- use a strict shared schema,
- add a validation review step after file upload.

## Demo Narrative

The demo should follow this story:

1. A data officer uploads files for an institution.
2. The platform structures the data automatically.
3. A UCAR leader opens the dashboard and compares institutions.
4. The system flags a problem.
5. The AI explains the issue and generates a short executive summary.
6. The report is exported or presented as a decision-ready snapshot.

## Pitch Framing

The pitch should emphasize:

- UCAR suffers from fragmented institutional data
- the platform centralizes and standardizes this data
- AI improves both data ingestion and strategic decision support
- the architecture is multi-tenant and scalable
- the prototype is realistic for Tunisian operational constraints

## Success Criteria

The prototype is successful if it proves:

- multiple institutions can be represented in one system,
- messy administrative data can be normalized,
- leadership can compare standardized KPIs,
- the platform can detect or predict an issue,
- the insight is understandable and actionable.

## Final Recommendation

Build the smallest complete intelligence loop:

`upload -> structure -> measure -> detect -> explain`

That loop is the strongest expression of the problem, the AI value, and the system's scalability.
