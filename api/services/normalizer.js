const { v4: uuid } = require('uuid');

/**
 * Normalize any raw job listing to the common DWJ schema
 */
function normalize(raw) {
  return {
    id:               uuid(),
    source:           raw._source,
    external_id:      String(raw.external_id || ''),
    title:            clean(raw.title),
    company:          clean(raw.company),
    location:         clean(raw.location),
    lat:              raw.lat   ? parseFloat(raw.lat)   : null,
    lng:              raw.lng   ? parseFloat(raw.lng)   : null,
    distance_miles:   null,   // filled by Python ranker after geocoding
    salary_min:       raw.salary_min ? Math.round(raw.salary_min) : null,
    salary_max:       raw.salary_max ? Math.round(raw.salary_max) : null,
    salary_est:       null,   // filled by Python salary estimator
    salary_confidence:'unknown', // overwritten after estimation
    description:      (raw.description || '').slice(0, 2000),
    url:              raw.url || '',
    posted_at:        raw.posted_at ? new Date(raw.posted_at).toISOString() : null,
    is_remote:        !!raw.is_remote,
    is_multi_location: !!raw.is_multi_location,
    location_confidence: raw.location_confidence || null,
    match_score:      null,   // filled by ranker
    job_score:        null,   // filled by ranker
    reason:           null,   // filled by AI
    gap_skills:       [],     // filled by gap analysis
  };
}

function clean(str) {
  return (str || '').replace(/\s+/g, ' ').trim();
}

module.exports = { normalize };
