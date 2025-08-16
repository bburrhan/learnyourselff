/*
  # Add 48 Hours Challenge Course

  1. New Course Entry
    - Add the "48 hours challenge" as a course in the courses table
    - Set appropriate metadata and pricing
  2. Sample Data
    - Insert the course with all required fields
    - Set as featured course for visibility
*/

-- Insert the 48 hours challenge course
INSERT INTO courses (
  title,
  description,
  price,
  currency,
  category,
  instructor_name,
  instructor_bio,
  pdf_url,
  cover_image_url,
  tags,
  language,
  difficulty_level,
  is_featured,
  is_active
) VALUES (
  '48 Hours Challenge',
  'Transform your life in just 48 hours with this intensive challenge designed to create lasting change. This comprehensive guide provides step-by-step instructions, practical exercises, and proven strategies to help you break through barriers and achieve meaningful results in record time.',
  4.90,
  'USD',
  'personal-development',
  'Sarah Johnson',
  'Life transformation coach with over 10 years of experience helping thousands of people create positive change. Author of multiple bestselling guides on personal development and productivity.',
  'https://example.com/48-hours-challenge.pdf',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
  ARRAY['challenge', 'transformation', 'productivity', 'personal-development', '48-hours'],
  'en',
  'beginner',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Insert Turkish version
INSERT INTO courses (
  title,
  description,
  price,
  currency,
  category,
  instructor_name,
  instructor_bio,
  pdf_url,
  cover_image_url,
  tags,
  language,
  difficulty_level,
  is_featured,
  is_active
) VALUES (
  '48 Saat Meydan Okuma',
  'Kalıcı değişim yaratmak için tasarlanmış bu yoğun meydan okuma ile hayatınızı sadece 48 saatte dönüştürün. Bu kapsamlı rehber, engelleri aşmanıza ve rekor sürede anlamlı sonuçlar elde etmenize yardımcı olacak adım adım talimatlar, pratik egzersizler ve kanıtlanmış stratejiler sunar.',
  4.90,
  'USD',
  'personal-development',
  'Sarah Johnson',
  'Binlerce insanın pozitif değişim yaratmasına yardımcı olan 10 yılı aşkın deneyime sahip yaşam dönüşüm koçu. Kişisel gelişim ve verimlilik konularında çok satan rehberlerin yazarı.',
  'https://example.com/48-hours-challenge-tr.pdf',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
  ARRAY['meydan-okuma', 'dönüşüm', 'verimlilik', 'kişisel-gelişim', '48-saat'],
  'tr',
  'beginner',
  true,
  true
) ON CONFLICT DO NOTHING;