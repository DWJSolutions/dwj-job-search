/**
 * Cross-source job deduplication
 * Two jobs are duplicates if they match on 3 of 4 signals:
 *   - Company name (fuzzy ≥ 90%)
 *   - Job title   (fuzzy ≥ 85%)
 *   - Location    (same city)
 *   - Posted date (within 3 days)
 */

function similarity(a, b) {
  a = a.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  b = b.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  if (a === b) return 1;
  const longer  = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDist = levenshtein(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[a.length][b.length];
}

function isDuplicate(a, b) {
  let matches = 0;
  if (similarity(a.company, b.company) >= 0.90) matches++;
  if (similarity(a.title,   b.title)   >= 0.85) matches++;
  const cityA = (a.location || '').split(',')[0].trim().toLowerCase();
  const cityB = (b.location || '').split(',')[0].trim().toLowerCase();
  if (cityA && cityB && cityA === cityB) matches++;
  if (a.posted_at && b.posted_at) {
    const diff = Math.abs(new Date(a.posted_at) - new Date(b.posted_at)) / 86400000;
    if (diff <= 3) matches++;
  }
  return matches >= 3;
}

function mergeRecords(a, b) {
  // Keep the record with more salary data; prefer more recent posting
  const hasSalary = j => j.salary_min || j.salary_max;
  const base   = hasSalary(a) ? a : hasSalary(b) ? b : a;
  const recent = (a.posted_at && b.posted_at && new Date(b.posted_at) > new Date(a.posted_at)) ? b : a;
  return { ...recent, salary_min: base.salary_min, salary_max: base.salary_max };
}

function deduplicate(jobs) {
  const canonical = [];
  for (const job of jobs) {
    const dupIdx = canonical.findIndex(c => isDuplicate(c, job));
    if (dupIdx >= 0) {
      canonical[dupIdx] = mergeRecords(canonical[dupIdx], job);
    } else {
      canonical.push(job);
    }
  }
  return canonical;
}

module.exports = { deduplicate };
