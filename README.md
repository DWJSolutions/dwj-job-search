# DWJ Job Search App

AI-powered job search engine. Returns **top 30 highest-paying, realistic jobs within 30 miles** — without excluding listings that don't list salary.

**Color Palette:** Navy Blue `#0D1B2A` · Mint Green `#00C9A7` · White `#FFFFFF`

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or a Supabase account)

### 2. Environment Setup
```bash
cp .env.example .env
# Fill in your API keys in .env
```

### 3. Database
```bash
psql $DATABASE_URL -f db/migrations/001_initial.sql
```

### 4. Install & Run — All 3 Services

**Frontend (Next.js — port 3000)**
```bash
cd frontend
npm install
npm run dev
```

**API Server (Node.js — port 3001)**
```bash
cd api
npm install
npm run dev
```

**AI Service (Python FastAPI — port 8000)**
```bash
cd ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Open the App
Visit http://localhost:3000

---

## API Keys Needed

| Service | URL | Cost |
|---------|-----|------|
| Adzuna | developer.adzuna.com | Free (250 req/day) |
| ZipRecruiter | ziprecruiter.com/partner | Free (approval required) |
| USAJOBS | developer.usajobs.gov | Free |
| OpenAI | platform.openai.com | ~$0.005/search |

---

## Architecture

```
Next.js (3000) → Node.js API (3001) → Python AI (8000)
                                    → Adzuna API
                                    → ZipRecruiter API
                                    → USAJOBS API
                      → PostgreSQL
```

## Features
- Resume parsing via GPT-4o
- Salary estimation for jobs with no listed pay
- Cross-source deduplication
- 30-mile radius filtering (haversine)
- Skill gap analysis on top 10 results
- Navy/Mint/White UI with match score rings
