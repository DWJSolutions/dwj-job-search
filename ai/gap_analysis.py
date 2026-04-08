"""
Resume Gap Analysis
Compares resume skills to job description and identifies what's missing.
"""

import json
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are a technical recruiter. Compare the candidate's resume skills to the job description.
Return ONLY valid JSON:
{
  "matched_skills": ["skills from resume that appear in job description"],
  "gap_skills": [
    {"skill": "skill name", "importance": "critical|important|nice-to-have", "mentioned": <int times in description>}
  ],
  "gap_summary": "One sentence: 'You match X% of this role. Adding [top skill] would push your match to ~Y%.'"
}
Only include skills in gap_skills that are NOT on the resume.
Mark as critical if mentioned 3+ times, important if 1-2 times, nice-to-have if implied/inferred.
"""

def analyze_gaps(profile: dict, job: dict) -> dict:
    """Return gap analysis for a single job vs. profile."""
    skills_str = ", ".join(profile.get("skills", []))
    desc_snippet = (job.get("description") or "")[:800]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",   # cheaper model for per-job analysis
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content":
                    f"Resume skills: {skills_str}\n\n"
                    f"Job title: {job.get('title', '')}\n"
                    f"Job description: {desc_snippet}"
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {
            "matched_skills": [],
            "gap_skills":     [],
            "gap_summary":    "Gap analysis unavailable.",
        }
