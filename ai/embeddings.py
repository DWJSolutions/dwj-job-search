"""
Semantic Embedding Engine
Uses OpenAI text-embedding-3-small to compute cosine similarity between
a resume and job descriptions. One batch API call covers all jobs in a search.
"""

import os
import math
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

_embed_cache: dict[str, list[float]] = {}


def _cache_key(text: str) -> str:
    return str(hash(text[:500]))


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    return dot / (norm_a * norm_b + 1e-9)


def _batch_embed(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
        encoding_format="float",
    )
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]


def compute_semantic_scores(resume_text: str, jobs: list[dict]) -> list[int]:
    """
    Batch-embed resume + all job descriptions in one API call.
    Returns cosine similarity x 100 for each job (0-100).
    Cost: ~$0.002 per search for 30 jobs.
    """
    if not resume_text or not jobs:
        return [0] * len(jobs)

    resume_snippet = resume_text[:2000].strip()
    job_snippets = [
        (j.get("description") or j.get("title") or "")[:1000].strip()
        for j in jobs
    ]

    all_texts = [resume_snippet] + job_snippets
    keys = [_cache_key(t) for t in all_texts]
    missing_indices = [i for i, k in enumerate(keys) if k not in _embed_cache]
    missing_texts = [all_texts[i] for i in missing_indices]

    if missing_texts:
        try:
            new_vectors = _batch_embed(missing_texts)
            for idx, vec in zip(missing_indices, new_vectors):
                _embed_cache[keys[idx]] = vec
        except Exception as e:
            print(f"[embeddings] Batch embed failed: {e}")
            return [0] * len(jobs)

    resume_vec = _embed_cache[keys[0]]
    scores = []
    for key in keys[1:]:
        vec = _embed_cache.get(key)
        if vec:
            sim = _cosine(resume_vec, vec)
            scores.append(max(0, round(sim * 100)))
        else:
            scores.append(0)
    return scores
