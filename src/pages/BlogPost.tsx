import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../lib/supabase'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { Calendar, User, Tag, ArrowLeft, Share2, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type BlogPost = Database['public']['Tables']['blog_posts']['Row']

const BlogPost: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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
        setError('Blog post not found')
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
          <LanguageAwareLink
            to="/blog"
            className="inline-flex items-center text-royal-blue-600 hover:text-royal-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </LanguageAwareLink>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      {post && (
        <>
          <title>{post.seo_title || post.title}</title>
          <meta name="description" content={post.meta_description || post.excerpt} />
        </>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <LanguageAwareLink to="/" className="text-gray-500 hover:text-gray-700">
              {t('home')}
            </LanguageAwareLink>
            <span className="text-gray-400">/</span>
            <LanguageAwareLink to="/blog" className="text-gray-500 hover:text-gray-700">
              {t('blog')}
            </LanguageAwareLink>
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
                className="inline-flex items-center bg-royal-blue-100 text-royal-blue-800 text-xs px-2 py-1 rounded-full"
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
              className="flex items-center space-x-1 text-royal-blue-600 hover:text-royal-blue-700 transition-colors"
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

        {/* TL;DR Section */}
        {post.tldr && (
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <div className="flex items-start">
              <BookOpen className="h-5 w-5 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">TL;DR</h3>
                <div
                  className="text-gray-700 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: post.tldr.replace(/\n/g, '<br />') }}
                />
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {post.cta_text && post.cta_link ? (
          <div className="mt-12 bg-gradient-to-r from-royal-blue-50 to-royal-blue-100 border border-royal-blue-200 rounded-lg p-6">
            <div
              className="text-gray-800 mb-4"
              dangerouslySetInnerHTML={{ __html: post.cta_text.replace(/\n/g, '<br />') }}
            />
            <LanguageAwareLink
              to={post.cta_link.startsWith('http') ? post.cta_link : post.cta_link}
              className="inline-flex items-center bg-royal-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-royal-blue-700 transition-colors"
              target={post.cta_link.startsWith('http') ? '_blank' : undefined}
              rel={post.cta_link.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {t('learnMore')}
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </LanguageAwareLink>
          </div>
        ) : (
          <div className="mt-12 bg-royal-blue-50 border border-royal-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('readyStartLearning')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('exploreCollection')}
            </p>
            <LanguageAwareLink
              to="/courses"
              className="inline-flex items-center bg-royal-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-royal-blue-700 transition-colors"
            >
              {t('browseCoursesBtn')}
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </LanguageAwareLink>
          </div>
        )}
      </article>
    </div>
  )
}

export default BlogPost