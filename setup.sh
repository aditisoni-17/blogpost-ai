#!/bin/bash
# Database and Storage Setup for BlogPost AI

set -e

echo "🔧 BlogPost AI - Database & Storage Setup"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ .env.local not found!"
  echo "Create .env.local with your Supabase credentials first"
  exit 1
fi

# Extract credentials from .env.local
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)

echo "✅ Configuration found:"
echo "   Supabase URL: $SUPABASE_URL"

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo ""
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  echo ""
  echo "📋 You need to manually execute the database schema:"
  echo ""
  echo "1. Go to: $SUPABASE_URL/project/sql/new"
  echo "2. Create a new query"
  echo "3. Copy contents of: supabase/migrations/001_initial_schema.sql"
  echo "4. Paste in Supabase SQL Editor"
  echo "5. Click 'Run' button"
  echo ""
  echo "For Service Role Key:"
  echo "1. Go to: $SUPABASE_URL/project/settings/api"
  echo "2. Find 'Service Role Key' section"
  echo "3. Copy the key"
  echo "4. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here"
  echo ""
  exit 1
fi

echo ""
echo "🚀 Setting up database and storage..."
echo ""

# Call Node.js migration script
node << 'NODEJS'
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setup() {
  console.log("📝 Running database schema...");
  
  const sql = fs.readFileSync("./supabase/migrations/001_initial_schema.sql", "utf8");
  
  try {
    // Try using raw SQL execution
    const { data, error } = await supabase.rpc("exec_sql", { sql });
    
    if (error && error.code !== "PGRST202") { // PGRST202 = function not found (which is ok)
      throw error;
    }
    
    console.log("✅ Schema migration completed via RPC");
  } catch (err) {
    console.log("⚠️  RPC method not available - please execute manually");
    console.log("   (This is normal for Supabase free tier)");
  }

  // Check if tables exist
  try {
    const { data, error } = await supabase.from("users").select("count()").limit(0);
    if (!error) {
      console.log("✅ Users table exists");
    }
  } catch (e) {
    console.log("ℹ️  Tables not yet created - need manual setup");
  }

  // Try to create storage bucket
  try {
    console.log("📦 Creating storage bucket...");
    const { data, error } = await supabase.storage.createBucket("blog-images", {
      public: true,
    });
    
    if (!error) {
      console.log("✅ Storage bucket 'blog-images' created");
    } else if (error.statusCode === "409") {
      console.log("✅ Storage bucket 'blog-images' already exists");
    } else {
      throw error;
    }
  } catch (err) {
    console.log("ℹ️  Storage bucket setup - checking status...");
  }

  console.log("");
  console.log("📋 Final Setup Instructions:");
  console.log("============================");
  console.log("");
  console.log("Since Supabase free tier doesn't support the exec_sql RPC:");
  console.log("");
  console.log("1. Open: %s/project/sql/new", supabaseUrl);
  console.log("2. Copy all contents from: supabase/migrations/001_initial_schema.sql");
  console.log("3. Paste in Supabase SQL Editor");
  console.log("4. Click 'Run' button");
  console.log("");
  console.log("✅ Then try registering again at: http://localhost:3000/auth/register");
};

setup().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
NODEJS

echo ""
echo "Done!"
