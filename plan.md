# UCAR Insight — Hackathon Battle Plan

A concrete, opinionated plan to win **HACK4UCAR 2025** (Track 4 — End-to-End Smart Platform), built directly on top of the React + Vite + TypeScript shell already in this repo.

## Assumptions

- ~3–5 days of build time before the pitch.
- Team of 2–4 people.
- A hosted LLM API is available (OpenAI, Mistral, Groq, …). If not, drop in a local fallback (rules + Llama via Ollama) — see §8.
- If the timeline is tighter, follow priorities marked **P0 / P1 / P2** strictly and skip everything else.

---

## 1. Strategic Positioning

### 1.1 Pick Track 4 — End-to-End Smart Platform

This is the only track that lets you check every judging box at once (Impact, Innovation, Scalability, Feasibility) and it perfectly matches the existing 3-role shell.

One-line pitch:

> **UCAR Insight is a multi-tenant intelligence platform that ingests messy institutional files, structures them with AI, and gives every level of UCAR — leadership, institutions, students — explainable KPIs, alerts, forecasts, and auto-generated reports.**

### 1.2 Build the demo first, the product second

Every piece of work below exists because it appears in this 4-minute demo storyline. Memorize this storyline now — it is your scope filter.

1. **Login as Data Officer** → upload a real, messy Excel for "INSAT". AI suggests the field mapping. User confirms with one click. (~30s)
2. **Switch to UCAR Admin** → cross-institution dashboard for 30+ institutions. One card shows "3 institutions flagged at risk". (~30s)
3. **Drill into INSAT** → AI alert in plain language: *"Dropout up 4.8 pts vs last semester, 2.3× peer median. Likely driver: attendance collapse in 2nd-year cohort."* (~45s)
4. **Forecast tab** → simple line chart, "If trend holds, dropout rises to 21% by S1 2027. Recommended action: …" (~30s)
5. **"Ask UCAR" chatbot** → "Which institutions overspent budget but had declining success rate?" → returns a ranked table with explanation. (~45s)
6. **Click "Generate Report"** → a polished PDF/Excel downloads with KPIs + alerts + forecast + AI exec summary. (~30s)
7. **Switch to Student** → at-risk student sees explainable risk, recommended actions. (~30s)

Anything not serving these 7 beats is **out of scope** for the hackathon.

---

## 2. Target Architecture

```
┌──────────────────────────────────────────────────────────┐
│  React + Vite + TS  (your existing shell — keep it)      │
│   • 3 role apps  • dashboards  • upload UI  • chatbot UI │
└──────────────┬───────────────────────────────────────────┘
               │ REST/JSON
┌──────────────▼───────────────────────────────────────────┐
│  FastAPI (Python 3.11)                                   │
│   • /auth         • /upload     • /map (AI mapping)      │
│   • /kpis         • /alerts     • /forecast              │
│   • /summary (LLM)• /chat (LLM) • /reports/export        │
└──────────────┬───────────────────────────────────────────┘
               │ SQLAlchemy
┌──────────────▼───────────────────────────────────────────┐
│  SQLite (file-based, perfect for hackathon, 1 file)      │
│   schema = exactly database/schema.sql                   │
└──────────────────────────────────────────────────────────┘

External: OpenAI (or Mistral/Groq) for field mapping, summaries, chat
Libraries: pandas, openpyxl, pdfplumber, scikit-learn, statsmodels
           (prophet optional), reportlab (PDF), xlsxwriter (Excel)
```

Why this stack:

- **FastAPI + SQLite** = zero deployment friction, works on a laptop during the demo, scales conceptually to Postgres in 1 line of config.
- **Python** is mandatory for the AI / ingestion story; trying to do this in pure Node will bite you.
- **Multi-tenant** = every table already has `institution_id`. Tenancy is enforced in a single `apply_tenant_scope(query, user)` helper on the backend. That's your scalability proof.

---

## 3. The 4-Day Plan (Parallel Tracks)

Split the team into 3 tracks. They work in parallel after a 2–3-hour kickoff.

### Day 0 — Kickoff (2–3 hours, full team)

