const router = require('express').Router();
const fetch = require('node-fetch');
const { v4: uuid } = require('uuid');
const fetchAdzuna = require('../services/adzuna');
const fetchUSAJOBS = require('../services/usajobs');
const fetchTheMuse = require('../services/themuse');
const fetchCareerJet = require('../services/careerjet');
const fetchRemotive = require('../services/remotive');
const fetchArbeitnow = require('../services/arbeitnow');
const { normalize } = require('../services/normalizer');
const { deduplicate } = require('../services/deduplicator');
const { geocodeZip } = require('../services/geocoder');

const SOURCES = [
  { name: 'adzuna', label: 'Adzuna' },
  { name: 'usajobs', label: 'USAJOBS' },
  { name: 'themuse', label: 'The Muse' },
  { name: 'careerjet', label: 'CareerJet' },
  { name: 'remotive', label: 'Remotive' },
  { name: 'arbeitnow', label: 'Arbeitnow' },
];

function fetchWithTimeout(url, options, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
}

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(label + ' timed out')), timeoutMs);
    }),
  ]);
}

let _migrated = false;
async function ensureAiDataColumn(db) {
  if (_migrated) return;
  try {
    await db.query('ALTER TABLE search_results ADD COLUMN IF NOT EXISTS ai_data TEXT');
  } catch (e) {
    try { await db.query('ALTER TABLE search_results ADD COLUMN ai_data TEXT'); } catch (_) {}
  }
  _migrated = true;
}

async function insertSearchSession(db, searchId, zipCode, profile) {
  try {
    await db.query(
      'INSERT INTO searches (id, zip_code, resume_json) VALUES ($1, $2, $3)',
      [searchId, zipCode, JSON.stringify(profile)]
    );
  } catch (err) {
    if (err.code !== '42703' || !/resume_json/.test(err.message || '')) throw err;
    await db.query('INSERT INTO searches (id, zip_code) VALUES ($1, $2)', [searchId, zipCode]);
  }
}

function buildSearchProfile({ profile, job_title }) {
  if (profile) return profile;
  const title = (job_title || '').trim();
  return {
    titles: title ? [title] : [],
    skills: title ? title.split(/\s+/).filter(Boolean) : [],
    experience_years: 0,
    education: '',
    industries: [],
    search_query: title,
  };
}

function collectAiData(job) {
  return {
    salary_signal: job.salary_signal ?? null,
    skills_signal: job.skills_signal ?? null,
    title_signal: job.title_signal ?? null,
    growth_signal: job.growth_signal ?? null,
    growth_score: job.growth_score ?? null,
    badge: job.badge || job.match_action || null,
    match_action: job.match_action || job.badge || null,
    ats_score: job.ats_score ?? null,
    ats_keywords: job.ats_keywords || job.ats_matched || [],
    ats_missing: job.ats_missing || [],
    gap_skills: job.gap_skills || [],
    matched_skills: job.matched_skills || [],
    gap_summary: job.gap_summary || '',
    reason: job.reason || '',
    salary_confidence: job.salary_confidence || job.salary_conf || 'unknown',
  };
}

async function insertSearchResult(db, searchId, cachedJobId, job) {
  const aiData = JSON.stringify(collectAiData(job));
  await db.query(
    'INSERT INTO search_results (search_id, job_id, rank, match_score, ai_data) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
    [searchId, cachedJobId, job.rank, job.match_score, aiData]
  );
}

async function upsertJobCache(db, job) {
  const result = await db.query(
    `INSERT INTO job_cache
      (id, source, external_id, title, company, location, lat, lng,
       salary_min, salary_max, salary_est, salary_conf, description, url, posted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (source, external_id) DO UPDATE SET
       title=EXCLUDED.title, company=EXCLUDED.company, location=EXCLUDED.location,
       lat=EXCLUDED.lat, lng=EXCLUDED.lng, salary_min=EXCLUDED.salary_min,
       salary_max=EXCLUDED.salary_max, salary_est=EXCLUDED.salary_est,
       salary_conf=EXCLUDED.salary_conf, description=EXCLUDED.description,
       url=EXCLUDED.url, posted_at=EXCLUDED.posted_at
     RETURNING id`,
    [
      job.id, job.source, job.external_id, job.title, job.company, job.location,
      job.lat, job.lng, job.salary_min, job.salary_max, job.salary_est,
      job.salary_confidence, job.description, job.url, job.posted_at,
    ]
  );
  return result.rows[0].id;
}

