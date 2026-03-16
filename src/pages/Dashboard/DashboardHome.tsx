import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import LanguageAwareLink from '../../components/Layout/LanguageAwareLink'
import { BookOpen, Download, TrendingUp, Calendar, ExternalLink, Settings } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type Purchase = Database['public']['Tables']['purchases']['Row'] & {
  courses: Database['public']['Tables']['courses']['Row']
}

const DashboardHome: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalDownloads: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    // Check for success message from checkout
    if (searchParams.get('success') === 'true') {
      const isDemo = searchParams.get('demo') === 'true'
      toast.success(isDemo ? 'Demo purchase completed! In production, you would receive an email with download links.' : 'Purchase completed successfully!')
      // Clear the URL parameters
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        // Fetch user's purchases with course details
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select(`
            *,
            courses!inner (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('courses.language', i18n.language)
          .order('created_at', { ascending: false })
          .limit(5)

        if (purchasesError) throw purchasesError

        setPurchases(purchasesData || [])

        // Calculate stats
        const totalCourses = purchasesData?.length || 0
        const totalDownloads = purchasesData?.reduce((sum, purchase) => sum + purchase.download_count, 0) || 0
        const recentActivity = purchasesData?.filter(purchase => {
          const purchaseDate = new Date(purchase.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return purchaseDate > weekAgo
        }).length || 0

        setStats({
          totalCourses,
          totalDownloads,
          recentActivity,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setPurchases([])
        setStats({
          totalCourses: 0,
          totalDownloads: 0,
          recentActivity: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, i18n.language])

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ms-4">
              <p className="text-sm text-gray-600">{t('totalCourses')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div className="ms-4">
              <p className="text-sm text-gray-600">{t('totalDownloads')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ms-4">
              <p className="text-sm text-gray-600">{t('thisWeek')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t('recentPurchases')}</h2>
            <LanguageAwareLink
              to="/dashboard/courses"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('viewAll')}
            </LanguageAwareLink>
          </div>
        </div>
        <div className="p-6">
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('noCoursesPurchased')}</p>
              <LanguageAwareLink
                to="/courses"
                className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('browseCoursesBtn')}
                <ExternalLink className="h-4 w-4 ms-1" />
              </LanguageAwareLink>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-x-4">
                    <img
                      src={purchase.courses.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                      alt={purchase.courses.title}
                      className="w-10 h-14 rounded object-cover shadow-sm"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {purchase.courses.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 me-1" />
                        {t('purchased')} {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Downloaded {purchase.download_count} times
                    </p>
                    <LanguageAwareLink
                      to="/dashboard/courses"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {t('view')} Details
                    </LanguageAwareLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <LanguageAwareLink
            to="/courses"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">{t('browseCoursesBtn')}</span>
          </LanguageAwareLink>
          <LanguageAwareLink
            to="/dashboard/courses"
            className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">{t('myCourses')}</span>
          </LanguageAwareLink>
          <LanguageAwareLink
            to="/dashboard/settings"
            className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Settings className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">{t('settings')}</span>
          </LanguageAwareLink>
          <LanguageAwareLink
            to="/blog"
            className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <ExternalLink className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-900">{t('blog')}</span>
          </LanguageAwareLink>
        </div>
      </div>
    </div>
  )
}

export default DashboardHome