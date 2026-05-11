"""
Resume Gap Analysis
Compares resume skills to job description and identifies what's missing,
labelled by how to acquire the skill: required / cert / free-to-learn.
"""

import json
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are a technical recruiter. Compare the candidate's resume skills to the job description.
Return ONLY valid JSON:
{
  "matched_skills": ["skills from resume that appear in the job description"],
  "gap_skills": [
    {
      "skill": "skill name",
      "level": "required|cert|free-to-learn",
      "mentioned": <int times mentioned in description>
    }
  ],
  "gap_summary": "One sentence: 'You match X% of this role. Adding [top skill] would push your match to ~Y%.'"
}

Rules for the level field:
- required: the job explicitly states this skill is required or it appears 3+ times
- cert: the skill is best acquired via a paid certification (e.g. PMP, AWS, CPA, OSHA)
- free-to-learn: learnable via free resources (YouTube, docs, Coursera free tier, practice)

Only include skills in gap_skills that are NOT already on the resume.
"""


def analyze_gaps(profile: dict, job: dict) -> dict:
    skills_str = ", ".join(profile.get("skills", []))
    desc_snippet = (job.get("description") or "")[:800]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Resume skills: {skills_str}\n\n"
                        f"Job title: {job.get('title', '')}\n"
                        f"Job description: {desc_snippet}"
                    ),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"[gap_analysis] failed: {e}")
        return {
            "matched_skills": [],
            "gap_skills": [],
            "gap_summary": "Gap analysis unavailable.",
        }