- [ ] Lock the 7-beat demo storyline (above) and post it on a wall
- [ ] Choose the LLM provider + get API keys
- [ ] Choose the 6 KPIs you will compute for real (recommended below)
- [ ] Decide the 30+ institution dataset shape
- [ ] Create the FastAPI repo skeleton next to the existing frontend (monorepo: `frontend/`, `backend/`)
- [ ] Move existing code into `frontend/`, add `backend/` with `app/main.py`, `app/db.py`, `app/models.py`, `app/routers/*.py`

**The 6 KPIs you will compute end-to-end** (don't expand this list):

1. Success rate (academic)
2. Dropout rate (academic) — your "AI hero" KPI
3. Attendance rate (academic)
4. Budget execution rate (finance)
5. Cost per student (finance)
6. Employability rate (employment)

Everything else (ESG, HR, Research, Infra, Inventory) appears as **read-only "process tiles"** populated from seed data so the dashboard *looks* complete (the brief asks you to *cover* all processes, not compute them all).

---

### Day 1 — Foundation + Ingestion (P0)

#### Track A — Backend + DB (1 person)

- [ ] `pip install fastapi uvicorn sqlalchemy pydantic python-multipart pandas openpyxl pdfplumber python-jose[cryptography] passlib[bcrypt]`
- [ ] Wire SQLAlchemy models from `database/schema.sql` (already exists — translate 1:1)
- [ ] `POST /auth/login` returning JWT with `{user_id, role, institution_id}`
- [ ] Tenancy helper: every query goes through `apply_tenant_scope(query, user)` — UCAR admin sees all, others scoped to `institution_id`
- [ ] Seed script: load `database/seed.sql` *plus* generated data for 30 institutions (script in §5)
- [ ] `GET /dashboard/ucar`, `GET /dashboard/institution/{id}`, `GET /dashboard/student/{id}` — return exactly the shapes already in `src/types.ts` (`UcarDashboardView`, etc.) so the frontend wires up in minutes

#### Track B — Ingestion + AI Mapping (1 person)

- [ ] `POST /upload` accepts `.xlsx` / `.csv` / `.pdf` + `institution_id` + `domain`
- [ ] Parsers:
  - Excel/CSV → pandas DataFrame
  - PDF → `pdfplumber` extract tables, fallback to text
- [ ] `POST /map` — AI field mapping endpoint:
  - Input: column headers + 3 sample rows + the target schema (e.g. `academic_kpis`)
  - Output: JSON `{ "Nbr Etud": "student_count", "Taux réussite": "success_rate", ..., "_unmapped": [...] }`
  - Use this prompt pattern (it works reliably):

```python
SYSTEM = """You are a data integration expert for a Tunisian university.
Map source columns to a canonical schema. Reply ONLY with JSON.
Canonical fields: {schema_fields_with_descriptions}
Rules:
- Match by meaning, not exact name. French/Arabic/English are all valid sources.
- If unsure (<70% confidence), put the column under "_unmapped".
- Never invent fields not in the canonical list.
"""
USER = """Source columns: {columns}
Sample rows: {head_3_rows_as_csv}
Return JSON: { "<source_col>": "<canonical_field|null>", ..., "_unmapped": [...] }
"""
```

- [ ] Confidence score per mapping = 1.0 if exact match, else LLM self-reported, else 0.5 default
- [ ] After user confirms mapping in the UI → upsert rows into the right table tagged with `uploaded_files.id`

#### Track C — Frontend Wiring + Upload UI (1 person)

- [ ] Replace mock fetches in dashboard pages with a small `src/lib/api.ts` (fetch + JWT in header)
- [ ] Replace `src/auth/AuthContext.tsx` localStorage-only flow with real login against `/auth/login`, but **keep the role-picker as a "demo mode" shortcut** for the pitch (toggle in `.env`)
- [ ] Build the **Data Import** page (currently a `FutureModulePage`):
  - Drop zone → uploads file → shows mapping table (source col → canonical field dropdown, prefilled by AI, confidence pill, "needs review" badge)
  - "Confirm import" button → POST `/import/commit`
- [ ] Add a global toast component for errors / success

**End of Day 1 success criterion:** A judge can upload an Excel file you've never seen and the AI proposes a correct mapping you can confirm, and that data appears in the institution dashboard.

---

### Day 2 — KPI Engine + AI Layer (P0)

#### Track A — KPI Engine + Anomaly Detection

- [ ] `app/services/kpi.py` — pure functions: `compute_success_rate(institution_id, period_id)` etc. Materialize results into `kpi_snapshots` so dashboards stay fast.
- [ ] `app/services/anomaly.py` — for each (institution, KPI, period):
  - **Trend signal**: z-score of latest value vs that institution's last 4 periods
  - **Peer signal**: z-score of latest value vs all other institutions' latest
  - Flag as `high` if `|z_trend| > 2` AND `|z_peer| > 1.5`, `medium` if either crosses, else none
  - Persist into `risk_alerts` with auto-generated `explanation` (templated string + LLM polish)
- [ ] Endpoint: `GET /alerts?scope=ucar|institution&id=...`

Why z-score + peer comparison: judges instantly understand it, it's explainable, it works on tiny data, and it scales to 30+ institutions trivially.

#### Track B — Forecasting + Executive Summary

- [ ] `app/services/forecast.py` — for `dropout_rate` and `budget_execution_rate`:
  - Use simple **Holt-Winters** from `statsmodels` (5 lines of code) on the last 4–8 periods. Forecast 2 periods ahead with confidence interval.
  - If you have ≥6 periods and want polish: swap in `prophet` later. Don't start with it.
- [ ] `POST /summary` — LLM call. Input = structured JSON of `{kpis, alerts, forecast}`. Output = ≤120 words, plain language, structured as:
  > **What's happening**: …
  > **Why it matters**: …
  > **Recommended action**: …

Prompt skeleton (reuse for all summaries):

```python
SYSTEM = """You are a strategic advisor to the President of the University of Carthage.
Write concise, neutral, decision-ready briefings in plain language.
NEVER invent numbers. Cite the metric and the comparison ("vs last semester", "vs peer median").
Output: 3 short paragraphs labeled exactly: "What's happening", "Why it matters", "Recommended action"."""
USER = """Period: {period}
Institution: {name} ({short_name}, {region})
KPIs (current vs previous vs peer median): {kpi_block}
Active alerts: {alerts_block}
Forecast (next 2 periods, with 80% interval): {forecast_block}
"""
```

#### Track C — Dashboards Polish + Forecast UI

- [ ] Drop a charting lib: `npm i recharts` (no extra config with Vite)
- [ ] Add to `UcarAdminDashboard`: a comparison bar chart (success rate by institution) + a "Top 3 risks" panel pulling from `/alerts?scope=ucar`
- [ ] Add to `InstitutionDashboard`: a trend line chart per KPI + a forecast overlay (dashed line, shaded interval)
- [ ] Add an "AI Briefing" card on every dashboard that calls `/summary` and renders the 3-paragraph output. Show a "Why these conclusions?" expandable that lists the raw KPIs the LLM saw — this is your **explainability win**.

**End of Day 2 success criterion:** The institution dashboard shows real KPIs computed from the SQLite DB, an alert with a real z-score reason, a forecast chart, and an LLM-written briefing that is *visibly grounded* in the numbers above it.

---

### Day 3 — Chatbot + Reports + Student View (P1)

#### Track A — "Ask UCAR" NL Chatbot (Track 3 differentiator)

This is what most teams won't build, and it instantly proves Track 3 ground covered too.

Two implementation options — pick **B** unless you have an LLM expert:

- **Option A (impressive but risky)**: NL→SQL with function calling. Use OpenAI's structured outputs. Provide schema in system prompt. Validate generated SQL against an allow-list before executing.
- **Option B (safer, judges can't tell the difference)**: Predefined "skills" (Python functions) exposed via OpenAI function-calling:
  - `compare_institutions(metric, top_n, order)`
  - `flag_outliers(metric, period)`
  - `trend(institution_id, metric, periods)`
  - `summary(scope, id, period)`
  - LLM picks the right function from the user's question, fills params, you execute it, return a table + a 1-sentence narration

Acceptance: the chatbot must answer these 3 demo questions correctly and reproducibly:

- "Which 3 institutions had the worst dropout this semester?"
- "Show me institutions where budget execution dropped while costs rose."
- "Which institution should leadership visit first this month and why?"

Pre-test these on stage and lock the demo questions.

#### Track B — Report Export

- [ ] `GET /reports/ucar.pdf?period=...` — `reportlab` template:
  - Cover page with UCAR logo, period
  - 1-page exec summary (LLM output)
  - KPI table across institutions
  - Alerts table
  - Forecast charts (render with matplotlib, embed as PNG)
- [ ] `GET /reports/ucar.xlsx` — `xlsxwriter`, one sheet per KPI domain
- [ ] Same for institution-scoped report
- [ ] Frontend: "Generate Report" buttons trigger download

#### Track C — Student Dashboard Upgrade + Polish

- [ ] Connect existing `StudentDashboard` to real endpoints
- [ ] Add an "AI Guidance" panel: explainable risk score breakdown (attendance contribution X%, grades Y%, repetition Z%) with a tiny horizontal bar — this is what scores you the **explainable AI** point in the rubric
- [ ] Replace `FutureModulePage` for `/student/ai-guidance` with the recommendations + chat (scoped to student's own data)

**End of Day 3 success criterion:** All 7 demo beats run end-to-end on one machine without console errors.

---

### Day 4 — Demo Hardening + Pitch (P0 — non-negotiable)

#### Morning — Hardening

- [ ] **Demo dataset freeze.** Re-seed the DB so:
  - Exactly 30 institutions
  - 6 reporting periods of history (so trends look real)
  - **3 deliberate stories**: 1 institution with rising dropout (INSAT), 1 with budget under-utilization, 1 with stable strong performance
  - 1 student per high-risk institution explicitly seeded as at-risk
- [ ] Pre-prepare 2 "messy" Excel files for the live upload demo (one with French headers, one with mixed English/Arabic). Test the AI mapping on them 5 times in a row.
- [ ] Hardcode a fallback path: if the LLM call fails on stage, return a cached response. Wrap every LLM call in `try/except` → cached JSON. Judges will *never know* and you sleep at night.
- [ ] Lighthouse-check the dashboard pages, fix anything below 80.
- [ ] Add loading skeletons everywhere — perceived performance is part of usability scoring.

#### Afternoon — Pitch (5–7 min)

Use this exact structure (it maps 1:1 to the rubric):

| Time | Section | Maps to |
|------|---------|---------|
| 0:00–0:45 | **Problem**: 30+ institutions, no central system, decisions made on stale Excel | Impact |
| 0:45–1:15 | **Solution in one slide**: the 7-beat narrative as a diagram | — |
| 1:15–4:30 | **Live demo** of the 7 beats | Innovation, Usability |
| 4:30–5:15 | **Architecture slide**: multi-tenant, unified schema, explainable AI pipeline | Scalability, Feasibility |
| 5:15–6:00 | **Roadmap**: how to deploy across all 30 UCAR institutions in 6 months | Feasibility, Scalability |
| 6:00–6:30 | **Why us / why now**: Tunisian context, no infra rewrite required | Feasibility |
| 6:30–7:00 | **Close + Q&A invite** | — |

Rules for the demo:

- One person clicks, one person narrates. Never both.
- Network is the enemy. Run everything on `localhost`. Have the LLM responses cached as a fallback.
- Have screenshots of every screen on a backup slide deck — if the laptop dies, you finish on slides.

---

## 4. Concrete File / Code Changes

Reorganize:

```
Hackathon-2026/
├── frontend/                    ← move current src/, public/, vite config here
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── db.py                ← SQLAlchemy session
│   │   ├── models.py            ← from database/schema.sql
│   │   ├── auth.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── upload.py
│   │   │   ├── mapping.py
│   │   │   ├── dashboards.py
│   │   │   ├── alerts.py
│   │   │   ├── forecast.py
│   │   │   ├── summary.py
│   │   │   ├── chat.py
│   │   │   └── reports.py
│   │   ├── services/
│   │   │   ├── kpi.py
│   │   │   ├── anomaly.py
│   │   │   ├── forecast.py
│   │   │   ├── llm.py           ← single LLM client wrapper w/ caching
│   │   │   └── tenant.py        ← apply_tenant_scope()
│   │   └── seed/
│   │       ├── generate.py      ← creates 30 institutions × 6 periods
│   │       └── messy_uploads/   ← demo files for live upload
│   ├── requirements.txt
│   └── ucar.db                  ← SQLite, gitignored
├── database/                    ← keep existing schema.sql + seed.sql as canonical
├── README.md                    ← rewrite for judges (see §6)
└── docker-compose.yml           ← optional but huge feasibility win (1 file)
```

Frontend changes (in priority order):

1. `src/lib/api.ts` — fetch wrapper with JWT
2. Replace `src/data/mockData.ts` selectors with `api.getUcarDashboard()` etc. **Keep the file** as a typed fallback for offline demo mode.
3. Replace `FutureModulePage` for these routes (and remove `future:true` from sidebar):
   - `/admin/data-import`, `/institution/data-import` → `<DataImportPage/>`
   - `/admin/kpi-comparison` → `<KpiComparisonPage/>` (recharts)
   - `/admin/risk-monitoring` → `<RiskMonitoringPage/>` (alert table + filters)
   - `/student/ai-guidance` → `<AiGuidancePage/>`
4. Add a floating "Ask UCAR" chat button on every admin shell (right corner). One component, used everywhere.
5. Add a `<BriefingCard/>` component used on all 3 dashboards — your explainability hero.

---

## 5. Demo Dataset — The Secret Weapon

Most teams demo on 3 institutions. Demo on **30** and you immediately win Scalability and Impact perception.

Write `backend/app/seed/generate.py`:

- 30 institutions across Tunisian regions (Tunis, Ariana, Nabeul, Bizerte, Sfax, Sousse, …) with realistic short names
- 6 reporting periods: S1 2024 → S2 2026
- For each (institution, period, KPI) generate values with:
  - A baseline mean per KPI (e.g. `success_rate` ~ 78)
  - A small per-institution offset (Gaussian)
  - A small temporal drift
  - **Inject 3 deliberate anomalies**:
    - INSAT: dropout drifts +1.2 pts/period starting S2 2025 → triggers your hero alert
    - "FSEG Mahdia": budget execution drops from 82 → 54 in S2 2026
    - "ENIS": stable strong performer (your "good" reference)
- 90 students total, 3 per institution; one explicitly at-risk per anomalous institution

Acceptance: re-running `python -m app.seed.generate` must produce identical data (`random.seed(42)`).

---

## 6. README Rewrite (judges read this first)

Replace the README with a judge-optimized version. Structure:

1. **One-paragraph pitch** (the bold sentence in §1)
2. **Architecture diagram** (the ASCII one in §2)
3. **The 7-beat demo flow** (with 7 screenshots)
4. **AI feature stack** (5 features, 1 line each, with the prompt for each)
5. **Multi-tenant proof**: link to `services/tenant.py` and show the 8-line function
6. **How to run** (`docker compose up` ideally — one command)
7. **Roadmap to 30+ live institutions** (the slide content above)

Two diagrams beat ten paragraphs. Make them.

---

## 7. Judging Criteria → Feature Map

| Criterion | What scores points | Where in your build |
|---|---|---|
| **Impact** | Solves real fragmentation; covers all 30 institutions; covers all listed processes | 30-institution dataset; "process tiles" for all 14 domains even if some are read-only |
| **Innovation (AI depth)** | AI in **input, analysis, output** — not just a chatbot | Field mapping (input) + anomaly + forecast (analysis) + summary + chat + reports (output). 5 distinct AI surfaces. |
| **Usability** | Non-technical staff can use it; plain language | One-click mapping confirm; plain-language briefings; floating chat; PDF export; toast feedback |
| **Scalability** | Handles 30+ institutions without degradation | Multi-tenant filter; KPI snapshot table for fast reads; live demo with 30 institutions; Postgres-ready (1 line) |
| **Feasibility** | Realistic for Tunisian universities | Works with their actual reality (Excel/PDF); supports French/Arabic columns in mapping; runs on a laptop; Docker compose; no infra rewrite required |

If a feature doesn't tick at least one column → cut it.

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| LLM call fails / slow on stage | Cache every LLM response keyed by input hash; fall back automatically. Never call live during the live demo if you can avoid it — pre-warm on app start. |
| AI mapping fails on judge's surprise file | Pre-prepare 2 "messy" files yourself; demo those. If a judge insists on their file, route to mapping UI where they can hand-correct — that's still a feature win. |
| Forecast looks wrong | Always show confidence interval; explicitly label "indicative trend" not "prediction". |
| Dashboard looks empty (data sparse) | Seed at least 6 periods. Use clear empty-state copy on any panel without data. |
| Backend too slow with 30 institutions | Pre-compute KPI snapshots on seed; never compute on request. |
| Team scope creep | Print the 7-beat storyline. If a feature isn't in it, defer to "roadmap slide". |
| Login / JWT eats half a day | Keep the localStorage role picker as `?demo=1` mode. JWT is "real" mode behind a feature flag. |
| No internet / API down at venue | Local fallback: Ollama + Llama 3.1 8B for mapping + summary; rules-only for chatbot. Test once on Day 3. |

---

## 9. What NOT to Build

This is what kills hackathon teams.

- A real RBAC matrix beyond 3 roles
- A user signup / password reset flow
- A multi-language i18n setup (mock 1 French phrase in the AI mapping demo, that's enough)
- Real-time WebSockets / live updates
- A mobile app (the brief says "web and/or mobile" — pick web)
- A custom design system. Stick with current CSS + recharts.
- Fine-tuning your own model. Use a hosted LLM with prompts; that's the modern best practice and judges know it.
- Replacing existing university software. Position as a layer *on top of* their files, not a replacement.

---

## 10. Day-by-Day Checklist

Print this, tick boxes.

**Day 0 (today, ~3h)**

- [ ] Lock the 7-beat storyline on a wall
- [ ] Get LLM API keys + test 1 call
- [ ] Reorganize repo into `frontend/` + `backend/`
- [ ] FastAPI hello world hitting SQLite

**Day 1 — Foundation (P0)**

- [ ] SQLAlchemy models + tenancy helper
- [ ] `/auth/login` + JWT
- [ ] Seed 30 institutions × 6 periods
- [ ] Wire dashboards to real endpoints
- [ ] Excel/CSV upload + AI field mapping working on 1 file

**Day 2 — Intelligence (P0)**

- [ ] KPI snapshot computation
- [ ] Anomaly detection with z-score + peer compare
- [ ] Forecast for dropout + budget execution
- [ ] LLM exec summary on every dashboard
- [ ] Trend + forecast charts via recharts

**Day 3 — Differentiators (P1)**

- [ ] "Ask UCAR" chatbot with 4 function-calling skills
- [ ] PDF + Excel report export
- [ ] Student dashboard explainable risk breakdown
- [ ] All `FutureModulePage`s replaced or removed from nav

**Day 4 — Win (P0)**

- [ ] Re-seed final demo dataset with 3 deliberate stories
- [ ] LLM response caching + fallbacks
- [ ] Loading skeletons + toasts everywhere
- [ ] Run the 7-beat demo end-to-end 5 times
- [ ] Backup screenshot deck
- [ ] Pitch script written + rehearsed twice
- [ ] README rewritten for judges
- [ ] `docker compose up` works on a clean machine

---

## 11. Suggested Execution Order

If you're starting work right now, follow this order — each step unlocks the next without blocking parallel work:

1. **A.** Reorganize the repo into `frontend/` + `backend/` and scaffold the FastAPI service with SQLAlchemy models, JWT auth, and the dashboard endpoints (so the existing UI keeps working but reads from a real DB).
2. **F.** Generate the 30-institution × 6-period demo dataset with the 3 deliberate anomaly stories.
3. **C.** Build the anomaly + forecast + LLM summary services and wire them into the dashboards (beats #3 and #4).
4. **B.** Build the AI field-mapping endpoint + Data Import page (the "wow" moment of beat #1).
5. **D.** Build the "Ask UCAR" chatbot with function calling (beat #5).
6. **E.** Build the PDF/Excel report export (beat #6).

Steps 1 + 2 unblock everything else. After that, B / C / D / E can run in parallel across the team.
