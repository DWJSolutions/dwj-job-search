"""
Salary Estimation Engine
Path A: job has salary_min/max -> use the average (high confidence).
Path B: no salary -> heuristic multipliers (medium confidence).
Path C: heuristic match score < 0.4 -> GPT-4o-mini estimate (estimated confidence).
"""

import json
import os

TITLE_SALARY_MAP = {
    "business analyst": 75000, "operations analyst": 72000,
    "project coordinator": 65000, "project manager": 95000,
    "program manager": 110000, "data analyst": 80000,
    "financial analyst": 85000, "senior financial analyst": 100000,
    "software engineer": 130000, "senior software engineer": 160000,
    "it specialist": 68000, "systems analyst": 82000,
    "management analyst": 78000, "budget analyst": 76000,
    "hr analyst": 65000, "marketing analyst": 70000,
    "supply chain analyst": 75000, "administrative coordinator": 50000,
    "office manager": 58000, "accountant": 72000, "auditor": 78000,
    "logistics coordinator": 55000, "customer success manager": 80000,
    "sales manager": 90000,
    "av systems manager": 95000, "av project manager": 100000,
    "av installation manager": 88000, "construction foreman": 75000,
    "construction manager": 105000, "facilities manager": 85000,
    "operations manager": 95000,
}

LOCATION_MULTIPLIERS = {
    "new york": 1.25, "nyc": 1.25, "san francisco": 1.40, "sf": 1.40,
    "seattle": 1.20, "washington": 1.20, "boston": 1.18, "chicago": 1.10,
    "los angeles": 1.22, "la": 1.22, "austin": 1.05, "denver": 1.03,
    "atlanta": 1.00, "dallas": 1.00, "houston": 1.00, "orlando": 0.95,
    "tampa": 0.95, "miami": 0.98, "jacksonville": 0.90, "birmingham": 0.88,
    "nashville": 0.95, "charlotte": 0.97, "remote": 1.10,
}

ENTERPRISE_KEYWORDS = ["fortune 500", "global", "publicly traded", "nyse", "nasdaq",
                        "international", "worldwide", "enterprise"]
STARTUP_KEYWORDS    = ["startup", "series a", "series b", "seed", "early-stage",
                        "small team", "fast-paced startup", "founding team"]


def get_base_salary(title: str) -> tuple[int, float]:
    t = title.lower().strip()
    if t in TITLE_SALARY_MAP:
        return TITLE_SALARY_MAP[t], 1.0
    best_score, best_salary = 0.0, 60000
    for key, salary in TITLE_SALARY_MAP.items():
        words = key.split()
        overlap = sum(w in t for w in words)
        score = overlap / len(words)
        if score > best_score:
            best_score, best_salary = score, salary
    return (best_salary, best_score) if best_score > 0.0 else (60000, 0.0)


def get_location_multiplier(location: str) -> float:
    loc = location.lower()
    for city, mult in LOCATION_MULTIPLIERS.items():
        if city in loc:
            return mult
    return 1.00


def get_company_tier_multiplier(description: str, source: str) -> float:
    desc = (description or "").lower()
    if source == "usajobs": return 1.10
    if any(k in desc for k in ENTERPRISE_KEYWORDS): return 1.15
    if any(k in desc for k in STARTUP_KEYWORDS): return 0.90
    return 1.00


def get_experience_multiplier(years: int) -> float:
    if years <= 1: return 0.85
    if years <= 4: return 1.00
    if years <= 9: return 1.15
    return 1.25


def _gpt_salary_estimate(title: str, location: str, description: str):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        prompt = (
            f"Estimate the median annual salary (USD) for this job in {location}.\n"
            f"Job title: {title}\n"
            f"Description snippet: {(description or '')[:400]}\n\n"
            "Return ONLY a JSON object: {\"salary\": <integer>}"
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1, max_tokens=50,
        )
        data = json.loads(response.choices[0].message.content)
        val = data.get("salary")
        return int(val) if val and 20000 < int(val) < 500000 else None
    except Exception as e:
        print(f"[salary_est] GPT estimate failed: {e}")
        return None


def resolve_salary(job: dict, profile: dict) -> dict:
    sal_min = job.get("salary_min")
    sal_max = job.get("salary_max")

    if sal_min and sal_max:
        job["salary_est"] = round((sal_min + sal_max) / 2 / 1000) * 1000
        job["salary_confidence"] = "high"
        return job
    if sal_min:
        job["salary_est"] = round(sal_min / 1000) * 1000
        job["salary_confidence"] = "high"
        return job

    title = job.get("title", "")
    location = job.get("location", "")
    base, match_confidence = get_base_salary(title)

    if match_confidence >= 0.4:
        loc  = get_location_multiplier(location)
        tier = get_company_tier_multiplier(job.get("description", ""), job.get("source", ""))
        exp  = get_experience_multiplier(profile.get("experience_years", 2))
        est  = base * loc * tier * exp * 0.85
        job["salary_est"]        = round(est / 1000) * 1000
        job["salary_confidence"] = "estimated"
    else:
        gpt_est = _gpt_salary_estimate(title, location, job.get("description", ""))
        if gpt_est:
            job["salary_est"]        = round(gpt_est / 1000) * 1000
            job["salary_confidence"] = "estimated"
        else:
            loc = get_location_multiplier(location)
            exp = get_experience_multiplier(profile.get("experience_years", 2))
            job["salary_est"]        = round(base * loc * exp * 0.85 / 1000) * 1000
            job["salary_confidence"] = "estimated"

    return job
