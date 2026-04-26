# UCAR Insight

## Overview

UCAR currently operates like a network of 30+ disconnected mini-universities. Data lives across paper files, spreadsheets, PDF reports, and isolated tools, which creates duplicated work, slow coordination, and weak decision-making.

`UCAR Insight` is a proposed multi-tenant university intelligence platform that centralizes institutional data, structures it into a unified model, and gives leadership real-time visibility through KPIs, alerts, and AI-generated insights.

This is not just a dashboard. The goal is to build a central intelligence system for the University of Carthage.

## Core Problem

The main issue is data chaos:

- No central system across institutions
- Fragmented data stored in paper, Excel, PDFs, and disconnected tools
- Slow, manual reporting and duplicated administrative effort
- Limited real-time visibility for university leadership
- Decisions made with incomplete or outdated information

The consequence is simple: bad coordination leads to bad decisions.

## Product Vision

The platform should:

- Gather data from all institutions into one place
- Clean, normalize, and structure that data
- Automate repetitive administrative workflows
- Provide a consolidated multi-establishment view
- Aggregate and compare KPIs between establishments
- Trigger intelligent alerts on anomalies or critical thresholds
- Generate periodic automatic reports
- Power predictive analysis for forward-looking decision support
- Generate decision-ready summaries and reports for leadership

In one sentence:

`UCAR Insight is an AI-powered central intelligence platform that transforms fragmented university data into real-time KPIs, alerts, and strategic insights across all UCAR institutions.`

## Recommended Hackathon Direction

The strongest strategy is to take `Track 4`, but keep it tightly scoped.

Instead of trying to build a full ERP, the prototype should deliver a focused end-to-end system with:

- Simple data ingestion
- A clean executive dashboard
- One strong AI capability that materially improves decision-making

## Prototype Concept

The prototype should include three core modules.

### 1. Data Intake

- Upload Excel, CSV, or PDF files
- Extract and normalize data into a shared schema
- Use AI to map messy source fields to structured records

Example data sources:

- Student enrollment sheets
- Budget summaries
- HR tables
- Research activity reports

### 2. Executive Dashboard

- Show KPIs for all institutions in one place
- Compare institutions side by side
- Track trends over time
- Highlight outliers visually

### 3. AI Decision Layer

- Detect anomalies such as unusual dropout spikes or overspending
- Forecast one or two strategic KPIs
- Generate automatic summaries in plain language

Example:

`Institution A shows increasing dropout risk and lower-than-average budget execution compared with peer institutions this quarter.`

## Suggested Demo Scope

To stay realistic for a hackathon, the prototype should focus on:

- `3 institutions`
- `3 domains`: academics, finance, HR
- `5 to 8 KPIs`
- `1 killer AI feature`: anomaly detection or KPI forecasting

This is broad enough to show system value, but narrow enough to build and explain clearly.

## Example KPIs

- Dropout rate
- Success rate
- Attendance rate
- Repetition rate
- Enrollment trend
- National and international convention rate
- Employability rate
- Insertion delay
- Budget usage rate
- Budget allocated versus consumed
- Cost per student
- Staff-to-student ratio
- Research output
- Energy consumption
- Carbon footprint
- Recycling rate
- Mobility indicators

The big idea is to make universities measurable systems.

## Why This Can Win

This direction aligns directly with the evaluation criteria:

- `Impact`: solves the core problem of fragmented decision-making
- `AI depth`: AI is used for extraction, anomaly detection, prediction, and report generation
- `Usability`: non-technical staff can upload files and read clear dashboards
- `Scalability`: one multi-tenant platform can serve all UCAR institutions
- `Feasibility`: works with the existing reality of Excel/PDF-heavy processes in Tunisia

## User Roles

- `UCAR leadership`: sees cross-institution comparisons and strategic alerts
- `Institution manager`: sees institution-specific dashboards and performance
- `Data officer`: uploads files, validates imported data, and manages corrections

## Process Coverage

The long-term platform should cover a clean dashboard layer for:

- scolarite
- examens
- strategie
- partenariat
- finance
- vie estudiantine
- recherche
- infrastructure
- equipement
- ressource humaine
- magasin
- formation
- pedagogie

Each process should expose its own KPIs and feed consolidated synthesis reports.

## What Not To Build

To avoid wasting hackathon time, the prototype should not try to:

- Replace every internal university system
- Cover all university functions at once
- Build a generic chatbot as the main feature
- Spend most effort on back-office complexity that is hard to demo

## Best Practical Positioning

The product is best described as:

`Power BI + AI + institutional performance management for universities, delivered as one centralized multi-tenant platform.`

The winning demo is one where:

1. A user uploads messy files from multiple institutions.
2. The platform structures the data automatically.
3. Leadership instantly sees cross-institution KPIs.
4. The AI flags a risk, anomaly, or forecast with a clear explanation.

## Deliverables

The hackathon output should include:

- A working prototype
- AI as a core part of the workflow, not decoration
- A short pitch covering impact, feasibility, scalability, and implementation realism

## Current Prototype Shell

The repository now includes a first curated frontend shell inspired by `zenveo`, but rebuilt as a smaller UCAR-specific app.

It currently implements:

- `Login`
- `Role-based redirect`
- `UCAR Admin dashboard`
- `Institution Admin dashboard`
- `Student dashboard`

This is the first implementation slice of the curation strategy documented in [ZENVEO_CURATION_PLAN.md](/home/rayen/work/Hackathon-2026/ZENVEO_CURATION_PLAN.md).

### Dev Setup

**Backend:**

```bash
cd backend
cp .env.example .env        # then fill in UCAR_JWT_SECRET and UCAR_GEMINI_API_KEY
python -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend:**

```bash
cd frontend
cp .env.example .env        # sets VITE_API_BASE_URL=http://localhost:8001
npm install
npm run dev
```

Then open `http://localhost:5173` (or the port Vite prints).

### Demo Accounts

Password for all accounts: `123456`

| Email | Role |
|---|---|
| `owner@ucar.tn` | UCAR Admin |
| `insat@ucar.tn` | Institution Admin |
| `takwa.bouheni@enstab.ucar.tn` | Student |

## Next Step

The detailed implementation plan for the prototype is documented in [IMPLEMENTATION_PLAN.md](/home/rayen/work/Hackathon-2026/IMPLEMENTATION_PLAN.md).
