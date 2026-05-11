const fetch = require('node-fetch');

/**
 * Fetch jobs from Remotive API — 100% free, no API key required
 * Docs: https://remotive.com/api/remote-jobs
 *
 * Remotive is a remote-only board. All jobs returned have location "Remote".
 * They are included regardless of the `include_remote` flag because the Python
 * ranker already handles distance scoring (remote jobs get a fixed distance of 0).
 */
module.exports = async function fetchRemotive(query) {
  try {
    const params = new URLSearchParams({
      search: query,
      limit: '50',
    });

    const url = `https://remotive.com/api/remote-jobs?${params}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('Remotive error:', res.status);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs || [];

    return jobs.map(j => {
      // Remotive sometimes includes a salary string like "$80k - $120k"
      let salary_min = null;
      let salary_max = null;
      const salaryStr = j.salary || '';
      const salaryMatch = salaryStr.match(/\$?([\d,]+)[kK]?\s*[-\u2013]\s*\$?([\d,]+)[kK]?/);
      if (salaryMatch) {
        const parseVal = (raw) => {
          const n = parseInt(raw.replace(/,/g, ''), 10);
          return n < 10000 ? n * 1000 : n;
        };
        salary_min = parseVal(salaryMatch[1]);
        salary_max = parseVal(salaryMatch[2]);
      }

      return {
        _source: 'remotive',
        external_id: String(j.id),
        title: j.title || '',
        company: j.company_name || 'Unknown',
        location: j.candidate_required_location || 'Remote',
        lat: null,
        lng: null,
        salary_min,
        salary_max,
        description: (j.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        url: j.url || '',
        posted_at: j.publication_date || null,
      };
    });
  } catch (err) {
    console.error('Remotive fetch failed:', err.message);
    return [];
  }
};
