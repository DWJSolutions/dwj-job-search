"""
Job Ranking Engine - Phase 2
Composite match score: salary signal (15%) + resume/job match (70%) + growth signal (15%)

New in Phase 2:
  - match_score  -> OpenAI embedding cosine similarity (replaces Jaccard)
  - signal bars  -> salary_signal, skills_signal, title_signal, growth_signal (0-100)
  - ats_*        -> ats_score, ats_keywords, ats_missing (top 30 after sort)
  - badge        -> apply-now | strong | stretch | long-term
"""

import math
from salary_est import resolve_salary
from embeddings import compute_semantic_scores
from ats_match import compute_ats_match

SALARY_CAP = 250_000


def normalize_salary(amt: float) -> float:
    if not amt: return 0.0
    return min(amt / SALARY_CAP, 1.0)


def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 3958.8
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(max(a, 0)))


def _skill_signal(profile_skills: list, description: str) -> int:
    if not profile_skills or not description:
        return 30
    desc_lower = description.lower()
    matches = sum(1 for s in profile_skills if s.lower() in desc_lower)
    return round(matches / len(profile_skills) * 100)


def _title_signal(profile_titles: list, job_title: str) -> int:
    if not profile_titles or not job_title:
        return 30
    job_words = set(job_title.lower().split())
    best = 0.0
    for t in profile_titles:
        t_words = set(t.lower().split())
        overlap = len(t_words & job_words) / max(len(t_words | job_words), 1)
        best = max(best, overlap)
    return round(best * 100)


SENIOR_KW = ["senior", "lead", "principal", "director", "vp", "manager",
             "head of", "chief", "staff"]
JUNIOR_KW = ["junior", "associate", "entry", "coordinator", "assistant", "intern"]


def _growth_signal(job_title: str) -> int:
    t = job_title.lower()
    if any(k in t for k in SENIOR_KW): return 85
    if any(k in t for k in JUNIOR_KW): return 30
    return 60


def _salary_signal(job_salary_est: float, profile: dict) -> int:
    if not job_salary_est: return 40
    exp_years = profile.get("experience_years", 2)
    expected = min(50_000 + exp_years * 4_000, 180_000)
    ratio = job_salary_est / expected
    if ratio >= 1.10: return 100
    if ratio >= 1.00: return 90
    if ratio >= 0.90: return 75
    if ratio >= 0.75: return 55
    if ratio >= 0.60: return 35
    return 20


def _badge(match_score: int) -> str:
    if match_score >= 85: return "apply-now"
    if match_score >= 70: return "strong"
    if match_score >= 55: return "stretch"
    return "long-term"


def _badge_rank(badge: str) -> int:
    return {
        "apply-now": 1,
        "strong": 2,
        "stretch": 3,
        "long-term": 4,
    }.get(badge, 5)


def _is_remote_or_hybrid(job: dict) -> bool:
    text = " ".join([
        job.get("location") or "",
        job.get("title") or "",
        (job.get("description") or "")[:300],
    ]).lower()
    return "remote" in text or "hybrid" in text


def _route_job(job: dict, user_lat: float, user_lon: float,
               include_remote: bool):
    is_flexible = _is_remote_or_hybrid(job)
    if is_flexible:
        if include_remote:
            job["distance_miles"] = None
            job["loc_score"] = 0.5
            return job
        return None

    lat, lon = job.get("lat"), job.get("lng")
    if lat and lon:
        dist = haversine(user_lat, user_lon, lat, lon)
        if dist <= 30:
            job["distance_miles"] = round(dist, 1)
            job["loc_score"] = 1.0 - (dist / 30)
            return job
        return None

    # Some sources do not provide dependable coordinates. Keep non-flexible
    # jobs as candidates with unknown distance instead of excluding the source.
    job["distance_miles"] = None
    job["loc_score"] = 0.35
    return job


def rank_jobs(jobs: list, profile: dict, user_lat: float, user_lon: float,
              include_remote: bool = False) -> list:

    resume_text = profile.get("resume_text", "")

    # 1. Resolve salaries
    jobs = [resolve_salary(j, profile) for j in jobs]

    # 2. Filter by location
    routed = [j for j in (_route_job(j, user_lat, user_lon, include_remote) for j in jobs) if j]
    if not routed:
        return []

    # 3. Batch semantic embeddings (one API call for all jobs)
    try:
        semantic_scores = compute_semantic_scores(resume_text, routed)
    except Exception as e:
        print(f"[rank_jobs] embeddings failed, falling back: {e}")
        semantic_scores = [0] * len(routed)

    # 4. Score each job
    for job, sem_score in zip(routed, semantic_scores):
        sal_est  = job.get("salary_est") or 0
        sal_norm = normalize_salary(sal_est)

        skills_sig = _skill_signal(profile.get("skills", []), job.get("description", ""))
        title_sig  = _title_signal(profile.get("titles", []), job.get("title", ""))
        growth_sig = _growth_signal(job.get("title", ""))
        salary_sig = _salary_signal(sal_est, profile)

        job["salary_signal"] = salary_sig
        job["skills_signal"] = skills_sig
        job["title_signal"]  = title_sig
        job["growth_signal"] = growth_sig

        if sem_score > 0:
            resume_match_sig = sem_score
        else:
            resume_match_sig = round(skills_sig * 0.7 + title_sig * 0.3)

        job["resume_match_signal"] = resume_match_sig
        job["match_score"] = round(
            salary_sig * 0.15 +
            resume_match_sig * 0.70 +
            growth_sig * 0.15
        )

        job["badge"] = _badge(job["match_score"])
        job["tier_rank"] = _badge_rank(job["badge"])
        job["job_score"] = job["match_score"] / 100

        top_skills = [s for s in (profile.get("skills") or [])
                      if s.lower() in (job.get("description") or "").lower()]
        job["reason"] = (f"Strong match on {', '.join(top_skills[:3])}"
                         if top_skills else "Good title alignment")

    # 5. Sort by fit tier first, then weighted match score
    routed.sort(key=lambda j: (j.get("tier_rank", 5), -(j.get("job_score") or 0)))

    # 6. Assign ranks
    for i, job in enumerate(routed):
        job["rank"] = i + 1

    # 7. ATS match on top 10 (after ranking to keep search responsive)
    if resume_text:
        for job in routed[:10]:
            try:
                ats = compute_ats_match(resume_text, job.get("description", ""))
                job.update(ats)
            except Exception as e:
                print(f"[rank_jobs] ATS failed for '{job.get('title')}': {e}")
                job.update({"ats_score": 0, "ats_keywords": [], "ats_missing": []})

    return routed
