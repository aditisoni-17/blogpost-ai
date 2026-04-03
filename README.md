# BlogPost AI

A full-stack blogging platform built with Next.js and Supabase. It supports authentication, role-based access, post creation and editing, comments with moderation, search, pagination, and AI-generated summaries for posts.

## Project Overview

This project was built for the Hivon Automations LLP assignment using Next.js for both frontend and backend, Supabase for authentication and database access, and Google AI for post summaries.

The platform supports three roles:
- `viewer`: can browse posts, read summaries, and add comments
- `author`: can create posts and edit or delete their own posts
- `admin`: can access all posts and moderate comments

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Google AI API
- Git and GitHub

## Implemented Features

### Authentication and Roles
- Email/password authentication with Supabase
- Session-aware client auth state
- Role-based access for viewer, author, and admin
- Protected author/admin actions enforced in API routes

### Posts
- Paginated blog listing
- Search by title, body, and summary
- Post detail page with featured image, summary, and content
- Create post page for authors/admins
- Edit and delete for owner/admin

### Comments
- View approved comments on post detail pages
- Add comments as authenticated users
- Admin moderation routes for approving/rejecting comments
- Shared comments UI with empty, loading, and validation states

### AI Summary
- Summary generated on post creation
- Summary stored in the database and reused later
- Summary shown on listing and detail pages
- Server-side only API key usage

## AI Tool Usage

This project used an AI coding assistant during development and debugging.

### Tool Used
- Codex-style AI coding assistant

### Why It Was Chosen
- Fast for inspecting a medium-sized Next.js codebase
- Helpful for tracing import/export mismatches
- Useful for making small, safe UI refinements without rewriting the project
- Good for checking consistency across API routes, pages, and shared utilities

### How It Helped
- Fixed AI summary flow issues and server-only environment handling
- Improved UI structure across listing, auth, create post, and post detail pages
- Helped identify duplicate dead code in `app/lib`
- Verified build output after each cleanup step

## Cost Optimization

The AI summary feature includes a few simple cost-control decisions:

- Summaries are generated once when a post is created
- Generated summaries are stored in the database
- Stored summaries are reused on the listing and detail pages
- Duplicate summary generation is skipped if a summary already exists
- Server-side rate limiting utilities are included for AI calls
- The Google AI key stays on the server and is never exposed to the frontend

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/aditisoni-17/blogpost-ai.git
cd blogpost-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create `.env.local` using the values from `.env.example`.

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_AI_API_KEY=your_google_ai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up Supabase schema

Run the SQL migration from:

- `supabase/migrations/001_initial_schema.sql`

### 5. Run locally

```bash
npm run dev
```

Open:

- `http://localhost:3000`

### 6. Production build

```bash
npm run build
```

## Core Flow Summary

### Auth Flow
- User registers or logs in with Supabase Auth
- Client session is read through the auth context
- Protected routes/actions use authenticated API calls with bearer tokens

### Role-Based Access
- Viewer: read posts and comment
- Author: create/edit/delete own posts
- Admin: moderate comments and manage any post

### Post Creation Flow
- Author fills in title, image URL, and content
- API validates input
- Post is stored in Supabase
- AI summary is generated and stored

### AI Summary Flow
- Server-side function calls Google AI API
- Summary is returned and saved to the post record
- Listing/detail pages display the saved summary

## Current Project Status

Working and verified:
- Auth pages
- Post listing
- Post detail
- Create post
- Search and pagination
- AI summary generation flow
- Comments flow
- Production build

Still external to this repository:
- VPS deployment and public live URL setup

## Repository Notes

- `.env.local` is ignored and should never be committed
- `.env.example` is included for setup guidance
- The codebase has been cleaned to reduce duplicate unused files under `app/lib`

## GitHub

- Repository: https://github.com/aditisoni-17/blogpost-ai
