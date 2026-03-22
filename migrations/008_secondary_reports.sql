-- Feature 9: Secondary Report Processor
-- MANUAL STEP: Create a 'reports' storage bucket in Supabase Dashboard
-- Go to Storage > New Bucket > Name: "reports" > Public: Yes

CREATE TABLE IF NOT EXISTS secondary_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    source_org TEXT,
    report_year INTEGER,
    report_type TEXT,
    region TEXT,
    file_url TEXT,
    file_type TEXT,
    file_size_bytes INTEGER,
    page_count INTEGER,
    total_chunks INTEGER,
    processed_chunks INTEGER DEFAULT 0,
    summary TEXT,
    key_findings JSONB DEFAULT '[]',
    extracted_data JSONB DEFAULT '{}',
    processing_status TEXT DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_skill_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES secondary_reports(id) ON DELETE CASCADE NOT NULL,
    taxonomy_skill_id UUID REFERENCES taxonomy_skills(id),
    skill_name TEXT NOT NULL,
    mention_context TEXT,
    ranking INTEGER,
    growth_indicator TEXT,
    data_point TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_skills_report ON report_skill_mentions (report_id);
CREATE INDEX IF NOT EXISTS idx_report_skills_taxonomy ON report_skill_mentions (taxonomy_skill_id);
CREATE INDEX IF NOT EXISTS idx_secondary_reports_status ON secondary_reports (processing_status);
