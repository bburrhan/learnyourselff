import React from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from '../../lib/supabase'
import LanguageAwareLink from '../Layout/LanguageAwareLink'
import { Star, Clock, Users, FileText, Music, Video } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']

interface CourseCardProps {
  course: Course
  className?: string
}

const CourseCard: React.FC<CourseCardProps> = ({ course, className = '' }) => {
  const { t } = useTranslation()

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) {
      return 'FREE'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  return (
    <LanguageAwareLink
      to={`/course/${course.id}`}
      className={`block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 ${className}`}
    >
      <div className="flex flex-row h-full">
        <div className="relative flex-shrink-0 w-28 sm:w-40 md:w-44 overflow-hidden">
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg') {
                target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
              }
            }}
          />
        </div>

        <div className="flex-1 p-3 sm:p-5 flex flex-col min-w-0">
          <div className="mb-2">
            <span className="bg-royal-blue-600 text-white px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold">
              {formatPrice(course.price, course.currency)}
            </span>
          </div>

          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {course.category}
            </span>
            {course.content_types && course.content_types.length > 0 && (
              <div className="flex items-center gap-1">
                {course.content_types.includes('ebook') && (
                  <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded" title="Ebook">
                    <FileText className="h-3 w-3" />
                  </span>
                )}
                {course.content_types.includes('audio') && (
                  <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-600 text-xs px-1.5 py-0.5 rounded" title="Audio">
                    <Music className="h-3 w-3" />
                  </span>
                )}
                {course.content_types.includes('video') && (
                  <span className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-600 text-xs px-1.5 py-0.5 rounded" title="Video">
                    <Video className="h-3 w-3" />
                  </span>
                )}
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-royal-blue-600 transition-colors line-clamp-2">
            {course.title}
          </h3>

          <p className="text-gray-600 text-sm mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="hidden sm:flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1 text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5 fill-current" />
              <Star className="h-3.5 w-3.5" />
              <span className="text-gray-500 text-xs ml-1 font-medium">(4.2)</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-500 text-xs">
              <div className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>2-3h</span>
              </div>
              <div className="flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                <span>124</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-wrap gap-1.5 mb-3">
            {course.tags?.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {course.tags && course.tags.length > 3 && (
              <span className="text-gray-400 text-xs font-medium">+{course.tags.length - 3}</span>
            )}
          </div>

          <div className="mt-auto pt-2">
            <span
              className={`inline-flex items-center justify-center w-full text-white text-center py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow-md ${
                course.price === 0
                  ? 'bg-green-600 group-hover:bg-green-700'
                  : 'bg-royal-blue-600 group-hover:bg-royal-blue-700'
              }`}
            >
              {course.price === 0 ? t('getForFree') : t('buyNow')}
            </span>
          </div>
        </div>
      </div>
    </LanguageAwareLink>
  )
}

export default CourseCard
