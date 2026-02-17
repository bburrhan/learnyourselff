/*
  # Add Multi-Format Course Content and User Progress Tracking

  1. New Tables
    - `course_content` - Stores multiple content types (ebook, audio, video) per course
      - `id` (uuid, primary key)
      - `course_id` (uuid, FK to courses)
      - `content_type` (text: 'ebook', 'audio', 'video')
      - `file_url` (text, Supabase Storage path)
      - `file_name` (text, original file name)
      - `file_size` (bigint, bytes)
      - `duration_seconds` (integer, for audio/video)
      - `title` (text, content item label)
      - `sort_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_progress` - Tracks user playback position and completion per content item
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `course_id` (uuid, FK to courses)
      - `content_id` (uuid, FK to course_content)
      - `progress_seconds` (integer, playback position for audio/video)
      - `progress_percent` (integer, 0-100)
      - `completed` (boolean)
      - `last_accessed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modified Tables
    - `courses` - Make pdf_url nullable, add content_types array column

  3. Storage
    - Create `course-files` bucket for ebooks, audio, video
    - Create `course-covers` bucket for cover images

  4. Security
    - RLS on course_content: public read for active content, admin write
    - RLS on user_progress: users can only access their own progress
    - Storage policies: authenticated read for course files, admin upload
*/

-- Create course_content table
CREATE TABLE IF NOT EXISTS course_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('ebook', 'audio', 'video')),
  file_url text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES course_content(id) ON DELETE CASCADE NOT NULL,
  progress_seconds integer NOT NULL DEFAULT 0,
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed boolean NOT NULL DEFAULT false,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint: one progress record per user per content item
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_unique
  ON user_progress(user_id, content_id);

-- Make pdf_url nullable on courses (content now lives in course_content)
DO $$
BEGIN
  ALTER TABLE courses ALTER COLUMN pdf_url DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Set default for pdf_url to empty string
ALTER TABLE courses ALTER COLUMN pdf_url SET DEFAULT '';

-- Add content_types array column to courses for quick filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'content_types'
  ) THEN
    ALTER TABLE courses ADD COLUMN content_types text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- course_content policies
CREATE POLICY "Anyone can view active course content"
  ON course_content
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert course content"
  ON course_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can update course content"
  ON course_content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can delete course content"
  ON course_content
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- user_progress policies
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_content_course_id ON course_content(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_type ON course_content(content_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(user_id, course_id);

-- Trigger for updated_at on course_content
CREATE TRIGGER update_course_content_updated_at
  BEFORE UPDATE ON course_content
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for updated_at on user_progress
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-files',
  'course-files',
  false,
  524288000,
  ARRAY['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm', 'video/ogg']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-covers',
  'course-covers',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-files bucket
CREATE POLICY "Authenticated users can read course files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-files');

CREATE POLICY "Admins can upload course files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can update course files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can delete course files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

-- Storage policies for course-covers bucket (public read)
CREATE POLICY "Anyone can view course covers"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'course-covers');

CREATE POLICY "Admins can upload course covers"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can update course covers"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admins can delete course covers"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-covers'
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
  );
