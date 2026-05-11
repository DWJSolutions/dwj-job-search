"""
ATS Keyword Match
Extracts 3-5 ATS-critical keywords from a job description using GPT-4o-mini,
then checks which ones appear in the candidate's resume text.
Cost: ~$0.0001 per job at gpt-4o-mini pricing.
"""

import json
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def _extract_ats_keywords(job_description: str) -> list[str]:
    prompt = (
        "Extract 3 to 5 ATS-critical keywords from this job description. "
        "Pick specific skills, tools, certifications, or domain terms that an "
        "applicant tracking system would filter resumes on. "
        "Return ONLY a JSON object: {\"keywords\": [\"term1\", \"term2\", ...]}\n\n"
        f"Job description:\n{job_description[:800]}"
    )
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=150,
    )
    data = json.loads(response.choices[0].message.content)
    keywords = data.get("keywords", [])
    return [str(k).lower().strip() for k in keywords if k][:5]


def compute_ats_match(resume_text: str, job_description: str) -> dict:
    """
    Returns:
    {
        "ats_score":    67,
        "ats_keywords": ["biamp", "qsc", "dante"],
        "ats_missing":  ["dante"],
    }
    """
    if not resume_text or not job_description:
        return {"ats_score": 0, "ats_keywords": [], "ats_missing": []}

    try:
        keywords = _extract_ats_keywords(job_description)
    except Exception as e:
        print(f"[ats_match] keyword extraction failed: {e}")
        return {"ats_score": 0, "ats_keywords": [], "ats_missing": []}

    if not keywords:
        return {"ats_score": 0, "ats_keywords": [], "ats_missing": []}

    resume_lower = resume_text.lower()
    found = [k for k in keywords if k in resume_lower]
    missing = [k for k in keywords if k not in resume_lower]
    score = round(len(found) / len(keywords) * 100)

    return {"ats_score": score, "ats_keywords": keywords, "ats_missing": missing}
