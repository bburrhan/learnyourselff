import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../lib/supabase'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { Calendar, User, Tag, ArrowLeft, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type BlogPost = Database['public']['Tables']['blog_posts']['Row']

const BlogPost: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .eq('language', i18n.language)
          .single()

        if (error) throw error

        setPost(data)
      } catch (err) {
        console.error('Error fetching blog post:', err)
        // Provide mock blog post data filtered by language
        const mockPostsEn = {
          'financial-freedom-steps': {
            id: 'mock-blog-1',
            title: '5 Simple Steps to Financial Freedom',
            content: 'Financial freedom doesn\'t have to be complicated. Here are five simple steps that anyone can follow to take control of their finances and build a secure future.\n\n1. Track Your Spending\nThe first step to financial freedom is understanding where your money goes. Start by tracking every expense for at least one month.\n\n2. Create a Budget\nOnce you know your spending patterns, create a realistic budget that allocates money for necessities, savings, and some fun.\n\n3. Build an Emergency Fund\nAim to save 3-6 months of expenses in a separate savings account for unexpected situations.\n\n4. Pay Off High-Interest Debt\nFocus on paying off credit cards and other high-interest debt as quickly as possible.\n\n5. Start Investing\nEven small amounts invested regularly can grow significantly over time thanks to compound interest.',
            excerpt: 'Discover the simple steps that can transform your financial life in just a few weeks.',
            slug: 'financial-freedom-steps',
            author_name: 'Sarah Johnson',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finance', 'money', 'budgeting'],
            language: 'en',
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          'science-stress-relief': {
            id: 'mock-blog-2',
            title: 'The Science of Stress Relief',
            content: 'Understanding how stress affects your body and mind is the first step to managing it effectively. Learn evidence-based techniques that actually work.\n\nWhat Happens When You\'re Stressed?\nWhen you encounter stress, your body releases hormones like cortisol and adrenaline. While these are helpful in short bursts, chronic stress can lead to serious health problems.\n\nProven Stress Relief Techniques:\n\n1. Deep Breathing\nSimple breathing exercises can activate your parasympathetic nervous system and reduce stress hormones.\n\n2. Progressive Muscle Relaxation\nSystematically tensing and relaxing muscle groups helps release physical tension.\n\n3. Mindfulness Meditation\nRegular meditation practice has been shown to reduce cortisol levels and improve emotional regulation.\n\n4. Regular Exercise\nPhysical activity is one of the most effective ways to combat stress and improve mood.\n\n5. Quality Sleep\nPrioritizing 7-9 hours of quality sleep helps your body recover and manage stress better.',
            excerpt: 'Learn scientifically-proven methods to reduce stress and improve your mental well-being.',
            slug: 'science-stress-relief',
            author_name: 'Dr. Michael Chen',
            cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
            tags: ['wellness', 'stress', 'health'],
            language: 'en',
            is_published: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          }
        }
        
        const mockPostsTr = {
          'finansal-ozgurluk-adimlari': {
            id: 'mock-blog-tr-1',
            title: 'Finansal Özgürlüğe 5 Basit Adım',
            content: 'Finansal özgürlük karmaşık olmak zorunda değil. İşte herkesin takip edebileceği ve finansal geleceğini kontrol altına alabileceği beş basit adım.\n\n1. Harcamalarınızı Takip Edin\nFinansal özgürlüğün ilk adımı paranızın nereye gittiğini anlamaktır. En az bir ay boyunca her harcamanızı takip etmeye başlayın.\n\n2. Bütçe Oluşturun\nHarcama alışkanlıklarınızı öğrendikten sonra, zorunlu ihtiyaçlar, tasarruf ve eğlence için para ayıran gerçekçi bir bütçe oluşturun.\n\n3. Acil Durum Fonu Oluşturun\nBeklenmedik durumlar için ayrı bir tasarruf hesabında 3-6 aylık harcamanızı biriktirmeyi hedefleyin.\n\n4. Yüksek Faizli Borçları Ödeyin\nKredi kartları ve diğer yüksek faizli borçları mümkün olduğunca hızlı ödemeye odaklanın.\n\n5. Yatırım Yapmaya Başlayın\nDüzenli olarak yatırılan küçük miktarlar bile bileşik faiz sayesinde zamanla önemli ölçüde büyüyebilir.',
            excerpt: 'Finansal hayatınızı sadece birkaç hafta içinde dönüştürebilecek basit adımları keşfedin.',
            slug: 'finansal-ozgurluk-adimlari',
            author_name: 'Ayşe Demir',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finans', 'para', 'bütçe'],
            language: 'tr',
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          'stres-azaltma-bilimi': {
            id: 'mock-blog-tr-2',
            title: 'Stres Azaltmanın Bilimi',
            content: 'Stresin vücudunuzu ve zihninizi nasıl etkilediğini anlamak, onu etkili bir şekilde yönetmenin ilk adımıdır. Gerçekten işe yarayan kanıta dayalı teknikleri öğrenin.\n\nStresli Olduğunuzda Ne Olur?\nStresle karşılaştığınızda vücudunuz kortizol ve adrenalin gibi hormonlar salgılar. Bunlar kısa süreli olarak faydalı olsa da, kronik stres ciddi sağlık sorunlarına yol açabilir.\n\nKanıtlanmış Stres Azaltma Teknikleri:\n\n1. Derin Nefes Alma\nBasit nefes egzersizleri parasempatik sinir sisteminizi aktive edebilir ve stres hormonlarını azaltabilir.\n\n2. Aşamalı Kas Gevşetme\nKas gruplarını sistematik olarak germe ve gevşetme fiziksel gerilimi serbest bırakır.\n\n3. Mindfulness Meditasyonu\nDüzenli meditasyon pratiği kortizol seviyelerini düşürdüğü ve duygusal düzenlemeyi iyileştirdiği gösterilmiştir.\n\n4. Düzenli Egzersiz\nFiziksel aktivite stresle mücadele etmenin ve ruh halini iyileştirmenin en etkili yollarından biridir.\n\n5. Kaliteli Uyku\n7-9 saat kaliteli uykuya öncelik vermek vücudunuzun iyileşmesine ve stresi daha iyi yönetmesine yardımcı olur.',
            excerpt: 'Stresi azaltmak ve zihinsel sağlığınızı iyileştirmek için bilimsel olarak kanıtlanmış yöntemleri öğrenin.',
            slug: 'stres-azaltma-bilimi',
            author_name: 'Dr. Mehmet Özkan',
            cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
            tags: ['sağlık', 'stres', 'zihinsel sağlık'],
            language: 'tr',
            is_published: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          }
        }
        
        const mockPosts = i18n.language === 'tr' ? mockPostsTr : mockPostsEn
        const foundPost = mockPosts[slug as keyof typeof mockPosts]
        
        if (foundPost) {
          setPost(foundPost)
          setError(null)
        } else if (slug === 'financial-freedom-steps') {
          setPost({
            id: 'mock-blog-1',
            title: '5 Simple Steps to Financial Freedom',
            content: 'Financial freedom doesn\'t have to be complicated. Here are five simple steps that anyone can follow to take control of their finances and build a secure future.\n\n1. Track Your Spending\nThe first step to financial freedom is understanding where your money goes. Start by tracking every expense for at least one month.\n\n2. Create a Budget\nOnce you know your spending patterns, create a realistic budget that allocates money for necessities, savings, and some fun.\n\n3. Build an Emergency Fund\nAim to save 3-6 months of expenses in a separate savings account for unexpected situations.\n\n4. Pay Off High-Interest Debt\nFocus on paying off credit cards and other high-interest debt as quickly as possible.\n\n5. Start Investing\nEven small amounts invested regularly can grow significantly over time thanks to compound interest.',
            excerpt: 'Discover the simple steps that can transform your financial life in just a few weeks.',
            slug: 'financial-freedom-steps',
            author_name: 'Sarah Johnson',
            cover_image_url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
            tags: ['finance', 'money', 'budgeting'],
            language: 'en',
            is_published: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        } else if (slug === 'science-stress-relief') {
          setPost({
            id: 'mock-blog-2',
            title: 'The Science of Stress Relief',
            content: 'Understanding how stress affects your body and mind is the first step to managing it effectively. Learn evidence-based techniques that actually work.\n\nWhat Happens When You\'re Stressed?\nWhen you encounter stress, your body releases hormones like cortisol and adrenaline. While these are helpful in short bursts, chronic stress can lead to serious health problems.\n\nProven Stress Relief Techniques:\n\n1. Deep Breathing\nSimple breathing exercises can activate your parasympathetic nervous system and reduce stress hormones.\n\n2. Progressive Muscle Relaxation\nSystematically tensing and relaxing muscle groups helps release physical tension.\n\n3. Mindfulness Meditation\nRegular meditation practice has been shown to reduce cortisol levels and improve emotional regulation.\n\n4. Regular Exercise\nPhysical activity is one of the most effective ways to combat stress and improve mood.\n\n5. Quality Sleep\nPrioritizing 7-9 hours of quality sleep helps your body recover and manage stress better.',
            excerpt: 'Learn scientifically-proven methods to reduce stress and improve your mental well-being.',
            slug: 'science-stress-relief',
            author_name: 'Dr. Michael Chen',
            cover_image_url: 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg',
            tags: ['wellness', 'stress', 'health'],
            language: 'en',
            is_published: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          })
        } else {
          setError('Blog post not found')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug, i18n.language])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy link')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('error')}</h1>
          <p className="text-gray-600 mb-4">{error || 'Blog post not found'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              {t('home')}
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/blog" className="text-gray-500 hover:text-gray-700">
              {t('blog')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 truncate">{post.title}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                <Tag className="h-3 w-3 mr-1" />
                #{tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {post.author_name}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(post.created_at), 'MMMM d, yyyy')}
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>{t('share')}</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        {post.cover_image_url && (
          <div className="mb-8">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
          />
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('readyStartLearning')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('exploreCollection')}
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('browseCoursesBtn')}
            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
          </Link>
        </div>
      </article>
    </div>
  )
}

export default BlogPost