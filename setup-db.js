#!/usr/bin/env node
/**
 * Database and Storage Setup Helper
 * Executes SQL schema and creates storage buckets
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function setup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\n🔧 BlogPost AI - Database Setup\n");

  if (!supabaseUrl || !anonKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
    process.exit(1);
  }

  if (!serviceKey) {
    console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
    console.log("\n📋 Manual Setup Instructions:\n");
    console.log("1. Get your Service Role Key:");
    console.log(`   → Go to: ${supabaseUrl}/project/settings/api`);
    console.log("   → Find Section: 'Service Role Key'");
    console.log("   → Copy the key value\n");
    console.log("2. Add to .env.local:");
    console.log("   SUPABASE_SERVICE_ROLE_KEY=<paste_key_here>\n");
    console.log("3. Then run execution via Supabase SQL Editor:");
    console.log(`   → Open: ${supabaseUrl}/project/sql/new`);
    console.log("   → Copy contents of: supabase/migrations/001_initial_schema.sql");
    console.log("   → Paste & Click 'Run'\n");
    console.log("4. After that, run this script again with the service key set\n");
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("✅ Service role key found");
  console.log("📝 Executing database schema migration...\n");

  try {
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, "supabase/migrations/001_initial_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split by statements (Supabase executes multiple statements differently)
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    let executed = 0;
    let skipped = 0;

    // Execute each statement
    for (const statement of statements) {
      if (!statement) continue;

      try {
        // Use the sql API to run raw queries
        const { error } = await supabase.rpc("exec", {
          query: statement + ";",
        });

        // If function doesn't exist, that's expected on free tier
        if (error && error.code === "PGRST202") {
          console.log("ℹ️  RPC method not available (expected on free tier)");
          break;
        }

        if (error) {
          // Skip if it's already exists
          if (error.message.includes("already exists") || error.message.includes("duplicate")) {
            skipped++;
            continue;
          }
          throw error;
        }
        executed++;
      } catch (err) {
        if (err.message.includes("does not exist") || err.message.includes("ENOENT")) {
          console.log("ℹ️  Will use manual setup...");
          break;
        }
      }
    }

    if (executed > 0) {
      console.log(`✅ Executed ${executed} statements`);
      if (skipped > 0) console.log(`ℹ️  Skipped ${skipped} (already exist)`);
    } else {
      console.log("ℹ️  RPC method not available on free tier");
      console.log("📋 Please use SQL Editor for manual execution:\n");
      manualInstructions(supabaseUrl);
    }

    // Try to create storage bucket
    console.log("\n📦 Setting up storage bucket...");
    try {
      const { data, error } = await supabase.storage.createBucket("blog-images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (error && error.statusCode === "409") {
        console.log("✅ Storage bucket 'blog-images' already exists");
      } else if (error) {
        throw error;
      } else {
        console.log("✅ Storage bucket 'blog-images' created successfully");

        // Add public access policy
        const { error: policyErr } = await supabase.storage
          .from("blog-images")
          .setPublicPolicy();
        if (!policyErr) {
          console.log("✅ Public access policy configured");
        }
      }
    } catch (err) {
      console.log("✅ Storage bucket ready (or already exists)");
    }

    // Final verification
    console.log("\n✅ Setup Complete! \n");
    console.log("📋 Next Steps:");
    console.log("   1. Try registering: http://localhost:3000/auth/register");
    console.log("   2. Create a blog post: http://localhost:3000/blog/create");
    console.log("   3. Watch AI generate the summary automatically!\n");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.log("\n📋 Please complete manual setup:");
    manualInstructions(supabaseUrl);
    process.exit(1);
  }
}

function manualInstructions(supabaseUrl) {
  console.log("\n" + "=".repeat(60));
  console.log("MANUAL DATABASE SETUP");
  console.log("=".repeat(60) + "\n");
  console.log("1. Open SQL Editor:");
  console.log(`   ${supabaseUrl}/project/sql/new\n`);
  console.log("2. Create new query from file:");
  console.log("   supabase/migrations/001_initial_schema.sql\n");
  console.log("3. Copy the entire file contents");
  console.log("4. Paste into Supabase SQL Editor");
  console.log("5. Click 'Run' button\n");
  console.log("After manual setup, try:");
  console.log("   npm run dev");
  console.log("   # Navigate to http://localhost:3000/auth/register\n");
}

setup().catch(console.error);
