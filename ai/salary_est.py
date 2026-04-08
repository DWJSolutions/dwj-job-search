"""
Salary Estimation Engine
Two-path resolver: use explicit salary OR estimate via Title + Location + Company Tier + Experience
"""

import math

# ─── Title Benchmark Map (BLS-seeded) ─────────────────────────────────────────
TITLE_SALARY_MAP = {
    "business analyst":           75000,
    "operations analyst":         72000,
    "project coordinator":        65000,
    "project manager":            95000,
    "program manager":           110000,
    "data analyst":               80000,
    "financial analyst":          85000,
    "senior financial analyst":  100000,
    "software engineer":         130000,
    "senior software engineer":  160000,
    "it specialist":              68000,
    "systems analyst":            82000,
    "management analyst":         78000,
    "budget analyst":             76000,
    "hr analyst":                 65000,
    "marketing analyst":          70000,
    "supply chain analyst":       75000,
    "administrative coordinator": 50000,
    "office manager":             58000,
    "accountant":                 72000,
    "auditor":                    78000,
    "logistics coordinator":      55000,
    "customer success manager":   80000,
    "sales manager":              90000,
}

# ─── Location Multipliers ──────────────────────────────────────────────────────
LOCATION_MULTIPLIERS = {
    "new york":       1.25,
    "nyc":            1.25,
    "san francisco":  1.40,
    "sf":             1.40,
    "seattle":        1.20,
    "washington":     1.20,
    "boston":         1.18,
    "chicago":        1.10,
    "los angeles":    1.22,
    "la":             1.22,
    "austin":         1.05,
    "denver":         1.03,
    "atlanta":        1.00,
    "dallas":         1.00,
    "houston":        1.00,
    "orlando":        0.95,   # ← default location
    "tampa":          0.95,
    "miami":          0.98,
    "jacksonville":   0.90,
    "birmingham":     0.88,
    "nashville":      0.95,
    "charlotte":      0.97,
    "remote":         1.10,
}

# ─── Company Tier Keywords ─────────────────────────────────────────────────────
ENTERPRISE_KEYWORDS = ["fortune 500", "global", "publicly traded", "nyse", "nasdaq",
                        "international", "worldwide", "enterprise"]
STARTUP_KEYWORDS    = ["startup", "series a", "series b", "seed", "early-stage",
                        "small team", "fast-paced startup", "founding team"]

def get_base_salary(title: str) -> int:
    """Fuzzy match job title to benchmark table."""
    t = title.lower().strip()
    # Exact match
    if t in TITLE_SALARY_MAP:
        return TITLE_SALARY_MAP[t]
    # Partial match (longest prefix win)
    best_score = 0
    best_salary = 60000  # default fallback
    for key, salary in TITLE_SALARY_MAP.items():
        overlap = sum(w in t for w in key.split())
        score = overlap / len(key.split())
        if score > best_score:
            best_score = score
            best_salary = salary
    return best_salary if best_score > 0.4 else 60000


def get_location_multiplier(location: str) -> float:
    """Map location string to cost-of-labor multiplier."""
    loc = location.lower()
    for city, mult in LOCATION_MULTIPLIERS.items():
        if city in loc:
            return mult
    return 1.00  # no adjustment for unknown locations


def get_company_tier_multiplier(description: str, source: str) -> float:
    desc = (description or "").lower()
    if source == "usajobs":
        return 1.10   # federal = stable mid-high
    if any(k in desc for k in ENTERPRISE_KEYWORDS):
        return 1.15
    if any(k in desc for k in STARTUP_KEYWORDS):
        return 0.90
    return 1.00  # mid-size default


def get_experience_multiplier(years: int) -> float:
    if years <= 1:   return 0.85
    if years <= 4:   return 1.00
    if years <= 9:   return 1.15
    return 1.25


def resolve_salary(job: dict, profile: dict) -> dict:
    """
    Two-path salary resolver.
    Path A: salary exists → use avg(min, max).
    Path B: salary missing → estimate via multipliers.
    """
    sal_min = job.get("salary_min")
    sal_max = job.get("salary_max")

    if sal_min and sal_max:
        job["salary_est"]        = round((sal_min + sal_max) / 2 / 1000) * 1000
        job["salary_confidence"] = "high"
    elif sal_min:
        job["salary_est"]        = round(sal_min / 1000) * 1000
        job["salary_confidence"] = "high"
    else:
        base   = get_base_salary(job.get("title", ""))
        loc    = get_location_multiplier(job.get("location", ""))
        tier   = get_company_tier_multiplier(job.get("description", ""), job.get("source", ""))
        exp    = get_experience_multiplier(profile.get("experience_years", 2))
        est    = base * loc * tier * exp
        # Apply 0.85 confidence discount to estimated salary for ranking
        job["salary_est"]        = round(est * 0.85 / 1000) * 1000
        job["salary_confidence"] = "estimated"

    return job
