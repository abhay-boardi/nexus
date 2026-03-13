# Skill Taxonomy Build Spec

## What exists
- Nexus app at /home/user/workspace/nexus/ (Express + Vite + React + Tailwind + shadcn/ui)
- Supabase backend (URL: https://jlgstbucwawuntatrgvy.supabase.co, Service Key in .env)
- Existing `job_skills` table with basic keyword extraction
- Existing `jd_enrichment` pipeline type in API
- O*NET data downloaded to /home/user/workspace/nexus/data/

## O*NET Data Files
- `onet_skills.txt` - 35 unique skills (Active Listening, Critical Thinking, etc.) - TSV with columns: O*NET-SOC Code, Element ID, Element Name, Scale ID, Data Value, N, Standard Error, Lower CI Bound, Upper CI Bound, Recommend Suppress, Not Relevant, Date, Domain Source
- `onet_knowledge.txt` - 33 unique knowledge areas (Administration and Management, Biology, etc.) - same format
- `onet_abilities.txt` - 52 unique abilities (Deductive Reasoning, etc.) - same format
- `onet_tech_skills.txt` - 8768 unique technology/tool names across 135 categories - TSV with columns: O*NET-SOC Code, Example, Commodity Code, Commodity Title, Hot Technology, In Demand
- `onet_content_model.txt` - descriptions for each element - TSV with columns: Element ID, Element Name, Description

## What to build

### 1. New Supabase table: `taxonomy_skills`
Run this SQL via the Supabase API (service key):
```sql
CREATE TABLE taxonomy_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,  -- 'skill', 'knowledge', 'ability', 'technology', 'soft_skill'
    subcategory TEXT,        -- e.g. 'programming', 'framework', 'cloud', 'Cognitive Abilities'
    description TEXT,
    source TEXT NOT NULL,    -- 'onet', 'esco', 'custom'
    parent_id UUID REFERENCES taxonomy_skills(id),
    is_hot_technology BOOLEAN DEFAULT false,
    is_in_demand BOOLEAN DEFAULT false,
    aliases TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_taxonomy_skills_external ON taxonomy_skills (external_id, source);
CREATE INDEX idx_taxonomy_skills_name ON taxonomy_skills USING gin (name gin_trgm_ops);
CREATE INDEX idx_taxonomy_skills_category ON taxonomy_skills (category);
CREATE INDEX idx_taxonomy_skills_source ON taxonomy_skills (source);

-- Also add a taxonomy_skill_id FK to job_skills for mapping
ALTER TABLE job_skills ADD COLUMN taxonomy_skill_id UUID REFERENCES taxonomy_skills(id);
CREATE INDEX idx_job_skills_taxonomy ON job_skills (taxonomy_skill_id);

-- RLS policy
ALTER TABLE taxonomy_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON taxonomy_skills FOR ALL USING (true) WITH CHECK (true);
```

### 2. Load O*NET data
Parse the TSV files and insert into taxonomy_skills:
- From onet_content_model.txt: get Element ID, Element Name, Description for skills (2.A.*), knowledge (2.C.*), abilities (1.A.*)
- From onet_tech_skills.txt: deduplicate by (Example name), use Commodity Title as subcategory
- Use Element ID as external_id with 'onet' source

### 3. Upgrade JD Enrichment pipeline
Replace the keyword-based `executeJDEnrichment` with OpenAI-powered extraction:
- Env var: OPENAI_API_KEY (will be added to .env)
- Use GPT-4o-mini for cost efficiency
- Prompt: send JD text, ask for structured JSON output with extracted skills, confidence scores, and categories
- Match extracted skills against taxonomy_skills table
- Insert into job_skills with taxonomy_skill_id when matched

### 4. New API endpoints
- GET /api/taxonomy - list taxonomy skills with filters (category, source, search)
- GET /api/taxonomy/:id - get single taxonomy skill with job count
- GET /api/taxonomy/stats - aggregate stats (top skills by job count, skills by category)
- GET /api/jobs/:id/skills - get extracted skills for a job with taxonomy mapping

### 5. New frontend pages
- Taxonomy page: searchable/filterable table of all taxonomy skills, with job count column
- JD Analyzer: select a job or paste text, show extracted skills mapped to taxonomy
