"""
DWJ Job Search — Python AI Service (FastAPI)
Handles: resume parsing, salary estimation, job ranking, gap analysis
"""

import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from parse_resume import parse_resume
from rank_jobs    import rank_jobs
from gap_analysis import analyze_gaps

app = FastAPI(title="DWJ AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class Profile(BaseModel):
    skills:           List[str] = []
    titles:           List[str] = []
    experience_years: int       = 0
    education:        str       = ""
    industries:       List[str] = []

class RankRequest(BaseModel):
    jobs:           List[dict]
    profile:        dict
    user_lat:       float
    user_lon:       float
    include_remote: bool = False

class GapRequest(BaseModel):
    profile: dict
    job:     dict

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "DWJ AI"}


@app.post("/parse-resume")
async def parse_resume_endpoint(resume: UploadFile = File(...)):
    """Parse an uploaded resume file and return structured profile."""
    allowed = ["application/pdf",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if resume.content_type not in allowed:
        raise HTTPException(400, "Unsupported file type. Send PDF or DOCX.")

    content = await resume.read()
    try:
        profile = parse_resume(content, resume.content_type)
        return profile
    except Exception as e:
        raise HTTPException(500, f"Resume parsing failed: {str(e)}")


@app.post("/rank-jobs")
async def rank_jobs_endpoint(req: RankRequest):
    """
    Receive normalized jobs + user profile + location.
    Returns top 30 ranked jobs with salary estimates and match scores.
    """
    try:
        ranked = rank_jobs(
            jobs           = req.jobs,
            profile        = req.profile,
            user_lat       = req.user_lat,
            user_lon       = req.user_lon,
            include_remote = req.include_remote,
        )

        # Run gap analysis on top 10 only (cost control)
        for job in ranked[:10]:
            try:
                gaps = analyze_gaps(req.profile, job)
                job["gap_skills"]     = gaps.get("gap_skills", [])
                job["matched_skills"] = gaps.get("matched_skills", [])
                job["gap_summary"]    = gaps.get("gap_summary", "")
            except:
                job["gap_skills"] = []

        return {"ranked": ranked[:30]}
    except Exception as e:
        raise HTTPException(500, f"Ranking failed: {str(e)}")


@app.post("/gap-analysis")
async def gap_analysis_endpoint(req: GapRequest):
    """Run gap analysis for a single job on demand (job detail view)."""
    try:
        result = analyze_gaps(req.profile, req.job)
        return result
    except Exception as e:
        raise HTTPException(500, f"Gap analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
