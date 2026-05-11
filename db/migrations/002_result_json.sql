-- Preserve richer ranked job data for results cards.
ALTER TABLE search_results
ADD COLUMN IF NOT EXISTS result_json JSONB;
