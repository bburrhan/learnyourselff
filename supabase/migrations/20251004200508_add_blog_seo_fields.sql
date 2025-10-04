/*
  # Add SEO and Enhanced Blog Fields

  1. New Columns
    - `seo_title` (text) - SEO-optimized title for search engines
    - `meta_description` (text) - Meta description for SEO
    - `tldr` (text) - Quick summary/TL;DR section
    - `cta_text` (text) - Call-to-action text at the end of the blog post
    - `cta_link` (text) - Call-to-action link URL

  2. Changes
    - Add new SEO and content fields to blog_posts table
    - All fields are optional to maintain backward compatibility
    - Use IF NOT EXISTS to prevent errors if columns already exist

  3. Notes
    - Existing blog posts will have NULL values for new fields
    - New blog posts can utilize these fields for better SEO and engagement
*/

-- Add seo_title column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'seo_title'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN seo_title text;
  END IF;
END $$;

-- Add meta_description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN meta_description text;
  END IF;
END $$;

-- Add tldr column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'tldr'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN tldr text;
  END IF;
END $$;

-- Add cta_text column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'cta_text'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN cta_text text;
  END IF;
END $$;

-- Add cta_link column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'cta_link'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN cta_link text;
  END IF;
END $$;