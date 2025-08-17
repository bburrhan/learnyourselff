import React from 'react'
import { useTranslation } from 'react-i18next'
import { Database } from '../../lib/supabase'
import LanguageAwareLink from '../Layout/LanguageAwareLink'
import { Star, Clock, Users, BookOpen } from 'lucide-react'

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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-2 flex flex-col h-full ${className}`}>
      <div className="relative">
        <img
          src={course.cover_image_url}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg') {
              target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
            }
          }}
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getDifficultyColor(course.difficulty_level)}`}>
            {course.difficulty_level}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-royal-blue-600 text-white px-3 py-2 rounded-md text-sm font-bold shadow-sm">
            {formatPrice(course.price, course.currency)}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-2">
          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
            {course.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-royal-blue-600 transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4 fill-current" />
            <Star className="h-4 w-4" />
            <span className="text-gray-500 text-xs ml-2 font-medium">(4.2)</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-500 text-xs">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>2-3h</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>124</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>by {course.instructor_name}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {course.tags?.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium"
            >
              #{tag}
            </span>
          ))}
          {course.tags && course.tags.length > 3 && (
            <span className="text-gray-400 text-xs font-medium">+{course.tags.length - 3} more</span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <LanguageAwareLink
            to={`/course/${course.id}`}
            className={`block w-full text-white text-center py-3 rounded-lg transition-all duration-300 font-semibold transform hover:scale-105 shadow-sm hover:shadow-md ${
              course.price === 0 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-royal-blue-600 hover:bg-royal-blue-700'
            }`}
          >
            {course.price === 0 ? t('getForFree') : t('buyNow')}
          </LanguageAwareLink>
        </div>
      </div>
    </div>
  )
}

export default CourseCard