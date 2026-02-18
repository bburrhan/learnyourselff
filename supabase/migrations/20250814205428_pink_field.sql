/*
  # Add sample courses with photos

  1. New Data
    - Insert sample courses with cover images from Pexels
    - Each course includes a relevant stock photo
    - Covers various categories and price points
    - All courses have proper cover_image_url values

  2. Course Categories
    - Technology, Business, Design, Marketing, Personal Development
    - Price range from $2 to $49 to show variety
    - Mix of difficulty levels and languages
*/

-- Insert sample courses with photos
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
) VALUES
-- Affordable transformation courses (under $10)
(
  'Stop Living Paycheck to Paycheck',
  'Learn 3 fast money-saving fixes that will help you break the paycheck-to-paycheck cycle. Simple strategies you can implement today to start saving money every month.',
  2.99,
  'USD',
  'personal-finance',
  'Sarah Johnson',
  'Personal finance coach with 8 years of experience helping people save money and build wealth.',
  'https://example.com/paycheck-course.pdf',
  'https://images.pexels.com/photos/259027/pexels-photo-259027.jpeg',
  ARRAY['budgeting', 'saving', 'money-management', 'personal-finance'],
  'en',
  'beginner',
  true,
  true
),
(
  'Make Your First $10 Online',
  'Perfect for beginners, no tech skills needed. Discover simple ways to earn your first income online using just your smartphone or computer.',
  4.99,
  'USD',
  'online-income',
  'Mike Chen',
  'Digital entrepreneur who has helped over 1000 people start their online income journey.',
  'https://example.com/first-10-course.pdf',
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
  ARRAY['online-income', 'side-hustle', 'beginner-friendly', 'smartphone'],
  'en',
  'beginner',
  true,
  true
),
(
  'Stress Less, Sleep Better',
  'Try these simple changes tonight. A 12-minute course with proven techniques to reduce daily stress and improve your sleep quality immediately.',
  3.99,
  'USD',
  'wellness',
  'Dr. Lisa Martinez',
  'Licensed therapist specializing in stress management and sleep disorders for over 10 years.',
  'https://example.com/stress-sleep-course.pdf',
  'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg',
  ARRAY['stress-relief', 'sleep', 'wellness', 'mental-health'],
  'en',
  'beginner',
  true,
  true
),
(
  'Nail Your Next Job Interview',
  'Master the 5 questions every interviewer asks. Boost your confidence and land the job with proven interview strategies that work.',
  5.99,
  'USD',
  'career',
  'James Wilson',
  'HR director with 15 years of experience interviewing thousands of candidates.',
  'https://example.com/interview-course.pdf',
  'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg',
  ARRAY['job-interview', 'career', 'confidence', 'professional-development'],
  'en',
  'beginner',
  true,
  true
),
(
  'Organize Your Life in 15 Minutes',
  'Simple daily habits that will transform your productivity and reduce chaos. Start seeing results from day one with these proven organization techniques.',
  3.49,
  'USD',
  'productivity',
  'Emma Thompson',
  'Professional organizer and productivity coach who has helped hundreds of busy professionals.',
  'https://example.com/organize-life-course.pdf',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
  ARRAY['organization', 'productivity', 'time-management', 'habits'],
  'en',
  'beginner',
  false,
  true
),
-- Mid-range courses
(
  'Master Excel in 2 Hours',
  'From zero to hero with Excel. Learn the essential formulas, functions, and shortcuts that will make you 10x more productive at work.',
  12.99,
  'USD',
  'technology',
  'David Kumar',
  'Microsoft Excel trainer with 12 years of corporate training experience.',
  'https://example.com/excel-course.pdf',
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
  ARRAY['excel', 'spreadsheets', 'productivity', 'office-skills'],
  'en',
  'intermediate',
  true,
  true
),
(
  'Social Media Marketing Basics',
  'Grow your business with simple social media strategies. Learn how to create engaging content and attract customers on Instagram, Facebook, and TikTok.',
  15.99,
  'USD',
  'marketing',
  'Rachel Green',
  'Social media strategist who has grown accounts from 0 to 100K+ followers.',
  'https://example.com/social-media-course.pdf',
  'https://images.pexels.com/photos/267389/pexels-photo-267389.jpeg',
  ARRAY['social-media', 'marketing', 'instagram', 'business-growth'],
  'en',
  'beginner',
  true,
  true
),
(
  'Design Beautiful Presentations',
  'Create stunning slides that impress every time. Master the principles of visual design and PowerPoint techniques used by top consultants.',
  18.99,
  'USD',
  'design',
  'Alex Rodriguez',
  'Presentation designer who has created slides for Fortune 500 companies.',
  'https://example.com/presentation-course.pdf',
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
  ARRAY['presentation', 'powerpoint', 'design', 'public-speaking'],
  'en',
  'intermediate',
  false,
  true
),
(
  'Start Your Online Store',
  'Launch your e-commerce business in one weekend. Step-by-step guide to setting up your online store and making your first sale.',
  24.99,
  'USD',
  'business',
  'Maria Santos',
  'E-commerce consultant who has helped launch over 200 successful online stores.',
  'https://example.com/online-store-course.pdf',
  'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
  ARRAY['e-commerce', 'online-business', 'entrepreneurship', 'shopify'],
  'en',
  'intermediate',
  true,
  true
),
(
  'Photography for Beginners',
  'Take amazing photos with any camera, even your phone. Learn composition, lighting, and editing techniques that will transform your photography.',
  19.99,
  'USD',
  'creative',
  'Tom Anderson',
  'Professional photographer with 20 years of experience and over 50,000 students taught.',
  'https://example.com/photography-course.pdf',
  'https://images.pexels.com/photos/1983032/pexels-photo-1983032.jpeg',
  ARRAY['photography', 'camera', 'composition', 'editing'],
  'en',
  'beginner',
  false,
  true
),
-- Premium courses
(
  'Complete Digital Marketing Strategy',
  'Build a comprehensive digital marketing plan that drives real results. Covers SEO, PPC, email marketing, and conversion optimization.',
  49.99,
  'USD',
  'marketing',
  'Jennifer Lee',
  'Digital marketing director with 10+ years at leading agencies, managing $10M+ in ad spend.',
  'https://example.com/digital-marketing-course.pdf',
  'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg',
  ARRAY['digital-marketing', 'seo', 'ppc', 'email-marketing'],
  'en',
  'advanced',
  true,
  true
),
(
  'Python Programming Fundamentals',
  'Learn to code with Python from scratch. Build real projects and gain the skills needed to start a career in programming or data science.',
  39.99,
  'USD',
  'technology',
  'Dr. Robert Kim',
  'Computer Science professor and Python developer with 15 years of teaching experience.',
  'https://example.com/python-course.pdf',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
  ARRAY['python', 'programming', 'coding', 'data-science'],
  'en',
  'intermediate',
  true,
  true
);