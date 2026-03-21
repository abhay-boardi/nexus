-- Pipeline Schedules: recurring automated pipeline runs
-- Run this migration via Supabase SQL Editor
--
-- IMPORTANT: Set the CRON_SECRET environment variable in Vercel dashboard.
-- Generate a random value, e.g.:  openssl rand -hex 32
-- Example: CRON_SECRET=a1b2c3d4e5f6...

CREATE TABLE pipeline_schedules (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             TEXT        NOT NULL,
    pipeline_type    TEXT        NOT NULL,
    config           JSONB       NOT NULL,
    frequency        TEXT        NOT NULL,
    cron_expression  TEXT,
    is_active        BOOLEAN     DEFAULT true,
    max_runs         INTEGER,
    total_runs       INTEGER     DEFAULT 0,
    last_run_at      TIMESTAMPTZ,
    last_run_status  TEXT,
    next_run_at      TIMESTAMPTZ,
    credit_limit     INTEGER,
    created_by       TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_schedules_active ON pipeline_schedules (is_active, next_run_at);

ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES pipeline_schedules(id);
