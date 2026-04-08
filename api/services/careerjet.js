const fetch = require('node-fetch');

/**
 * Fetch jobs from CareerJet API
 * Docs: https://www.careerjet.com/partners/api/
 * Free to use — requires Affiliate ID (free signup at careerjet.com/affiliates)
 * Affiliate ID stored in CAREERJET_AFFID env var
 */
module.exports = async function fetchCareerJet(query, location) {
  try {
    const affid = process.env.CAREERJET_AFFID;
    if (!affid || affid === 'PLACEHOLDER') {
      console.warn('CareerJet: No CAREERJET_AFFID set, skipping.');
      return [];
    }

    const params = new URLSearchParams({
      affid,
      keywords:  query,
      location,
      sort:      'salary',
      pagesize:  '50',
      page:      '1',
      locale_code: 'en_US',
    });

    const url = `http://public.api.careerjet.net/search?${params}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      console.error('CareerJet error:', res.status);
      return [];
    }

    const data = await res.json();
    if (data.type === 'error') {
      console.error('CareerJet API error:', data.status);
      return [];
    }

    const jobs = data.jobs || [];

    return jobs.map(j => {
      // CareerJet occasionally includes salary in the title or description
      let salary_min = null;
      let salary_max = null;
      if (j.salary) {
        const match = j.salary.match(/([\d,]+)\s*[-–]\s*([\d,]+)/);
        if (match) {
          salary_min = parseInt(match[1].replace(/,/g, ''), 10);
          salary_max = parseInt(match[2].replace(/,/g, ''), 10);
        }
      }

      return {
        _source:     'careerjet',
        external_id: j.url ? Buffer.from(j.url).toString('base64').slice(0, 32) : String(Math.random()),
        title:       j.title || '',
        company:     j.company || 'Unknown',
        location:    j.locations || location,
        lat:         null,
        lng:         null,
        salary_min,
        salary_max,
        description: j.description || '',
        url:         j.url || '',
        posted_at:   j.date || null,
      };
    });
  } catch (err) {
    console.error('CareerJet fetch failed:', err.message);
    return [];
  }
};
