-- Preserve richer ranked job data for local SQLite results cards.
ALTER TABLE search_results ADD COLUMN result_json TEXT;