async function runSearch(req, res, next, mode = 'resume') {
  try {
    const { zip_code, include_remote = false, job_title } = req.body;
    const profile = buildSearchProfile(req.body);

    if (!zip_code || (!profile && !job_title)) {
      return res.status(400).json({ error: 'zip_code and search input are required' });
    }
    if (!process.env.PYTHON_SERVICE_URL) {
      return res.status(503).json({ error: 'AI ranking service is not configured' });
    }

    const { lat, lon, city, state } = await geocodeZip(zip_code);
    const location = city + ', ' + state;
    const queries = [...(profile.titles || []), ...(profile.skills || []).slice(0, 3)];
    const primaryQuery = job_title || profile.search_query || profile.titles?.[0] || queries[0] || 'analyst';

    const [adzunaRes, usaRes, museRes, careerjetRes, remotiveRes, arbeitnowRes] = await Promise.allSettled([
      withTimeout(fetchAdzuna(primaryQuery, location), 15000, 'Adzuna'),
      withTimeout(fetchUSAJOBS(primaryQuery, location), 15000, 'USAJOBS'),
      withTimeout(fetchTheMuse(primaryQuery, location), 15000, 'The Muse'),
      withTimeout(fetchCareerJet(primaryQuery, location), 15000, 'CareerJet'),
      withTimeout(fetchRemotive(primaryQuery), 15000, 'Remotive'),
      withTimeout(fetchArbeitnow(primaryQuery), 15000, 'Arbeitnow'),
    ]);

    const settled = [
      { label: 'adzuna', result: adzunaRes },
      { label: 'usajobs', result: usaRes },
      { label: 'themuse', result: museRes },
      { label: 'careerjet', result: careerjetRes },
      { label: 'remotive', result: remotiveRes },
      { label: 'arbeitnow', result: arbeitnowRes },
    ];

    const sourceStatus = {};
    for (const { label, result } of settled) {
      if (result.status === 'fulfilled') {
        sourceStatus[label] = 'ok (' + result.value.length + ')';
      } else {
        sourceStatus[label] = 'error: ' + (result.reason?.message || 'unknown');
        console.warn('[search] ' + label + ' failed:', result.reason?.message);
      }
    }
    console.info('[search] source results:', sourceStatus);

    const raw = settled.filter(({ result }) => result.status === 'fulfilled').flatMap(({ result }) => result.value);
    const normalized = raw.map(j => normalize(j));
    const unique = deduplicate(normalized);

    if (unique.length === 0) {
      return res.status(200).json({ search_id: null, count: 0, sources: sourceStatus, message: 'No jobs found from any source' });
    }

    const aiRes = await fetchWithTimeout(process.env.PYTHON_SERVICE_URL + '/rank-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs: unique, profile, user_lat: lat, user_lon: lon, include_remote }),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      return res.status(502).json({ error: 'AI ranking service failed', details: details.slice(0, 500) });
    }

    const { ranked } = await aiRes.json();
    const top30 = ranked.slice(0, 30);
    const search_id = uuid();
    const db = req.app.locals.db;

    await insertSearchSession(db, search_id, zip_code, profile);
    await ensureAiDataColumn(db);

    for (const job of top30) {
      const cachedJobId = await upsertJobCache(db, job);
      await insertSearchResult(db, search_id, cachedJobId, job);
    }

    res.json({ search_id, count: top30.length, mode, sources: sourceStatus });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'AI ranking service timed out while waking up. Please try again in a minute.' });
    }
    next(err);
  }
}

router.post('/search', async (req, res, next) => {
  return runSearch(req, res, next, 'resume');
});

router.post('/search-jobtitle', async (req, res, next) => {
  return runSearch(req, res, next, 'jobTitle');
});

router.get('/results/:sid', async (req, res, next) => {
  try {
    const { sid } = req.params;
    const db = req.app.locals.db;
    const searchRow = await db.query('SELECT * FROM searches WHERE id=$1', [sid]);
    if (!searchRow.rows.length) return res.status(404).json({ error: 'Search not found' });

    const jobsResult = await db.query(
      'SELECT jc.*, sr.rank, sr.match_score, sr.ai_data FROM search_results sr JOIN job_cache jc ON jc.id = sr.job_id WHERE sr.search_id = $1 ORDER BY sr.rank ASC',
      [sid]
    );

    const jobs = jobsResult.rows.map(row => {
      let aiData = {};
      try { aiData = typeof row.ai_data === 'string' ? JSON.parse(row.ai_data) : (row.ai_data || {}); } catch (_) {}
      const { ai_data, ...rest } = row;
      return { ...rest, ...aiData };
    });

    res.json({
      meta: {
        zip_code: searchRow.rows[0].zip_code,
        total_fetched: jobs.length,
        created_at: searchRow.rows[0].created_at,
        sources: SOURCES,
      },
      jobs,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
