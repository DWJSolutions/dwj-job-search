const router     = require('express').Router();
const fetch      = require('node-fetch');
const { v4: uuid } = require('uuid');
const fetchAdzuna    = require('../services/adzuna');
const fetchUSAJOBS   = require('../services/usajobs');
const fetchTheMuse   = require('../services/themuse');
const fetchCareerJet = require('../services/careerjet');
const { normalize }  = require('../services/normalizer');
const { deduplicate } = require('../services/deduplicator');
const { geocodeZip }  = require('../services/geocoder');

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
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

async function insertSearchSession(db, searchId, zipCode, profile) {
  try {
    await db.query(
      `INSERT INTO searches (id, zip_code, resume_json) VALUES ($1, $2, $3)`,
      [searchId, zipCode, JSON.stringify(profile)]
    );
  } catch (err) {
    if (err.code !== '42703' || !/resume_json/.test(err.message || '')) throw err;

    await db.query(
      `INSERT INTO searches (id, zip_code) VALUES ($1, $2)`,
      [searchId, zipCode]
    );
  }
}

async function upsertJobCache(db, job) {
  const result = await db.query(
    `INSERT INTO job_cache
      (id, source, external_id, title, company, location, lat, lng,
       salary_min, salary_max, salary_est, salary_conf, description, url, posted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (source, external_id) DO UPDATE SET
       title = EXCLUDED.title,
       company = EXCLUDED.company,
       location = EXCLUDED.location,
       lat = EXCLUDED.lat,
       lng = EXCLUDED.lng,
       salary_min = EXCLUDED.salary_min,
       salary_max = EXCLUDED.salary_max,
       salary_est = EXCLUDED.salary_est,
       salary_conf = EXCLUDED.salary_conf,
       description = EXCLUDED.description,
       url = EXCLUDED.url,
       posted_at = EXCLUDED.posted_at
     RETURNING id`,
    [job.id, job.source, job.external_id, job.title, job.company, job.location,
     job.lat, job.lng, job.salary_min, job.salary_max, job.salary_est,
     job.salary_confidence, job.description, job.url, job.posted_at]
  );

  return result.rows[0].id;
}

// POST /api/search
router.post('/search', async (req, res, next) => {
  try {
    const { profile, zip_code, include_remote = false } = req.body;
    if (!profile || !zip_code) {
      return res.status(400).json({ error: 'profile and zip_code are required' });
    }
    if (!process.env.PYTHON_SERVICE_URL) {
      return res.status(503).json({ error: 'AI ranking service is not configured' });
    }

    // 1. Geocode ZIP
    const { lat, lon, city, state } = await geocodeZip(zip_code);
    const location = `${city}, ${state}`;

    // 2. Build search queries from resume
    const queries = [...(profile.titles || []), ...(profile.skills || []).slice(0, 3)];
    const primaryQuery = profile.titles?.[0] || queries[0] || 'analyst';

    // 3. Parallel fetch from all 4 sources
    const [adzunaRes, usaRes, museRes, careerjetRes] = await Promise.allSettled([
      withTimeout(fetchAdzuna(primaryQuery, location), 15000, 'Adzuna'),
      withTimeout(fetchUSAJOBS(primaryQuery, location), 15000, 'USAJOBS'),
      withTimeout(fetchTheMuse(primaryQuery, location), 15000, 'The Muse'),
      withTimeout(fetchCareerJet(primaryQuery, location), 15000, 'CareerJet'),
    ]);

    const raw = [adzunaRes, usaRes, museRes, careerjetRes]
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // 4. Normalize to common schema
    const normalized = raw.map(j => normalize(j));

    // 5. Deduplicate
    const unique = deduplicate(normalized);

    if (unique.length === 0) {
      return res.status(200).json({ search_id: null, count: 0, message: 'No jobs found from any source' });
    }

    // 6. Send to Python AI for salary estimation, gap analysis & ranking
    const aiRes = await fetchWithTimeout(`${process.env.PYTHON_SERVICE_URL}/rank-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobs: unique,
        profile,
        user_lat: lat,
        user_lon: lon,
        include_remote,
      }),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      return res.status(502).json({
        error: 'AI ranking service failed',
        details: details.slice(0, 500),
      });
    }

    const { ranked } = await aiRes.json();
    const top30 = ranked.slice(0, 30);

    // 7. Persist search session
    const search_id = uuid();
    const db = req.app.locals.db;
    await insertSearchSession(db, search_id, zip_code, profile);

    // Cache jobs
    for (const job of top30) {
      const cachedJobId = await upsertJobCache(db, job);

      await db.query(
        `INSERT INTO search_results (search_id, job_id, rank, match_score)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [search_id, cachedJobId, job.rank, job.match_score]
      );
    }

    res.json({ search_id, count: top30.length });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        error: 'AI ranking service timed out while waking up. Please try again in a minute.',
      });
    }
    next(err);
  }
});

// GET /api/results/:sid
router.get('/results/:sid', async (req, res, next) => {
  try {
    const { sid } = req.params;
    const db = req.app.locals.db;

    const searchRow = await db.query('SELECT * FROM searches WHERE id=$1', [sid]);
    if (!searchRow.rows.length) return res.status(404).json({ error: 'Search not found' });

    const jobsResult = await db.query(
      `SELECT jc.*, sr.rank, sr.match_score
       FROM search_results sr
       JOIN job_cache jc ON jc.id = sr.job_id
       WHERE sr.search_id = $1
       ORDER BY sr.rank ASC`,
      [sid]
    );

    res.json({
      meta: {
        zip_code: searchRow.rows[0].zip_code,
        total_fetched: jobsResult.rows.length,
        created_at: searchRow.rows[0].created_at,
      },
      jobs: jobsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
