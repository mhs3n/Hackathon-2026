# Running UCAR Insight locally

## Prerequisites

- Python 3.12+
- Node.js 18+

## 1. Clone

```bash
git clone https://github.com/mhs3n/Hackathon-2026.git
cd Hackathon-2026
```

## 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv ../.venv
source ../.venv/bin/activate      # Windows: ..\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your env file
cp .env.example .env
```

Open `backend/.env` and set at minimum:

```
UCAR_JWT_SECRET=any-random-secret-string
UCAR_GEMINI_API_KEY=your-key-from-aistudio.google.com
```

Then start the server:

```bash
uvicorn app.main:app --reload --port 8001
```

The database (`ucar.db`) is created and seeded automatically on first run.

## 3. Frontend

Open a new terminal:

```bash
cd frontend
cp .env.example .env   # already points to http://localhost:8001
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## 4. Login

Password for all accounts: **`123456`**

| Email | Role |
|---|---|
| `owner@ucar.tn` | UCAR Admin |
| `insat@ucar.tn` | Institution Admin |
| `takwa.bouheni@enstab.ucar.tn` | Student |

## Troubleshooting

**`Failed to fetch` on login**
- Make sure the backend is running on port `8001`
- Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8001`
- Restart the Vite dev server after any `.env` change

**JWT / 401 errors**
- Make sure `UCAR_JWT_SECRET` is set in `backend/.env`
- Clear your browser's localStorage and log in again
- Both backend and frontend must be running at the same time

**Module not found errors on backend start**
- Make sure your virtualenv is activated: `source ../.venv/bin/activate`
- Re-run `pip install -r requirements.txt`
