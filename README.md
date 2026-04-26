# UCAR Insight

> AI-powered central intelligence platform for the University of Carthage — turns fragmented institutional data into real-time KPIs, alerts, and decision-ready reports.

---

## What it is

UCAR groups 30+ institutions whose data is scattered across paper, Excel sheets, PDF reports, and disconnected tools. **UCAR Insight** centralizes that data into a single multi-tenant platform and gives every actor exactly the view they need:

- **UCAR leadership** — cross-institution KPIs, comparisons, alerts, and consolidated PDF reports.
- **Institution administrators** — institution-level dashboards, student rosters, KPI per domain (academic, finance, HR, research, infrastructure, partnerships), ISO certificates, and one-click PDF reports.
- **Students** — personal dashboard with grades, attendance, AI guidance, registration certificate (PDF), and personal performance report (PDF).

## Key features

- **Smart data import** — drop Excel, CSV, PDF, or scanned image files and the AI pipeline maps the columns/values to the unified KPI schema. Review and edit before committing.
- **Role-based dashboards** — three distinct experiences: UCAR admin, institution admin, student.
- **AI assessments** — explainable risk scoring, anomaly detection, forecasting, and natural-language summaries.
- **Student risk list** — automatic flagging of students at risk based on grades and attendance, ranked by composite score.
- **One-click PDF reports** — institution report, student report, and registration certificate all generate signed-looking PDFs directly in the browser.
- **Period-aware** — every dashboard, KPI, and report respects the active reporting period.
- **ISO certificate workspace** — track institutional ISO certifications and audit cycles.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · React Router |
| Backend | FastAPI · SQLAlchemy 2 · Pydantic v2 |
| Database | SQLite (default) · PostgreSQL ready |
| AI | Google Gemini (`google-genai`) |
| Auth | JWT (PyJWT) |
| PDF | jsPDF + jsPDF-AutoTable |

---

## Quick start

### Prerequisites

- **Python 3.12** (3.13 also works after the requirement bumps in this repo)
- **Node.js 18+**
- **Git**
- A **Google AI Studio API key** for Gemini ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone

```bash
git clone https://github.com/mhs3n/Hackathon-2026.git
cd Hackathon-2026
```

### 2. Backend

```bash
cd backend

# Create the virtual environment at the repo root
python -m venv ../.venv

# Activate it
# Windows (PowerShell):
..\.venv\Scripts\Activate.ps1
# macOS / Linux:
source ../.venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` and fill in at minimum:

```
UCAR_JWT_SECRET=any-random-secret-string
UCAR_GEMINI_API_KEY=your-gemini-api-key
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8001
```

The SQLite database (`ucar.db`) is created and seeded automatically on first run.

### 3. Frontend

In a **second terminal**:

```bash
cd frontend
cp .env.example .env     # already points to http://localhost:8001
npm install
npm run dev
```

Then open the URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)).

---

## Demo accounts

Password for all accounts: **`123456`**

| Email | Role |
|---|---|
| `owner@ucar.tn` | UCAR Admin |
| `insat@ucar.tn` | Institution Admin (INSAT) |
| `enstab@ucar.tn` | Institution Admin (ENSTAB) |
| `takwa.bouheni@enstab.ucar.tn` | Student |

---

## Production deployment

The repo includes a `docker-compose.yml` for the database service. For a real deployment you should:

1. Set strong values for `UCAR_JWT_SECRET` and `UCAR_GEMINI_API_KEY`.
2. Switch the SQLAlchemy URL to PostgreSQL (psycopg driver is already installed).
3. Build the frontend with `npm run build` and serve the `dist/` folder behind your reverse proxy.
4. Run the backend behind a process manager (e.g. `uvicorn` workers + a reverse proxy).
5. Restrict CORS in `backend/app/main.py` to your real frontend domain.

---

## Project structure

```
Hackathon-2026/
├── backend/        FastAPI app, models, AI pipeline, routers
├── frontend/       React + Vite SPA (UCAR / Institution / Student)
├── database/       Seed scripts and SQL helpers
├── samples/        Example import files (Excel, PDF, images)
├── docker-compose.yml
└── README.md
```

---

## Troubleshooting

- **`Failed to fetch` on login** — make sure the backend is running on port `8001` and `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8001`. Restart Vite after changing `.env`.
- **JWT / 401 errors** — ensure `UCAR_JWT_SECRET` is set, then clear browser localStorage and log in again.
- **`pandas` build fails on Windows / Python 3.13** — already handled in `requirements.txt`. If you forked the repo earlier, bump `pandas` to `2.2.3+`, `pydantic` to `2.9+`, and `psycopg[binary]` to `3.2.3+`.
- **Module not found on backend start** — re-activate the virtualenv and re-run `pip install -r requirements.txt`.

---

## License

Internal hackathon prototype for the University of Carthage. All rights reserved.
