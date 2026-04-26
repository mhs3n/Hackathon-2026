<div align="center">

<img src="frontend/public/assets/ucar-logo.png" alt="UCAR Insight" width="120" />

# UCAR Insight

### *The intelligence layer for the University of Carthage*

**Centralize institutional data · Surface real-time KPIs · Generate decision-ready reports — powered by AI.**

[![Status](https://img.shields.io/badge/status-active-22c55e?style=flat-square)](#)
[![Python](https://img.shields.io/badge/python-3.12%2B-3776AB?style=flat-square&logo=python&logoColor=white)](#)
[![Node](https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![License](https://img.shields.io/badge/license-Internal-1d63d1?style=flat-square)](#)

</div>

---

## Why UCAR Insight

The University of Carthage federates **30+ institutions** whose data lives in paper files, spreadsheets, PDFs, and disconnected tools. The cost is real: duplicated work, slow reporting, blind decisions.

**UCAR Insight** is a multi-tenant intelligence platform that ingests this fragmented data, turns it into a unified model, and serves it back as live KPIs, AI insights, and signed reports — to the right person, at the right time.

> One platform. Three roles. Zero spreadsheet chaos.

---

## What you get

###  For UCAR leadership

- Cross-institution dashboard with comparable KPIs across all 30+ entities.
- AI-generated alerts on anomalies, dropouts, budget execution, and risk hotspots.
- One-click consolidated PDF reports across any reporting period.

###  For institution administrators

- Institution-level dashboard with academic, finance, HR, research, infrastructure, and partnership KPIs.
- Student rosters per academic level (1st / 2nd / 3rd / Master) with at-risk flags.
- Dedicated **Student Risk List** ranked by composite risk score.
- **Smart Data Import** — drag and drop Excel, CSV, PDF, or scanned images; the AI maps fields automatically and lets you review before commit.
- **Generate Institution Report** — one click, full PDF with KPIs, AI assessment, and at-risk students.
- ISO certificate workspace.

###  For students

- Personal dashboard: grades, attendance, engagement, wellness, skills, AI guidance.
- **Registration Certificate** — official PDF, instant download.
- **My Report** — personal performance PDF with risk explanation and recommendations.

---

## Capabilities at a glance

| Capability | Description |
|---|---|
|  **Smart ingestion** | Excel · CSV · PDF · scanned images · OCR + AI field mapping |
|  **Unified data model** | Single schema across all institutions and reporting periods |
|  **Live dashboards** | Period-aware KPI cards, charts, drill-downs |
|  **AI assessments** | Explainable risk scoring, anomaly detection, summaries |
|  **PDF reports** | UCAR · Institution · Student · Registration certificate |
|  **Risk monitoring** | Auto-flags students below grade or attendance thresholds |
|  **Multi-tenant** | Strict role + institution scoping baked into the API |
|  **Secure auth** | JWT-based, role-aware routing |

---

## Built with

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · React Router · jsPDF |
| Backend | FastAPI · SQLAlchemy 2 · Pydantic v2 · PyJWT |
| Database | SQLite (default) · PostgreSQL ready (psycopg 3) |
| AI | Google Gemini via `google-genai` |
| Tooling | Docker Compose · ESLint · TypeScript strict mode |

---

## Get started in 5 minutes

### Prerequisites

- **Python** 3.12+ (3.13 supported)
- **Node.js** 18+
- **Git**
- A **Google AI Studio** API key — [get one here](https://aistudio.google.com)

### 1 · Clone

```bash
git clone https://github.com/mhs3n/Hackathon-2026.git
cd Hackathon-2026
```

### 2 · Start the API

```bash
cd backend

# Create a venv at the repo root
python -m venv ../.venv

# Activate it
#   Windows (PowerShell)
..\.venv\Scripts\Activate.ps1
#   macOS / Linux
source ../.venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

In `backend/.env`, set:

```env
UCAR_JWT_SECRET=any-strong-random-string
UCAR_GEMINI_API_KEY=your-gemini-api-key
```

Run it:

```bash
uvicorn app.main:app --reload --port 8001
```

> The SQLite database (`ucar.db`) is created and seeded automatically on first run.

### 3 · Start the web app

In a **second terminal**:

```bash
cd frontend
cp .env.example .env     # already points to http://localhost:8001
npm install
npm run dev
```

Open the URL Vite prints — usually [http://localhost:5173](http://localhost:5173).

---

## Demo accounts

> Password for **all** demo accounts: `123456`

| Role | Email |
|---|---|
|  UCAR Admin | `owner@ucar.tn` |
|  Institution Admin (INSAT) | `insat@ucar.tn` |
|  Institution Admin (ENSTAB) | `enstab@ucar.tn` |
|  Student | `takwa.bouheni@enstab.ucar.tn` |

---

## Going to production

1. **Secrets** — set strong values for `UCAR_JWT_SECRET` and `UCAR_GEMINI_API_KEY`. Never commit `.env`.
2. **Database** — switch the SQLAlchemy URL to PostgreSQL; the psycopg 3 driver ships with the backend.
3. **Frontend** — `npm run build` produces a static `dist/` folder. Serve it from your CDN or reverse proxy.
4. **Backend** — run `uvicorn` with multiple workers (or behind Gunicorn) and front it with Nginx / Caddy.
5. **CORS** — restrict the allowed origins in `backend/app/main.py` to your production domain.
6. **Backups** — schedule periodic dumps of the database and snapshot the `samples/` import history.

A `docker-compose.yml` is provided as a starting point.

---

## Repository layout

```
Hackathon-2026/
├── backend/        FastAPI app · models · AI pipeline · routers
├── frontend/       React + Vite SPA (UCAR · Institution · Student)
├── database/       Seed scripts and SQL helpers
├── samples/        Example import files (Excel · PDF · images)
├── docker-compose.yml
└── README.md
```

---

## Troubleshooting

<details>
<summary><strong>Failed to fetch on login</strong></summary>

- Make sure the backend is running on port `8001`.
- Verify `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8001`.
- Restart Vite after editing `.env`.
</details>

<details>
<summary><strong>JWT / 401 errors</strong></summary>

- Confirm `UCAR_JWT_SECRET` is set in `backend/.env`.
- Clear browser localStorage and log in again.
</details>

<details>
<summary><strong>pandas build fails on Windows / Python 3.13</strong></summary>

Already pinned in `requirements.txt`. If you forked early, bump:
- `pandas>=2.2.3`
- `pydantic>=2.9.2`
- `psycopg[binary]>=3.2.3`
</details>

<details>
<summary><strong>Module not found on backend start</strong></summary>

Re-activate the virtualenv and re-run `pip install -r requirements.txt`.
</details>

---

## Roadmap

- [ ]  Real-time notifications and email digests for critical alerts.
- [ ]  Multi-period benchmarking with year-over-year comparisons.
- [ ]  Public verification portal for issued PDF certificates.
- [ ]  Predictive forecasting on dropout and budget execution.
- [ ]  Mobile-first companion app for institution heads.

---

<div align="center">

**Built for the University of Carthage.**
*Internal prototype — all rights reserved.*

</div>
