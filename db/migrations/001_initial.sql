-- DWJ Job Search — Initial Schema
-- Run with: psql $DATABASE_URL -f db/migrations/001_initial.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search sessions
CREATE TABLE IF NOT EXISTS searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  zip_code    VARCHAR(10) NOT NULL,
  resume_json JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_searches_user ON searches(user_id);
CREATE INDEX idx_searches_created ON searches(created_at DESC);

-- Job cache (deduped, normalized)
CREATE TABLE IF NOT EXISTS job_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           VARCHAR(20)   NOT NULL,
  external_id      VARCHAR(255)  NOT NULL,
  title            VARCHAR(255),
  company          VARCHAR(255),
  location         VARCHAR(255),
  lat              FLOAT,
  lng              FLOAT,
  salary_min       INTEGER,
  salary_max       INTEGER,
  salary_est       INTEGER,
  salary_conf      VARCHAR(20)   DEFAULT 'unknown',
  description      TEXT,
  url              VARCHAR(1000),
  posted_at        TIMESTAMPTZ,
  cached_at        TIMESTAMPTZ   DEFAULT NOW(),
  dedupe_group_id  UUID,
  is_canonical     BOOLEAN       DEFAULT TRUE,
  UNIQUE (source, external_id)
);
CREATE INDEX idx_job_cache_source ON job_cache(source);
CREATE INDEX idx_job_cache_title  ON job_cache(title);

-- Search results (join table)
CREATE TABLE IF NOT EXISTS search_results (
  search_id   UUID NOT NULL REFERENCES searches(id)  ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES job_cache(id) ON DELETE CASCADE,
  rank        INTEGER,
  match_score FLOAT,
  result_json JSONB,
  PRIMARY KEY (search_id, job_id)
);
CREATE INDEX idx_results_search ON search_results(search_id);

-- Salary benchmarks cache (BLS / Glassdoor data)
CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_key      VARCHAR(255) NOT NULL,
  metro_code     VARCHAR(20),
  source         VARCHAR(30)  DEFAULT 'static',
  salary_p25     INTEGER,
  salary_median  INTEGER,
  salary_p75     INTEGER,
  sample_size    INTEGER,
  fetched_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (title_key, metro_code, source)
);

-- Company ratings cache
CREATE TABLE IF NOT EXISTS company_ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     VARCHAR(255) UNIQUE NOT NULL,
  glassdoor_rating FLOAT,
  review_count     INTEGER,
  source           VARCHAR(30)  DEFAULT 'glassdoor',
  fetched_at       TIMESTAMPTZ  DEFAULT NOW()
);
