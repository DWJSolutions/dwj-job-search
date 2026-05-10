# DWJ Job Search App - Execute Now: GitHub & Deployment Setup

Follow these exact steps in order. Copy and paste each command into your Terminal.

---

## STEP 1: Copy Configuration Files to Your Project

These files are in your DWJ JOBS folder. Copy them to your project:

```bash
cp /Volumes/Crucial/DWJ\ JOBS/.gitignore /Volumes/Crucial/DWJ\ JOBS/dwj-job-search/
cp /Volumes/Crucial/DWJ\ JOBS/.env.example /Volumes/Crucial/DWJ\ JOBS/dwj-job-search/
mkdir -p /Volumes/Crucial/DWJ\ JOBS/dwj-job-search/.github/workflows
cp /Volumes/Crucial/DWJ\ JOBS/deploy.yml /Volumes/Crucial/DWJ\ JOBS/dwj-job-search/.github/workflows/
```

---

## STEP 2: Navigate to Your Project

```bash
cd /Volumes/Crucial/DWJ\ JOBS/dwj-job-search
pwd  # Verify you're in the right directory
```

---

## STEP 3: Check Current Git Status

```bash
# Check if git is initialized
git status

# If you get "fatal: not a git repository", run:
git init
```

---

## STEP 4: Create Your Local .env File

**IMPORTANT**: This file should NEVER be committed to GitHub. It's only for local testing.

```bash
# Copy the example
cp .env.example .env

# Then edit .env and fill in your actual API keys:
# - OPENAI_API_KEY
# - ADZUNA_APP_ID and ADZUNA_APP_KEY
# - ZIPRECRUITER_API_KEY
# - USAJOBS_API_KEY and USAJOBS_USER_AGENT
# - DATABASE_URL (local PostgreSQL or Supabase)
```

Use your favorite editor (nano, vi, or open in Finder):
```bash
nano .env
# Or
open -a "TextEdit" .env
```

---

## STEP 5: Commit All Files to Git

```bash
# Add all files
git add .

# Check what's being added (should NOT include .env)
git status

# Commit
git commit -m "Initial commit: DWJ Job Search App with frontend, API, and AI services"

# View your commit
git log --oneline -1
```

---

## STEP 6: Connect to GitHub

**If you haven't already created the remote:**

```bash
# Add your GitHub repository as origin
# Replace USERNAME with your GitHub username
git remote add origin https://github.com/DWJSolutions/dwj-job-search.git

# Verify the remote was added
git remote -v
# Should show:
# origin  https://github.com/DWJSolutions/dwj-job-search.git (fetch)
# origin  https://github.com/DWJSolutions/dwj-job-search.git (push)
```

**If the remote already exists:**

```bash
# Check existing remotes
git remote -v

# If it's wrong, remove and re-add
git remote remove origin
git remote add origin https://github.com/DWJSolutions/dwj-job-search.git
```

---

## STEP 7: Push to GitHub

```bash
# Push your main branch to GitHub
git push -u origin main

# If you get an error about 'main' vs 'master', run:
git branch -M main
git push -u origin main
```

**You may be asked for authentication:**
- Username: your GitHub username
- Password: use a Personal Access Token (not your GitHub password)
  - Generate here: https://github.com/settings/tokens
  - Scopes needed: `repo` (full control of private repositories)

---

## STEP 8: Verify GitHub Repo is Updated

```bash
# Check that your local branch is up to date
git status
# Should show: "On branch main" "nothing to commit, working tree clean"

# View your commits
git log --oneline -5

# Verify the remote
git remote -v
```

Then visit: https://github.com/DWJSolutions/dwj-job-search

You should see:
- ✅ All your folders (frontend, api, ai, db)
- ✅ README.md
- ✅ .gitignore
- ✅ .env.example (with NO actual secrets!)
- ✅ .github/workflows/deploy.yml
- ✅ Your commit history

---

## STEP 9: Deploy to Supabase (Database)

### Create Supabase Project
1. Go to https://supabase.com
2. Sign up / Log in
3. Create new project
4. Wait for initialization
5. Copy your "Connection String" from Project Settings → Database

### Get Your Database URL
```bash
# The connection string looks like:
# postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Add it to your .env file:
nano .env
# Update: DATABASE_URL=postgresql://...
```

### Run Database Migration
```bash
# Using psql (requires PostgreSQL client installed)
psql "$DATABASE_URL" -f db/migrations/001_initial.sql

# Or use Supabase SQL Editor:
# 1. Open your Supabase project
# 2. Go to SQL Editor
# 3. Create new query
# 4. Copy contents of db/migrations/001_initial.sql
# 5. Run
```

