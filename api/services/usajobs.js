const fetch = require('node-fetch');

/**
 * Fetch jobs from USAJOBS API
 * Docs: https://developer.usajobs.gov/
 * Free API key: https://developer.usajobs.gov/APIRequest/Index
 */
module.exports = async function fetchUSAJOBS(query, location) {
  const params = new URLSearchParams({
    Keyword:        query,
    LocationName:   location,
    Radius:         '30',
    ResultsPerPage: '50',
    SortField:      'salary',
    SortDirection:  'Desc',
  });

  const url = `https://data.usajobs.gov/api/search?${params}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.USAJOBS_API_KEY}`,
      'Host':          'data.usajobs.gov',
      'User-Agent':    process.env.USAJOBS_USER_AGENT,
    },
  });

  if (!res.ok) {
    console.error('USAJOBS error:', res.status);
    return [];
  }

  const data = await res.json();
  const items = data.SearchResult?.SearchResultItems || [];

  return items.map(item => {
    const d = item.MatchedObjectDescriptor;
    const pos = d.PositionRemuneration?.[0] || {};
    const loc = d.PositionLocation?.[0] || {};

    return {
      _source:     'usajobs',
      external_id: d.PositionID,
      title:       d.PositionTitle,
      company:     d.OrganizationName,
      location:    `${loc.CityName || ''}, ${loc.CountrySubDivisionCode || ''}`.trim(),
      lat:         loc.Latitude  ? parseFloat(loc.Latitude)  : null,
      lng:         loc.Longitude ? parseFloat(loc.Longitude) : null,
      salary_min:  pos.MinimumRange ? parseFloat(pos.MinimumRange) : null,
      salary_max:  pos.MaximumRange ? parseFloat(pos.MaximumRange) : null,
      description: d.QualificationSummary || d.JobSummary || '',
      url:         d.PositionURI,
      posted_at:   d.PublicationStartDate || null,
      pay_scale:   pos.RateIntervalCode || null, // GS scale info
    };
  });
};
