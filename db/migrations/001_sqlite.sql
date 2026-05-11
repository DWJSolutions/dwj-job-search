-- DWJ Job Search — SQLite schema for local testing

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS searches (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  zip_code    TEXT NOT NULL,
  resume_json TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_cache (
  id              TEXT PRIMARY KEY,
  source          TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  title           TEXT,
  company         TEXT,
  location        TEXT,
  lat             REAL,
  lng             REAL,
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_est      INTEGER,
  salary_conf     TEXT DEFAULT 'unknown',
  description     TEXT,
  url             TEXT,
  posted_at       TEXT,
  cached_at       TEXT DEFAULT (datetime('now')),
  match_score     REAL,
  job_score       REAL,
  reason          TEXT,
  gap_skills      TEXT DEFAULT '[]',
  UNIQUE (source, external_id)
);

CREATE TABLE IF NOT EXISTS search_results (
  search_id   TEXT NOT NULL,
  job_id      TEXT NOT NULL,
  rank        INTEGER,
  match_score REAL,
  result_json TEXT,
  PRIMARY KEY (search_id, job_id)
);

CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id            TEXT PRIMARY KEY,
  title_key     TEXT NOT NULL,
  metro_code    TEXT,
  source        TEXT DEFAULT 'static',
  salary_p25    INTEGER,
  salary_median INTEGER,
  salary_p75    INTEGER,
  fetched_at    TEXT DEFAULT (datetime('now')),
  UNIQUE (title_key, metro_code, source)
);

CREATE TABLE IF NOT EXISTS company_ratings (
  id               TEXT PRIMARY KEY,
  company_name     TEXT UNIQUE NOT NULL,
  glassdoor_rating REAL,
  review_count     INTEGER,
  source           TEXT DEFAULT 'glassdoor',
  fetched_at       TEXT DEFAULT (datetime('now'))
);
