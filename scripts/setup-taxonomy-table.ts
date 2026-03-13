import pg from "pg";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_KEY env var is required. Set it in .env");
  process.exit(1);
}

async function main() {
  // Try multiple connection approaches
  const connectionStrings = [
    `postgresql://postgres.jlgstbucwawuntatrgvy:${SERVICE_KEY}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.jlgstbucwawuntatrgvy:${SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.jlgstbucwawuntatrgvy:${SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  ];

  let pool: pg.Pool | null = null;

  for (const connStr of connectionStrings) {
    try {
      const region = connStr.match(/aws-0-([^.]+)/)?.[1] || "unknown";
      console.log(`Trying region: ${region}...`);
      pool = new pg.Pool({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      const res = await pool.query("SELECT 1 as test");
      console.log("Connected successfully!", res.rows);
      break;
    } catch (e: any) {
      console.log(`Failed: ${e.message}`);
      if (pool) await pool.end();
      pool = null;
    }
  }

  if (!pool) {
    console.error("Could not connect to database. Trying direct Supabase connection...");
    // Try the direct connection (port 5432)
    const directStrings = [
      `postgresql://postgres:${SERVICE_KEY}@db.jlgstbucwawuntatrgvy.supabase.co:5432/postgres`,
    ];
    for (const connStr of directStrings) {
      try {
        console.log("Trying direct connection...");
        pool = new pg.Pool({
          connectionString: connStr,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 8000,
        });
        const res = await pool.query("SELECT 1 as test");
        console.log("Connected!", res.rows);
        break;
      } catch (e: any) {
        console.log(`Failed: ${e.message}`);
        if (pool) await pool.end();
        pool = null;
      }
    }
  }

  if (!pool) {
    console.error("All connection attempts failed. Exiting.");
    process.exit(1);
  }

  try {
    // Enable pg_trgm extension
    console.log("Enabling pg_trgm extension...");
    await pool.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    // Create taxonomy_skills table
    console.log("Creating taxonomy_skills table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS taxonomy_skills (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        external_id TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        description TEXT,
        source TEXT NOT NULL,
        parent_id UUID REFERENCES taxonomy_skills(id),
        is_hot_technology BOOLEAN DEFAULT false,
        is_in_demand BOOLEAN DEFAULT false,
        aliases TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    // Create indexes
    console.log("Creating indexes...");
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_taxonomy_skills_external ON taxonomy_skills (external_id, source);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_taxonomy_skills_name ON taxonomy_skills USING gin (name gin_trgm_ops);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_taxonomy_skills_category ON taxonomy_skills (category);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_taxonomy_skills_source ON taxonomy_skills (source);
    `);

    // Add taxonomy_skill_id to job_skills
    console.log("Adding taxonomy_skill_id to job_skills...");
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'job_skills' AND column_name = 'taxonomy_skill_id'
        ) THEN
          ALTER TABLE job_skills ADD COLUMN taxonomy_skill_id UUID REFERENCES taxonomy_skills(id);
        END IF;
      END $$;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_skills_taxonomy ON job_skills (taxonomy_skill_id);
    `);

    // Enable RLS
    console.log("Enabling RLS...");
    await pool.query(`ALTER TABLE taxonomy_skills ENABLE ROW LEVEL SECURITY;`);
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'taxonomy_skills' AND policyname = 'Service role full access'
        ) THEN
          CREATE POLICY "Service role full access" ON taxonomy_skills FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);

    console.log("Done! taxonomy_skills table created successfully.");
  } catch (e: any) {
    console.error("Error creating table:", e.message);
  } finally {
    await pool.end();
  }
}

main();
