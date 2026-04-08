const fetch = require('node-fetch');

/**
 * Fetch jobs from ZipRecruiter API
 * Docs: https://www.ziprecruiter.com/zipsearch
 * Note: salary often absent — AI estimator handles this
 */
module.exports = async function fetchZipRecruiter(query, zipCode) {
  const params = new URLSearchParams({
    search:        query,
    location:      zipCode,
    radius_miles:  '30',
    days_ago:      '30',
    jobs_per_page: '50',
    api_key:       process.env.ZIPRECRUITER_API_KEY,
  });

  const url = `https://api.ziprecruiter.com/jobs/v1?${params}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    console.error('ZipRecruiter error:', res.status);
    return [];
  }

  const data = await res.json();
  return (data.jobs || []).map(j => ({
    _source:     'ziprecruiter',
    external_id: j.id,
    title:       j.name,
    company:     j.hiring_company?.name || 'Unknown',
    location:    j.location,
    lat:         null,
    lng:         null,
    salary_min:  j.salary_min_annual || null,
    salary_max:  j.salary_max_annual || null,
    description: j.snippet || j.job_description || '',
    url:         j.url,
    posted_at:   j.posted_time_friendly ? new Date().toISOString() : null,
  }));
};
