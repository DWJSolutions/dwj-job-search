const fetch = require('node-fetch');

/**
 * Fetch jobs from Arbeitnow — 100% free, no API key required
 * Docs: https://arbeitnow.com/api/job-board-api
 *
 * Arbeitnow aggregates jobs from companies that use Greenhouse, Lever, Ashby,
 * Workable, and other ATS providers. It covers remote and EU-based roles.
 * The `search` param does keyword matching across title + description.
 */
module.exports = async function fetchArbeitnow(query) {
  try {
    const params = new URLSearchParams({
      search: query,
      page: '1',
    });

    const url = `https://arbeitnow.com/api/job-board-api?${params}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error('Arbeitnow error:', res.status);
      return [];
    }

    const data = await res.json();
    const jobs = data.data || [];

    return jobs.map(j => {
      // Arbeitnow does not expose salary data in the free API.
      // The Python salary estimator will fill this in later.
      const location = j.remote
        ? 'Remote'
        : (j.location || 'Unknown');

      return {
        _source: 'arbeitnow',
        external_id: j.slug || String(j.created_at),
        title: j.title || '',
        company: j.company_name || 'Unknown',
        location,
        lat: null,
        lng: null,
        salary_min: null,
        salary_max: null,
        description: (j.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        url: j.url || '',
        posted_at: j.created_at
          ? new Date(j.created_at * 1000).toISOString()
          : null,
      };
    });
  } catch (err) {
    console.error('Arbeitnow fetch failed:', err.message);
    return [];
  }
};
