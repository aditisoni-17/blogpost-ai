# 🔧 Supabase Setup - Step by Step

This guide walks you through setting up your Supabase project for the BlogPost AI application.

## ✅ Prerequisites
- Supabase Account (https://supabase.com)
- Supabase Project URL
- Service Role Key (from Supabase dashboard)

**Current Setup:**
- ✅ Project URL: https://ssmwdgyhreqqwtxbuspz.supabase.co
- ✅ Anon Key: sb_publishable_DEl8pAtZ6ykXR7TanAjPoQ_Kf18Orjb

---

## Step 1: Access Supabase SQL Editor

1. Go to https://ssmwdgyhreqqwtxbuspz.supabase.co
2. Login with your credentials
3. In the left sidebar, click **SQL Editor**
4. Click **New Query** button
5. You should see a blank SQL editor

---

## Step 2: Copy Database Schema

Copy the **entire content** from `supabase/migrations/001_initial_schema.sql` in this project.

The schema includes:
- User role ENUM type
- Users table (extends auth.users)
- Posts table with AI summary field
- Comments table with approval workflow
- Proper indexes for performance
- Row-Level Security (RLS) policies
- Automatic timestamp triggers

---

## Step 3: Execute Schema in Supabase

1. Paste the entire SQL schema into the SQL Editor
2. Click the **Run** button (⚡ icon) in top right
3. Wait for the query to complete
4. You should see: `Query executed successfully`

✅ **Result**: All tables, indexes, and RLS policies are now created

---

## Step 4: Create Storage Bucket for Images

1. Go to **Storage** in the left sidebar
2. Click **Create a new bucket** button
3. Configure:
   - **Bucket name**: `blog-images`
   - **Public bucket**: ✅ CHECK THIS
   - Click **Create bucket**

✅ **Result**:  Can now upload images for blog posts

---

## Step 5: Enable Authentication

1. Go to **Authentication** in left sidebar
2. Click **Providers**
3. Ensure **Email** provider is `Enabled`
4. Click **Email** to configure:
   - Allow email registration: ✅ Enabled
   - Confirm email required: ✅ Enabled
   - Email change requires verification: ✅ Enabled

---

## Step 6: Configure Redirect URLs

1. In **Authentication**, go to **URL Configuration**
2. Under **Authorized redirect URLs**, add these URLs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   http://localhost:3000
   ```
3. If deploying to production, also add:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com
   ```
4. Click **Save**

✅ **Result**: Auth callback URLs are configured

---

## Step 7: Get Your Service Role Key

1. Go to **Settings** → **API**
2. Under **Project API keys**, find **Service Role Key**
3. Click the copy icon next to it
4. Add to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_copied_key
   ```

---

## Step 8: Create Test Admin User (Optional but Helpful)

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter:
   - Email: `admin@test.com`
   - Password: `Test@123456` (change this!)
   - Click **Create user**

4. Now run this SQL query in SQL Editor to make them admin:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@test.com';
   ```

✅ **Result**: Admin account created for testing

---

## Step 9: Create Test Author User (Optional)

1. Repeat Step 8 with:
   - Email: `author@test.com`
   - Password: `Test@123456`

2. Run this SQL query:
   ```sql
   UPDATE users 
   SET role = 'author' 
   WHERE email = 'author@test.com';
   ```

✅ **Result**: Author account created for testing

---

##  Step 10: Verify Setup

Run these queries in SQL Editor to verify everything is set up correctly:

### Check Users Table
```sql
SELECT * FROM users LIMIT 5;
```
**Expected**: Table exists, columns visible

### Check Posts Table
```sql
SELECT * FROM posts LIMIT 1;
```
**Expected**: All columns present (title, body, image_url, summary, etc.)

### Check Comments Table
```sql
SELECT * FROM comments LIMIT 1;
```
**Expected**: Comments table exists (even if empty)

### Check Indexes
```sql
SELECT * FROM pg_indexes WHERE tablename != 'pg_toast' ORDER BY tablename;
```
**Expected**: Indexes on (posts.author_id), (posts.created_at), (comments.post_id), etc.

### Check RLS is Enabled
```sql
SELECT * FROM information_schema.tables 
WHERE table_name IN ('users', 'posts', 'comments');
```
**Expected**: All tables have RLS enabled

---

## 🚨 Common Issues & Solutions

### Issue: "Table does not exist"
**Solution**: 
- Re-run the entire SQL schema
- Check if you copied the FULL schema (all 3 tables)
- Refresh the page and try again

### Issue: "Permission denied" on RLS
**Solution**:
- Make sure you're logged in as a user (not anonymous)
- Check that the user exists in the `users` table
- Verify RLS policies exist

### Issue: AI Summary not generating
**Solution**:
- Verify Google API key in `.env.local`
- Check API key has access to Gemini API
- Check quota limits in Google Cloud Console

### Issue: Image upload fails
**Solution**:
- Ensure storage bucket "blog-images" is public
- Check image URL is valid (try in browser)
- Verify Supabase Storage is enabled

### Issue: Comments not showing
**Solution**:
- Check if `is_approved = true` in database
- Verify RLS policy for comments
- Admin must approve before visibility

---

## 📋 Final Checklist

- [ ] SQL schema executed without errors
- [ ] Users table created with roles
- [ ] Posts table created with summary field
- [ ] Comments table created with is_approved field
- [ ] All indexes created
- [ ] RLS policies enabled
- [ ] Storage bucket "blog-images" created and public
- [ ] Email authentication enabled
- [ ] Redirect URLs configured
- [ ] Service Role Key saved in .env.local
- [ ] Test admin user created (optional)
- [ ] Test author user created (optional)
- [ ] All verification queries passed

---

## 🎯 Next Steps

1. Update `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ssmwdgyhreqqwtxbuspz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_DEl8pAtZ6ykXR7TanAjPoQ_Kf18Orjb
   SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
   NEXT_PUBLIC_GOOGLE_AI_API_KEY=AIzaSyCU_nRzruhkCL-gxM6syen_PsnLB0DvWJw
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Test the application:
   - Register new account at http://localhost:3000/auth/register
   - Login at http://localhost:3000/auth/login
   - Create a blog post at http://localhost:3000/blog/create
   - View AI-generated summary

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.io
- **Google AI API Docs**: https://ai.google.dev/

---

**Setup Time**: ~10 minutes  
**Status**: Ready for local development ✅
