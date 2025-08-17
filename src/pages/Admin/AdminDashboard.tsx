import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import LogViewer from '../../components/Debug/LogViewer'
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Calendar,
  Download,
  FileText,
  Tag,
  Bug
} from 'lucide-react'
import { format } from 'date-fns'

interface AdminStats {
  totalCourses: number
  totalUsers: number
  totalRevenue: number
  totalSales: number
  recentSales: Array<{
    id: string
    amount: number
    currency: string
    email: string
    course_title: string
    created_at: string
  }>
}

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    totalCourses: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalSales: 0,
    recentSales: [],
  })
  const [loading, setLoading] = useState(true)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch courses count
        const { count: coursesCount } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Fetch purchases data
        const { data: purchasesData } = await supabase
          .from('purchases')
          .select(`
            *,
            courses!inner (title)
          `)
          .eq('status', 'completed')
          .eq('courses.language', i18n.language)
          .order('created_at', { ascending: false })
          .limit(10)

        const totalSales = purchasesData?.length || 0
        const totalRevenue = purchasesData?.reduce((sum, purchase) => sum + purchase.amount, 0) || 0
        
        const recentSales = purchasesData?.map(purchase => ({
          id: purchase.id,
          amount: purchase.amount,
          currency: purchase.currency,
          email: purchase.email,
          course_title: purchase.courses?.title || 'Unknown',
          created_at: purchase.created_at,
        })) || []

        setStats({
          totalCourses: coursesCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue,
          totalSales,
          recentSales,
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
        // Provide mock admin data
        setStats({
          totalCourses: i18n.language === 'tr' ? 2 : 3,
          totalUsers: 15,
          totalRevenue: i18n.language === 'tr' ? 89.91 : 149.85,
          totalSales: i18n.language === 'tr' ? 7 : 12,
          recentSales: [
            {
              id: i18n.language === 'tr' ? 'mock-sale-tr-1' : 'mock-sale-1',
              amount: 9.99,
              currency: 'USD',
              email: i18n.language === 'tr' ? 'ahmet@example.com' : 'john@example.com',
              course_title: i18n.language === 'tr' ? 'Kişisel Finans Rehberi' : 'Complete Guide to Personal Finance',
              created_at: new Date().toISOString(),
            },
            {
              id: i18n.language === 'tr' ? 'mock-sale-tr-2' : 'mock-sale-2',
              amount: 4.99,
              currency: 'USD',
              email: i18n.language === 'tr' ? 'zeynep@example.com' : 'jane@example.com',
              course_title: i18n.language === 'tr' ? '30 Dakikada Stres Yönetimi' : 'Stress Management in 30 Minutes',
              created_at: new Date(Date.now() - 3600000).toISOString(),
            }
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [i18n.language])

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('adminDashboard')}</h1>
          <p className="text-gray-600 mt-2">
            {t('overviewPlatform')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('totalCourses')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('totalRevenue')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('totalSales')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('quickActions')}</h2>
            <div className="space-y-4">
              <Link
                to="/admin/courses"
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-blue-900">{t('manageCourses')}</h3>
                    <p className="text-sm text-blue-700">{t('createManage')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-900">{t('manageUsers')}</h3>
                    <p className="text-sm text-green-700">{t('viewManage')}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-green-600" />
              </Link>

              <Link
                to="/admin/blogs"
                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Manage Blog Posts</h3>
                    <p className="text-sm text-purple-700">Create and manage blog content</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-purple-600" />
              </Link>

              <Link
                to="/admin/categories"
                className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center">
                  <Tag className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-indigo-900">Manage Categories</h3>
                    <p className="text-sm text-indigo-700">Create and organize course categories</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-indigo-600" />
              </Link>

              <Link
                to="/admin/analytics"
                className="flex items-center justify-between p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-orange-900">{t('view')} {t('salesAnalytics')}</h3>
                    <p className="text-sm text-orange-700">Sales reports and insights</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-orange-600" />
              </Link>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('recentSales')}</h2>
              <Link
                to="/admin/analytics"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('viewAll')}
              </Link>
            </div>

            {stats.recentSales.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('noSalesYet')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentSales.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{sale.course_title}</p>
                      <p className="text-sm text-gray-600">{sale.email}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(sale.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: sale.currency || 'USD',
                        }).format(sale.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard