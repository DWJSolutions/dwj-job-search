# DWJ Job Search App

AI-powered job search app with three services:

- `frontend/`: Next.js UI on port `3000`
- `api/`: Express API on port `3001`
- `ai/`: FastAPI service on port `8000`

## What this repo does

The app:

- accepts a resume upload
- extracts profile data with OpenAI
- searches multiple job sources
- ranks and deduplicates results
- returns the top matches near the target ZIP code

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ or a Supabase Postgres database

## Setup

### 1. Create your environment file

```bash
cp .env.example .env
```

Fill in the required API keys before starting the app.

### 2. Configure the database

This repository is documented for PostgreSQL-based setup.

Set `DATABASE_URL` in `.env`, then run:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial.sql
```

### 3. Install dependencies

```bash
cd frontend
npm install

cd ../api
npm install

cd ../ai
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Run the services

Frontend:

```bash
cd frontend
npm run dev
```

API:

```bash
cd api
npm run dev
```

AI service:

```bash
cd ai
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Required for normal operation:

- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `ZIPRECRUITER_API_KEY`
- `USAJOBS_API_KEY`
- `USAJOBS_USER_AGENT`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `PYTHON_SERVICE_URL`
- `NEXT_PUBLIC_API_URL`

Optional:

- `OPENCAGE_API_KEY`
- `CAREERJET_AFFID`
- `THEMUSE_API_KEY`

## GitHub checklist

Before pushing this repo:

- keep `.env` out of version control
- keep `node_modules/`, `.next/`, logs, and virtualenvs ignored
- confirm the database migration runs cleanly
- store secrets in your deployment platform, not in the repo

## Deployment notes

- Frontend can be deployed to Vercel or any Node-compatible host
- API can run on Render, Railway, Fly.io, or another Node host
- AI service can run on Render, Railway, Fly.io, or another Python host
- PostgreSQL can be hosted on Supabase, Neon, Railway, or self-managed Postgres

## Current limitations

- The repository still depends on third-party job APIs and OpenAI, so it is independent from Lovable but not self-contained.
- The codebase includes a SQLite adapter, but this README does not treat SQLite as the supported setup path because the checked-in migration and documented flow are PostgreSQL-based.
