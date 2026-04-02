-- Database Schema for Blogging Platform

-- 1. Create ENUM types
CREATE TYPE user_role AS ENUM ('viewer', 'author', 'admin');

-- 2. Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  image_url VARCHAR(500),
  summary TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0
);

-- 4. Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_is_published ON posts(is_published);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_is_approved ON comments(is_approved);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Users table
CREATE POLICY "Users can read their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- 8. RLS Policies for Posts table
CREATE POLICY "Anyone can read published posts" 
  ON posts FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Authors can read their own posts" 
  ON posts FOR SELECT 
  USING (author_id = auth.uid());

CREATE POLICY "Admins can read all posts" 
  ON posts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authors can create posts" 
  ON posts FOR INSERT 
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('author', 'admin')
    )
  );

CREATE POLICY "Authors can update their own posts" 
  ON posts FOR UPDATE 
  USING (author_id = auth.uid());

CREATE POLICY "Admins can update any post" 
  ON posts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authors can delete their own posts" 
  ON posts FOR DELETE 
  USING (author_id = auth.uid());

CREATE POLICY "Admins can delete any post" 
  ON posts FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. RLS Policies for Comments table
CREATE POLICY "Anyone can read approved comments on published posts" 
  ON comments FOR SELECT 
  USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM posts 
      WHERE id = post_id AND is_published = true
    )
  );

CREATE POLICY "Admins can read all comments" 
  ON comments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create comments" 
  ON comments FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can approve comments" 
  ON comments FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own comments" 
  ON comments FOR DELETE 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any comment" 
  ON comments FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Triggers for updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Create storage bucket for images (if not exists)
-- This should be done via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('blog-images', 'blog-images', true)
-- ON CONFLICT (id) DO NOTHING;
