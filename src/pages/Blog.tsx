import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../lib/supabase'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { Calendar, User, Tag, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

type BlogPost = Database['public']['Tables']['blog_posts']['Row']

const Blog: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .eq('language', i18n.language)
          .order('created_at', { ascending: false })

        if (error) throw error

        setPosts(data || [])
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [i18n.language])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('error')}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('blog')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('discoverInsights')}
          </p>
        </div>

        {/* Featured Post */}
        {posts.length > 0 && (
          <div className="mb-12">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img
                    src={posts[0].cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                    alt={posts[0].title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      {t('featured')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <LanguageAwareLink
                      to={`/blog/${posts[0].slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {posts[0].title}
                    </LanguageAwareLink>
                  </h2>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {posts[0].excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {posts[0].author_name}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(posts[0].created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <LanguageAwareLink
                      to={`/blog/${posts[0].slug}`}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      {t('readMore')}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </LanguageAwareLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(1).map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            >
              <div className="aspect-video">
                <img
                  src={post.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags?.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  <LanguageAwareLink
                    to={`/blog/${post.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {post.title}
                  </LanguageAwareLink>
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.author_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(post.created_at), 'MMM d')}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noBlogPosts')}</h3>
            <p className="text-gray-600">
              {t('checkBackSoon')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Blog