---

## STEP 10: Deploy Frontend to Vercel

### Connect GitHub to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Select GitHub account
5. Find and import `dwj-job-search`
6. Click "Import"

### Configure Vercel
- Set "Root Directory" to `frontend/`
- Build Command: `npm run build`
- Install Command: `npm install`
- Click "Deploy"

### Note Your Vercel URL
- After deployment, note your URL (e.g., `https://dwj-job-search.vercel.app`)
- Copy this as `NEXT_PUBLIC_API_URL` for later

---

## STEP 11: Deploy API to Render

### Create Render Web Service
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your GitHub account and `dwj-job-search` repo

### Configure API Service
- **Name**: `dwj-api`
- **Root Directory**: `api/`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm run start` or `node index.js`
- **Plan**: Free

### Add Environment Variables in Render
Go to Environment tab and add:
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
ZIPRECRUITER_API_KEY=...
USAJOBS_API_KEY=...
USAJOBS_USER_AGENT=Mozilla/5.0...
PYTHON_SERVICE_URL=https://your-ai-service.onrender.com
```

### Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your URL (e.g., `https://dwj-api.onrender.com`)

---

## STEP 12: Deploy AI Service to Render

### Create Another Render Web Service
1. In Render dashboard, click "New +" → "Web Service"
2. Select your GitHub account and `dwj-job-search` repo

### Configure AI Service
- **Name**: `dwj-ai`
- **Root Directory**: `ai/`
- **Runtime**: `Python 3.11`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
- **Plan**: Free

### Add Environment Variables
```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

### Deploy
- Click "Create Web Service"
- Wait for deployment
- Note your URL (e.g., `https://dwj-ai.onrender.com`)

---

## STEP 13: Update Environment Variables in All Platforms

### Update Vercel
1. Go to your Vercel project settings
2. Environment Variables
3. Set: `NEXT_PUBLIC_API_URL=https://dwj-api.onrender.com`
4. Click Save & Redeploy

### Update Render API Service
1. Go to dwj-api service in Render
2. Settings → Environment
3. Set: `PYTHON_SERVICE_URL=https://dwj-ai.onrender.com`
4. Save (auto-redeployed)

---

## STEP 14: Test Everything

### Test Frontend
- Visit your Vercel URL
- Should load without errors

### Test API Health
```bash
curl https://dwj-api.onrender.com/health
```

### Test AI Service Health
```bash
curl https://dwj-ai.onrender.com/health
```

### Test Full Flow
1. Visit frontend
2. Upload a resume
3. Enter a ZIP code
4. Click search
5. Should return job results

---

## STEP 15: Monitor and Debug

### View Logs

**Vercel:**
- Dashboard → Deployments → Click deployment → Logs

**Render API:**
- Dashboard → dwj-api → Logs

**Render AI:**
- Dashboard → dwj-ai → Logs

### Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot connect to database" | Check DATABASE_URL format in .env |
| API returns 502 | Check Render logs, verify requirements.txt has all dependencies |
| Frontend can't reach API | Verify NEXT_PUBLIC_API_URL is set correctly in Vercel |
| Resume upload fails | Check file size limits and OPENAI_API_KEY is valid |

---

## STEP 16: Commit Your Deployment (Optional)

```bash
# If you made changes locally, commit them
git add .
git commit -m "Configure deployment settings and environment variables"
git push origin main

# This triggers automatic redeployment on all platforms!
```

---

## DONE! 🎉

Your DWJ Job Search App is now:
- ✅ On GitHub (https://github.com/DWJSolutions/dwj-job-search)
- ✅ Frontend live on Vercel
- ✅ API live on Render
- ✅ AI service live on Render
- ✅ Database on Supabase
- ✅ Fully deployed and accessible

### Next Steps
1. Share your Vercel URL with users
2. Monitor logs for errors
3. Update API keys quarterly
4. Scale up services if needed

---

## Quick Reference URLs

**GitHub**: https://github.com/DWJSolutions/dwj-job-search  
**Frontend**: `https://dwj-job-search.vercel.app` (your actual URL)  
**API**: `https://dwj-api.onrender.com` (your actual URL)  
**AI Service**: `https://dwj-ai.onrender.com` (your actual URL)  
**Supabase**: https://supabase.com (your project)  
**Render**: https://render.com (your services)  
**Vercel**: https://vercel.com (your project)  
