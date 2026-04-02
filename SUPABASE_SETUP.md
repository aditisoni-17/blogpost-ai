# Supabase Setup Instructions

## Step 1: Run Database Schema

1. Go to https://ssmwdgyhreqqwtxbuspz.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
5. Paste it in the SQL editor
6. Click **Run** to execute

This will create all tables with proper indexes and RLS policies.

## Step 2: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create new bucket**
3. Name: `blog-images`
4. Check **Public bucket**
5. Click **Create bucket**

## Step 3: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Go to **URL Configuration**
4. Under **Authorized redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
5. Save changes

## Step 4: Create a Test Admin User

### Option A: Using Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Email: `admin@test.com`
4. Password: `Test@123456`
5. Click **Create user**
6. Then manually insert into `users` table with role='admin'

### Option B: Using SQL
Run this query in SQL Editor:
```sql
INSERT INTO users (id, email, name, role)
SELECT id, email, email as name, 'admin' 
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## Step 5: Verify Setup

Run these queries in SQL Editor to verify:

```sql
-- Check users table
SELECT * FROM users;

-- Check posts table structure
SELECT * FROM posts LIMIT 1;

-- Check comments table structure
SELECT * FROM comments LIMIT 1;
```

All three tables should exist with no data initially.

## Important Notes

- ✅ RLS policies are automatically enabled
- ✅ Users created via auth.signUp() will automatically appear in the `users` table
- ✅ Timestamps are automatically set
- ✅ Indexes are created for performance

## Troubleshooting

If you get an error like "Table does not exist":
- Ensure you executed the entire SQL migration
- Check that no errors were shown during execution
- Refresh the page and try again

If RLS policies are blocking queries:
- Make sure you're authenticated in the app
- Check user_id matches the authenticated user
- Admins have access to all data regardless of ownership
