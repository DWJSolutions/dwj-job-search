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

// POST /api/search
router.post('/search', async (req, res, next) => {
  try {
    const { profile, zip_code, include_remote = false } = req.body;
    if (!profile || !zip_code) {
      return res.status(400).json({ error: 'profile and zip_code are required' });
    }

    // 1. Geocode ZIP
    const { lat, lon, city, state } = await geocodeZip(zip_code);
    const location = `${city}, ${state}`;

    // 2. Build search queries from resume
    const queries = [...(profile.titles || []), ...(profile.skills || []).slice(0, 3)];
    const primaryQuery = profile.titles?.[0] || queries[0] || 'analyst';

    // 3. Parallel fetch from all 4 sources
    const [adzunaRes, usaRes, museRes, careerjetRes] = await Promise.allSettled([
      fetchAdzuna(primaryQuery, location),
      fetchUSAJOBS(primaryQuery, location),
      fetchTheMuse(primaryQuery, location),
      fetchCareerJet(primaryQuery, location),
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
    const aiRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/rank-jobs`, {
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

    if (!aiRes.ok) throw new Error('Ranking service failed');
    const { ranked } = await aiRes.json();
    const top30 = ranked.slice(0, 30);

    // 7. Persist search session
    const search_id = uuid();
    const db = req.app.locals.db;
    await db.query(
      `INSERT INTO searches (id, zip_code, resume_json) VALUES ($1, $2, $3)`,
      [search_id, zip_code, JSON.stringify(profile)]
    );

    // Cache jobs
    for (const job of top30) {
      await db.query(
        `INSERT INTO job_cache
          (id, source, external_id, title, company, location, lat, lng,
           salary_min, salary_max, salary_est, salary_conf, description, url, posted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (source, external_id) DO NOTHING`,
        [job.id, job.source, job.external_id, job.title, job.company, job.location,
         job.lat, job.lng, job.salary_min, job.salary_max, job.salary_est,
         job.salary_confidence, job.description, job.url, job.posted_at]
      );
      await db.query(
        `INSERT INTO search_results (search_id, job_id, rank, match_score)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [search_id, job.id, job.rank, job.match_score]
      );
    }

    res.json({ search_id, count: top30.length });
  } catch (err) {
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
