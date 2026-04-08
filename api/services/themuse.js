const fetch = require('node-fetch');

/**
 * Fetch jobs from The Muse API
 * Docs: https://www.themuse.com/developers/api/v2
 * Free tier: 500 calls/hour, no key required (key optional for higher limits)
 */
module.exports = async function fetchTheMuse(query, location) {
  try {
    const params = new URLSearchParams({
      query,
      page:      '0',
      page_size: '50',
      level:     'entry,mid,senior,director,vp,executive',
    });

    // Optional API key for higher rate limits
    if (process.env.THEMUSE_API_KEY && process.env.THEMUSE_API_KEY !== 'PLACEHOLDER') {
      params.append('api_key', process.env.THEMUSE_API_KEY);
    }

    const url = `https://www.themuse.com/api/public/jobs?${params}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      console.error('The Muse error:', res.status);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];

    return results.map(j => {
      // Extract city from locations array
      const loc = j.locations?.[0]?.name || location;

      // Extract salary if listed in contents
      let salary_min = null;
      let salary_max = null;
      const salaryMatch = (j.contents || '').match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
      if (salaryMatch) {
        salary_min = parseInt(salaryMatch[1].replace(/,/g, ''), 10);
        salary_max = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
      }

      return {
        _source:     'themuse',
        external_id: String(j.id),
        title:       j.name || '',
        company:     j.company?.name || 'Unknown',
        location:    loc,
        lat:         null,
        lng:         null,
        salary_min,
        salary_max,
        description: j.contents || '',
        url:         j.refs?.landing_page || '',
        posted_at:   j.publication_date || null,
      };
    });
  } catch (err) {
    console.error('The Muse fetch failed:', err.message);
    return [];
  }
};
