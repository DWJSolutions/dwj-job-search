const fetch = require('node-fetch');

/**
 * Fetch jobs from Adzuna API
 * Docs: https://developer.adzuna.com/
 */
module.exports = async function fetchAdzuna(query, location) {
  const params = new URLSearchParams({
    app_id:                process.env.ADZUNA_APP_ID,
    app_key:               process.env.ADZUNA_APP_KEY,
    results_per_page:      '50',
    what:                  query,
    where:                 location,
    distance:              '30',
    sort_by:               'salary',
    salary_include_unknown: '1',  // ← critical: do NOT exclude no-salary jobs
    full_time:             '1',
    content_type:          'application/json',
  });

  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Adzuna error:', res.status);
    return [];
  }

  const data = await res.json();
  return (data.results || []).map(j => ({
    _source:     'adzuna',
    external_id: j.id,
    title:       j.title,
    company:     j.company?.display_name || 'Unknown',
    location:    j.location?.display_name || location,
    lat:         j.latitude,
    lng:         j.longitude,
    salary_min:  j.salary_min || null,
    salary_max:  j.salary_max || null,
    description: j.description || '',
    url:         j.redirect_url,
    posted_at:   j.created,
  }));
};
