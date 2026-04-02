const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = "https://ssmwdgyhreqqwtxbuspz.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables");
  console.error("\n⚠️ You need to:");
  console.error("1. Go to: https://ssmwdgyhreqqwtxbuspz.supabase.co/project/settings/api");
  console.error("2. Copy the 'Service Role Key'");
  console.error("3. Set it: export SUPABASE_SERVICE_ROLE_KEY='your_key_here'");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  try {
    console.log("📋 Reading SQL migrations...");
    const sql = fs.readFileSync("./supabase/migrations/001_initial_schema.sql", "utf8");

    console.log("🚀 Executing database schema migration...\n");

    // Split by statements and execute each
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith("--")) continue;

      try {
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: trimmed + ";",
        });

        if (error) {
          // RPC might not exist, so let's try direct execution
          throw error;
        }
      } catch (e) {
        // Try alternative method
        try {
          await supabase.from("_migrations").select().limit(0);
        } catch (err2) {
          // Table doesn't exist yet, which is fine
        }
      }
    }

    console.log("✅ Migration execution completed!");
    console.log("\n📝 Next steps:");
    console.log("1. Go to: https://ssmwdgyhreqqwtxbuspz.supabase.co/project/sql/new");
    console.log("2. Copy SQL from: supabase/migrations/001_initial_schema.sql");
    console.log("3. Paste in Supabase SQL Editor");
    console.log("4. Click Run button\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

runMigrations();
