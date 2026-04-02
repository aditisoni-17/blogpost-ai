import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export interface User {
  id: string;
  email: string;
  name: string;
  role: "author" | "viewer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  summary: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  view_count: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}
