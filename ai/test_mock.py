"""
Mock test — runs the full salary estimation + ranking engine
with realistic Orlando-area job data. No API keys needed.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from rank_jobs import rank_jobs

MOCK_JOBS = [
    {
        "id": "j1", "source": "adzuna", "external_id": "az001",
        "title": "Business Analyst", "company": "Deloitte",
        "location": "Orlando, FL", "lat": 28.54, "lng": -81.38,
        "salary_min": 72000, "salary_max": 88000,
        "description": "SQL Excel reporting dashboards data analysis project management Tableau stakeholder communication",
        "url": "https://adzuna.com/j1", "posted_at": "2026-04-01"
    },
    {
        "id": "j2", "source": "usajobs", "external_id": "usa001",
        "title": "Management Analyst (GS-11)", "company": "Dept of Veterans Affairs",
        "location": "Orlando, FL", "lat": 28.50, "lng": -81.32,
        "salary_min": 69107, "salary_max": 89831,
        "description": "Federal government analyst position. Requires SQL analytical skills project management budgeting policy analysis reporting",
        "url": "https://usajobs.gov/j2", "posted_at": "2026-04-03"
    },
    {
        "id": "j3", "source": "ziprecruiter", "external_id": "zr001",
        "title": "Operations Analyst", "company": "Lockheed Martin",
        "location": "Lake Mary, FL", "lat": 28.75, "lng": -81.31,
        "salary_min": None, "salary_max": None,  # ← NO SALARY LISTED
        "description": "Operations analyst for defense contractor. Excel SQL data analysis process improvement project coordination. Fortune 500 global enterprise.",
        "url": "https://ziprecruiter.com/j3", "posted_at": "2026-04-02"
    },
    {
        "id": "j4", "source": "adzuna", "external_id": "az002",
        "title": "Senior Financial Analyst", "company": "Disney",
        "location": "Lake Buena Vista, FL", "lat": 28.37, "lng": -81.55,
        "salary_min": 90000, "salary_max": 115000,
        "description": "Senior analyst for entertainment finance. Excel PowerPoint financial modeling SQL budgeting forecasting stakeholder reporting. Publicly traded global enterprise.",
        "url": "https://adzuna.com/j4", "posted_at": "2026-03-28"
    },
    {
        "id": "j5", "source": "ziprecruiter", "external_id": "zr002",
        "title": "Data Analyst", "company": "AdventHealth",
        "location": "Altamonte Springs, FL", "lat": 28.66, "lng": -81.37,
        "salary_min": None, "salary_max": None,  # ← NO SALARY LISTED
        "description": "Healthcare data analyst. SQL Python Tableau reporting dashboards data visualization. Analytics experience required.",
        "url": "https://ziprecruiter.com/j5", "posted_at": "2026-04-04"
    },
    {
        "id": "j6", "source": "usajobs", "external_id": "usa002",
        "title": "Budget Analyst (GS-9)", "company": "Dept of Defense",
        "location": "Orlando, FL", "lat": 28.54, "lng": -81.39,
        "salary_min": 60360, "salary_max": 78468,
        "description": "Federal budget analyst. Financial reporting Excel budget formulation analysis. Security clearance preferred.",
        "url": "https://usajobs.gov/j6", "posted_at": "2026-04-05"
    },
    {
        "id": "j7", "source": "adzuna", "external_id": "az003",
        "title": "Project Manager", "company": "Accenture",
        "location": "Orlando, FL", "lat": 28.52, "lng": -81.36,
        "salary_min": 88000, "salary_max": 110000,
        "description": "Project manager for consulting firm. PMP certification preferred. Excel PowerPoint stakeholder management Agile Scrum project coordination. Global enterprise.",
        "url": "https://adzuna.com/j7", "posted_at": "2026-04-01"
    },
    {
        "id": "j8", "source": "ziprecruiter", "external_id": "zr003",
        "title": "Supply Chain Analyst", "company": "Amazon",
        "location": "Kissimmee, FL", "lat": 28.29, "lng": -81.41,
        "salary_min": None, "salary_max": None,  # ← NO SALARY LISTED
        "description": "Supply chain analyst for e-commerce operations. SQL data analysis Excel inventory management logistics. Fortune 500.",
        "url": "https://ziprecruiter.com/j8", "posted_at": "2026-04-02"
    },
]

MOCK_PROFILE = {
    "skills": ["SQL", "Excel", "Project Management", "Data Analysis", "Reporting", "PowerPoint", "Stakeholder Communication"],
    "titles": ["Operations Analyst", "Business Analyst"],
    "experience_years": 2,
    "education": "Bachelors",
    "industries": ["Consulting", "Finance", "Technology"],
}

# Orlando, FL coordinates
USER_LAT = 28.5383
USER_LON = -81.3792

if __name__ == "__main__":
    print("\n" + "="*65)
    print("  DWJ JOB SEARCH — SALARY ESTIMATION + RANKING ENGINE TEST")
    print("  Location: Orlando, FL 32801  |  Jobs with no salary: 3/8")
    print("="*65)

    ranked = rank_jobs(MOCK_JOBS, MOCK_PROFILE, USER_LAT, USER_LON, include_remote=False)

    print(f"\n{'Rank':<5} {'Title':<30} {'Company':<20} {'Salary':<18} {'Conf':<12} {'Match':>5} {'Score':>6}")
    print("-"*100)

    for job in ranked:
        salary_str = f"${job['salary_est']:,}" if job.get('salary_est') else "N/A"
        conf  = job.get('salary_confidence', '?')
        match = job.get('match_score', 0)
        score = job.get('job_score', 0)
        dist  = job.get('distance_miles')
        dist_str = f" ({dist}mi)" if dist else ""
        print(f"#{job['rank']:<4} {job['title'][:29]:<30} {job['company'][:19]:<20} "
              f"{salary_str:<18} {conf:<12} {match:>4}%  {score:>5.3f}")
        print(f"       Reason: {job.get('reason', '')}")
        if dist: print(f"       Distance: {dist} miles")
        print()

    print("="*65)
    print(f"  RESULT: {len(ranked)}/8 jobs passed 30-mile filter")
    no_sal = [j for j in ranked if j.get('salary_confidence') == 'estimated']
    print(f"  Jobs with estimated salary: {len(no_sal)} (would have been EXCLUDED by other tools)")
    print("="*65 + "\n")
