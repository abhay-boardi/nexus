-- Feature 1: CSV Data Uploader Engine - Database Tables
-- Run this migration against your Supabase PostgreSQL database

-- Enable trigram similarity for fuzzy dedup
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CSV Uploads tracking table
CREATE TABLE IF NOT EXISTS csv_uploads (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename       TEXT        NOT NULL,
    source_type    TEXT        NOT NULL,          -- 'clay_linkedin', 'google_jobs', 'custom'
    total_rows     INTEGER     NOT NULL,
    processed_rows INTEGER     DEFAULT 0,
    skipped_rows   INTEGER     DEFAULT 0,
    failed_rows    INTEGER     DEFAULT 0,
    error_log      JSONB       DEFAULT '[]',       -- [{row: N, error: "...", raw: {...}}]
    status         TEXT        DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    uploaded_by    TEXT,
    created_at     TIMESTAMPTZ DEFAULT now(),
    completed_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_csv_uploads_status ON csv_uploads (status, created_at DESC);

-- 2. Add normalized columns to jobs table for dedup
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title_normalized TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name_normalized TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_unit TEXT;

-- 3. Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin (title_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_company_trgm ON jobs USING gin (company_name_normalized gin_trgm_ops);
