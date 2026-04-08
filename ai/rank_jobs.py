"""
Job Ranking Engine
Composite score: salary (50%) + match (30%) + growth (20%)
"""

import math
from salary_est import resolve_salary

# ─── Salary normalization (0 → 1 scale, cap at $250k) ─────────────────────────
SALARY_CAP = 250_000

def normalize_salary(amt: float) -> float:
    if not amt: return 0.0
    return min(amt / SALARY_CAP, 1.0)


# ─── Location: haversine distance ─────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(max(a, 0)))


# ─── Skill match (Jaccard similarity) ─────────────────────────────────────────
def skill_match_score(profile_skills: list, description: str) -> float:
    if not profile_skills or not description:
        return 0.3  # neutral fallback
    desc_lower = description.lower()
    matches = sum(1 for s in profile_skills if s.lower() in desc_lower)
    total   = len(profile_skills)
    return matches / total if total else 0.0


# ─── Title match ──────────────────────────────────────────────────────────────
def title_match_score(profile_titles: list, job_title: str) -> float:
    if not profile_titles or not job_title:
        return 0.3
    job_words = set(job_title.lower().split())
    best = 0.0
    for t in profile_titles:
        t_words  = set(t.lower().split())
        overlap  = len(t_words & job_words) / max(len(t_words | job_words), 1)
        best = max(best, overlap)
    return best


# ─── Growth score (v1.0 heuristic) ────────────────────────────────────────────
SENIOR_KEYWORDS = ["senior", "lead", "principal", "director", "vp", "manager",
                    "head of", "chief", "staff"]
JUNIOR_KEYWORDS = ["junior", "associate", "entry", "coordinator", "assistant", "intern"]

def growth_score(job_title: str, company_rating: float = None) -> float:
    title_lower = job_title.lower()
    if any(k in title_lower for k in SENIOR_KEYWORDS):
        title_score = 0.85
    elif any(k in title_lower for k in JUNIOR_KEYWORDS):
        title_score = 0.30
    else:
        title_score = 0.60  # mid-level default

    if company_rating:
        rep_score = (company_rating - 1.0) / 4.0  # normalize 1–5 → 0–1
    else:
        rep_score = 0.50  # neutral fallback

    return (title_score * 0.6) + (rep_score * 0.4)


# ─── Recency factor ────────────────────────────────────────────────────────────
def recency_factor(posted_at: str) -> float:
    from datetime import datetime, timezone
    if not posted_at:
        return 0.5
    try:
        posted = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
        days   = (datetime.now(timezone.utc) - posted).days
        return max(0.0, 1.0 - (days / 60))  # full score if today, 0 if 60+ days ago
    except:
        return 0.5


# ─── Route remote jobs ─────────────────────────────────────────────────────────
def route_job(job: dict, user_lat: float, user_lon: float, include_remote: bool) -> dict | None:
    is_remote = "remote" in (job.get("location") or "").lower()

    if is_remote:
        if include_remote:
            job["distance_miles"] = None
            job["loc_score"]      = 0.5
            return job
        return None  # excluded when toggle is off

    lat, lon = job.get("lat"), job.get("lng")
    if lat and lon:
        dist = haversine(user_lat, user_lon, lat, lon)
        if dist <= 30:
            job["distance_miles"] = round(dist, 1)
            return job
        return None  # outside 30-mile radius

    # No coordinates → include with neutral location score
    job["distance_miles"] = None
    job["loc_score"]      = 0.5
    return job


# ─── Main ranking function ────────────────────────────────────────────────────
def rank_jobs(jobs: list, profile: dict, user_lat: float, user_lon: float,
              include_remote: bool = False) -> list:
    # 1. Resolve salaries (two-path)
    jobs = [resolve_salary(j, profile) for j in jobs]

    # 2. Filter by location / remote
    routed = [j for j in (route_job(j, user_lat, user_lon, include_remote) for j in jobs) if j]

    # 3. Score each job
    for job in routed:
        salary = normalize_salary(job.get("salary_est") or 0)
        match  = skill_match_score(profile.get("skills", []), job.get("description", ""))
        title  = title_match_score(profile.get("titles", []), job.get("title", ""))
        loc    = job.get("loc_score", 1.0 - min(job.get("distance_miles") or 15, 30) / 30)
        growth = growth_score(job.get("title", ""))

        combined_match = (match * 0.7) + (title * 0.3)
        job["match_score"] = round(combined_match * 100)
        job["growth_score"] = round(growth * 100)
        job["job_score"] = (
            (salary     * 0.50) +
            (combined_match * 0.30) +
            (growth     * 0.20)
        )

        # Human-readable match reason
        top_skills = [s for s in (profile.get("skills") or []) if s.lower() in (job.get("description") or "").lower()]
        job["reason"] = f"Strong match on {', '.join(top_skills[:3])}" if top_skills else "Good title alignment"

    # 4. Sort by composite score descending
    routed.sort(key=lambda j: j["job_score"], reverse=True)

    # 5. Assign ranks
    for i, job in enumerate(routed):
        job["rank"] = i + 1

    return routed
