# जुन्नर लग्न मंडळ — Junnar Lagna Mandal

A full-stack matrimony web application for the Marathi community of Junnar Taluka, Pune.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 18 + Vite, React Router v6, Tailwind CSS |
| Backend    | Python 3.11+, FastAPI, Uvicorn |
| Database   | Supabase (PostgreSQL) with Row Level Security |
| Auth       | Supabase Auth (email/password + email verification) |
| Storage    | Supabase Storage (profile photos) |
| Deployment | Vercel (frontend) · Render (backend) · Supabase (DB/auth/storage) |

---

## Project Structure

```
MarathiJunnerLaganaMandal/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # All page components
│   │   ├── components/# Reusable UI components
│   │   ├── contexts/  # AuthContext (Supabase + API)
│   │   └── services/  # Axios API client
│   ├── vercel.json
│   └── .env.example
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── routers/   # auth, profiles, search, matches, interests, messages, admin
│   │   ├── models/    # Pydantic schemas
│   │   ├── auth.py    # JWT dependency
│   │   ├── config.py  # Settings (pydantic-settings)
│   │   └── database.py# Supabase clients
│   ├── main.py
│   ├── requirements.txt
│   ├── render.yaml
│   └── .env.example
└── database/
    └── 001_initial_schema.sql  # Full schema + RLS policies
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- A free [Supabase](https://supabase.com) project

### 1. Set up Supabase

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com).
2. Go to **SQL Editor** → run the full contents of `database/001_initial_schema.sql`.
3. Go to **Storage** → create a bucket named **`profile-photos`** (set to private).
4. In the Storage bucket, add these **policies** (via Dashboard > Storage > Policies):
   - **SELECT**: `(bucket_id = 'profile-photos')` — authenticated users can read
   - **INSERT**: `(bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])` — users can only upload to their own folder
   - **DELETE**: same pattern as INSERT
5. Copy your project's **URL**, **anon key**, **service-role key**, and **JWT secret** (Settings → API).

### 2. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your Supabase credentials

uvicorn main:app --reload
```

API runs at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key
#   VITE_API_URL=http://localhost:8000

npm run dev
```

App runs at **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only; never expose to browser) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase Settings → API |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `APP_ENV` | `development` or `production` |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `VITE_API_URL` | FastAPI backend URL |

---

## Deployment

### Supabase (Database + Auth + Storage)

Already hosted — nothing to deploy. Use the same project for all environments or create separate projects for staging/production.

### Backend → Render

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo.
3. Set **Root Directory** to `backend`.
4. Render auto-detects `render.yaml`; fill in the env var values in the Render dashboard.
5. Deploy. Your API URL will be `https://your-service.onrender.com`.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Set **Framework** to `Vite`, **Root Directory** to `frontend`.
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` → your Render backend URL
4. Deploy. Vercel handles the SPA rewrite via `vercel.json`.
5. Copy the Vercel URL and update `CORS_ORIGINS` in the Render backend env vars.

---

## Core Features

| Feature | Status |
|---------|--------|
| Email/password signup + login | ✅ |
| Email verification (Supabase) | ✅ |
| Password reset via email | ✅ |
| Full profile creation & editing | ✅ |
| Multi-photo upload with privacy toggle | ✅ |
| Partner preference settings | ✅ |
| Profile search with filters & pagination | ✅ |
| Compatibility match score (Python engine) | ✅ |
| Send / accept / decline interest | ✅ |
| Shortlist / favorites | ✅ |
| One-to-one messaging (matched users only) | ✅ |
| Block & report users | ✅ |
| Admin profile approval queue | ✅ |
| Admin user management | ✅ |
| Admin report resolution | ✅ |
| Row Level Security on all tables | ✅ |
| Mobile-responsive UI | ✅ |

---

## Making Your First Admin

After creating an account, run this SQL in the Supabase SQL Editor (replace with your user's UUID):

```sql
UPDATE public.users SET is_admin = TRUE WHERE id = 'your-user-uuid-here';
```

You can find your UUID in **Authentication → Users** in the Supabase dashboard.

---

## Security Notes

- Service-role key is **only used server-side** in the FastAPI backend; it is never sent to the browser.
- Contact details (phone, email) are only revealed after mutual interest is accepted — enforced at the API layer.
- Photo privacy is enforced at both the API layer and Supabase RLS.
- All API endpoints require a valid Supabase JWT (verified via `python-jose`).
- Admin endpoints require `is_admin = TRUE` in the users table.
- All user input is validated by Pydantic on the backend.

---

## API Documentation

FastAPI generates interactive docs automatically:
- **Swagger UI**: `https://your-api.onrender.com/docs`
- **ReDoc**: `https://your-api.onrender.com/redoc`
