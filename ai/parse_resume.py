"""
Resume Parser — uses OpenAI GPT-4o to extract structured profile from PDF/DOCX
"""

import os
import json
import io
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

SYSTEM_PROMPT = """You are an expert resume parser. Extract structured data from the resume text provided.
Return ONLY valid JSON with exactly these fields:
{
  "skills": ["list of technical and soft skills"],
  "titles": ["job titles from most recent to oldest, also include relevant target titles"],
  "experience_years": <integer total years of work experience>,
  "education": "<highest degree, e.g. Bachelors, Masters, Associates, High School>",
  "industries": ["list of industries the person has worked in"]
}
Be thorough with skills — include tools, software, methodologies, and domain knowledge.
"""

def extract_text_from_pdf(content: bytes) -> str:
    try:
        import fitz  # PyMuPDF
        doc  = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        return text[:8000]  # trim to token budget
    except ImportError:
        raise RuntimeError("PyMuPDF not installed. Run: pip install pymupdf")


def extract_text_from_docx(content: bytes) -> str:
    try:
        from docx import Document
        doc  = Document(io.BytesIO(content))
        text = "\n".join(p.text for p in doc.paragraphs)
        return text[:8000]
    except ImportError:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")


def parse_resume(file_content: bytes, mime_type: str) -> dict:
    """Parse resume bytes → structured profile dict."""
    if "pdf" in mime_type:
        text = extract_text_from_pdf(file_content)
    else:
        text = extract_text_from_docx(file_content)

    if not text.strip():
        raise ValueError("Could not extract text from resume file")

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"Resume text:\n\n{text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    raw = response.choices[0].message.content
    profile = json.loads(raw)

    # Validate and set safe defaults
    profile.setdefault("skills",           [])
    profile.setdefault("titles",           [])
    profile.setdefault("experience_years", 0)
    profile.setdefault("education",        "Unknown")
    profile.setdefault("industries",       [])

    return profile
