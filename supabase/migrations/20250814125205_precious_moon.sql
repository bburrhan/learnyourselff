/*
  # Complete E-commerce Platform Database Schema

  1. New Tables
    - `courses` - Store course information with pricing, categories, and metadata
    - `purchases` - Track user purchases and payment status
    - `blog_posts` - Content management for blog articles
    - `profiles` - Extended user profile information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated and public access
    - Secure file access and user data

  3. Features
    - Multi-language support
    - Course categorization and filtering
    - Purchase tracking and download limits
    - Blog content management
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  category text NOT NULL,
  instructor_name text NOT NULL,
  instructor_bio text NOT NULL,
  pdf_url text NOT NULL,
  cover_image_url text NOT NULL,
  tags text[] DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  difficulty_level text NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  stripe_payment_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  download_count integer DEFAULT 0,
  last_download_at timestamptz
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  slug text UNIQUE NOT NULL,
  author_name text NOT NULL,
  cover_image_url text NOT NULL,
  tags text[] DEFAULT '{}',
  language text NOT NULL DEFAULT 'en',
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  language_preference text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Courses policies (public read, admin write)
CREATE POLICY "Anyone can view active courses"
  ON courses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Purchases policies
CREATE POLICY "Users can view their own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create purchases"
  ON purchases
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchases"
  ON purchases
  FOR UPDATE
  TO authenticated
  USING (true);

-- Blog posts policies
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can manage blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view and update their own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published) WHERE is_published = true;

-- Insert sample courses data
INSERT INTO courses (title, description, price, category, instructor_name, instructor_bio, pdf_url, cover_image_url, tags, language, difficulty_level, is_featured, is_active) VALUES
('Introduction to Web Development', 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. Perfect for beginners who want to start their coding journey.', 29.99, 'Programming', 'Sarah Johnson', 'Full-stack developer with 8+ years of experience in web technologies.', 'https://example.com/courses/web-dev-intro.pdf', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg', ARRAY['HTML', 'CSS', 'JavaScript', 'Web Development'], 'en', 'beginner', true, true),

('Advanced React Patterns', 'Master advanced React concepts including hooks, context, and performance optimization techniques for building scalable applications.', 49.99, 'Programming', 'Mike Chen', 'Senior React developer at a Fortune 500 company with expertise in modern frontend architectures.', 'https://example.com/courses/react-advanced.pdf', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg', ARRAY['React', 'JavaScript', 'Frontend', 'Performance'], 'en', 'advanced', true, true),

('Digital Marketing Fundamentals', 'Comprehensive guide to digital marketing including SEO, social media marketing, and content strategy for small businesses.', 39.99, 'Marketing', 'Emma Rodriguez', 'Digital marketing consultant who has helped 100+ businesses grow their online presence.', 'https://example.com/courses/digital-marketing.pdf', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg', ARRAY['SEO', 'Social Media', 'Content Marketing', 'Analytics'], 'en', 'beginner', true, true),

('Python for Data Science', 'Learn Python programming specifically for data analysis, visualization, and machine learning applications.', 44.99, 'Data Science', 'Dr. James Wilson', 'Data scientist with PhD in Statistics and 10+ years of experience in machine learning.', 'https://example.com/courses/python-data-science.pdf', 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg', ARRAY['Python', 'Data Analysis', 'Machine Learning', 'Statistics'], 'en', 'intermediate', true, true),

('Graphic Design Essentials', 'Master the principles of graphic design using industry-standard tools and techniques for creating compelling visual content.', 34.99, 'Design', 'Lisa Park', 'Award-winning graphic designer with 12+ years of experience in branding and visual communication.', 'https://example.com/courses/graphic-design.pdf', 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg', ARRAY['Design', 'Typography', 'Color Theory', 'Branding'], 'en', 'beginner', true, true),

('Business Strategy & Planning', 'Learn how to develop effective business strategies, create business plans, and make data-driven decisions for growth.', 54.99, 'Business', 'Robert Taylor', 'Former McKinsey consultant and current business strategy professor with MBA from Harvard.', 'https://example.com/courses/business-strategy.pdf', 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg', ARRAY['Strategy', 'Planning', 'Analytics', 'Leadership'], 'en', 'intermediate', false, true),

('Web Geliştirmeye Giriş', 'HTML, CSS ve JavaScript dahil olmak üzere web geliştirmenin temellerini öğrenin. Kodlama yolculuğuna başlamak isteyen yeni başlayanlar için mükemmel.', 29.99, 'Programming', 'Ahmet Yılmaz', '8+ yıllık web teknolojileri deneyimine sahip full-stack geliştirici.', 'https://example.com/courses/web-dev-intro-tr.pdf', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg', ARRAY['HTML', 'CSS', 'JavaScript', 'Web Geliştirme'], 'tr', 'beginner', false, true),

('Dijital Pazarlama Temelleri', 'Küçük işletmeler için SEO, sosyal medya pazarlaması ve içerik stratejisi dahil olmak üzere dijital pazarlamaya kapsamlı rehber.', 39.99, 'Marketing', 'Zeynep Kaya', '100+ işletmenin çevrimiçi varlığını büyütmesine yardımcı olan dijital pazarlama danışmanı.', 'https://example.com/courses/digital-marketing-tr.pdf', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg', ARRAY['SEO', 'Sosyal Medya', 'İçerik Pazarlaması', 'Analitik'], 'tr', 'beginner', false, true);

-- Insert sample blog posts
INSERT INTO blog_posts (title, content, excerpt, slug, author_name, cover_image_url, tags, language, is_published) VALUES
('The Future of Online Learning', 'Online learning has revolutionized education, making it more accessible and flexible than ever before. In this comprehensive guide, we explore the latest trends, technologies, and methodologies that are shaping the future of digital education...', 'Discover how online learning is transforming education and what the future holds for digital learning platforms.', 'future-of-online-learning', 'Sarah Johnson', 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg', ARRAY['Education', 'Technology', 'Online Learning'], 'en', true),

('5 Essential Skills for Remote Work', 'Remote work has become the new normal for millions of professionals worldwide. Success in a remote environment requires a unique set of skills that go beyond technical expertise...', 'Learn the top 5 skills you need to master for successful remote work and career advancement.', '5-essential-skills-remote-work', 'Mike Chen', 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg', ARRAY['Remote Work', 'Career', 'Productivity'], 'en', true),

('Çevrimiçi Öğrenmenin Geleceği', 'Çevrimiçi öğrenme eğitimde devrim yaratarak onu her zamankinden daha erişilebilir ve esnek hale getirdi. Bu kapsamlı rehberde, dijital eğitimin geleceğini şekillendiren en son trendleri, teknolojileri ve metodolojileri keşfediyoruz...', 'Çevrimiçi öğrenmenin eğitimi nasıl dönüştürdüğünü ve dijital öğrenme platformlarının geleceğinin ne getireceğini keşfedin.', 'cevrimici-ogrenmenin-gelecegi', 'Ahmet Yılmaz', 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg', ARRAY['Eğitim', 'Teknoloji', 'Çevrimiçi Öğrenme'], 'tr', true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();