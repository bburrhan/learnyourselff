/*
  # Create categories table for dynamic category management

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique, url-friendly)
      - `description` (text, optional)
      - `color` (text, for UI styling)
      - `icon` (text, icon name)
      - `is_active` (boolean, default true)
      - `sort_order` (integer, for ordering)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `categories` table
    - Add policy for public read access to active categories
    - Add policy for authenticated users to manage categories

  3. Sample Data
    - Insert default categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'BookOpen',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active categories"
  ON categories
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default categories
INSERT INTO categories (name, slug, description, color, icon, sort_order) VALUES
  ('Technology', 'technology', 'Programming, web development, and tech skills', '#3B82F6', 'Code', 1),
  ('Business', 'business', 'Finance, entrepreneurship, and business skills', '#10B981', 'Briefcase', 2),
  ('Design', 'design', 'Graphic design, UI/UX, and creative skills', '#8B5CF6', 'Palette', 3),
  ('Marketing', 'marketing', 'Digital marketing, social media, and advertising', '#F59E0B', 'TrendingUp', 4),
  ('Health & Wellness', 'health-wellness', 'Mental health, fitness, and wellbeing', '#EF4444', 'Heart', 5),
  ('Personal Development', 'personal-development', 'Self-improvement and life skills', '#6366F1', 'User', 6)
ON CONFLICT (name) DO NOTHING;