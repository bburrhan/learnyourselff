import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import logger from '../../utils/logger'
import { handleSupabaseError, handleAsyncError } from '../../utils/errorHandler'
import { Download, Calendar, ExternalLink, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type Purchase = Database['public']['Tables']['purchases']['Row'] & {
  courses: Database['public']['Tables']['courses']['Row']
}

const MyCourses: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return

      const result = await handleAsyncError(async () => {
        logger.info('Fetching user purchases', { userId: user.id })
        
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            *,
            courses!inner (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .eq('courses.language', i18n.language)
          .order('created_at', { ascending: false })

        if (error) {
          handleSupabaseError(error, 'fetchUserPurchases')
          throw error
        }

        logger.info('User purchases fetched', { count: data?.length || 0 })
        setPurchases(data || [])
        return true
      }, 'fetchUserPurchases', false)
      
      if (!result) {
        logger.warn('Failed to fetch purchases, using mock data')
        setPurchases([])
      }
      
      setLoading(false)
    }

    fetchPurchases()
  }, [user, i18n.language])

  const handleDownload = async (purchaseId: string, courseTitle: string) => {
    setDownloading(purchaseId)
    
    const result = await handleAsyncError(async () => {
      logger.info('Starting course download', { purchaseId, courseTitle })
      
      // Check if this is a demo purchase or real purchase
      const purchase = purchases.find(p => p.id === purchaseId)
      if (purchase?.stripe_payment_id?.startsWith('demo_')) {
        // Demo mode - simulate download
        logger.info('Demo download simulated', { purchaseId })
        toast.success('Demo mode: In production, your PDF would download now!')
        
        // Update download count for demo
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ 
            download_count: purchase.download_count + 1,
            last_download_at: new Date().toISOString()
          })
          .eq('id', purchaseId)

        if (!updateError) {
          // Update local state
          const updatedPurchases = purchases.map(p => 
            p.id === purchaseId 
              ? { ...p, download_count: p.download_count + 1, last_download_at: new Date().toISOString() }
              : p
          )
          setPurchases(updatedPurchases)
        }
      } else {
        // Real download flow
        logger.info('Processing real download', { purchaseId })
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-course`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            purchaseId,
          }),
        })

        const result = await response.json()

        if (result.error) {
          logger.error('Download service error', { error: result.error })
          throw new Error(result.error)
        }

        // Create a temporary download link
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = `${courseTitle}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success('Download started!')
        logger.info('Download completed successfully', { purchaseId })

        // Refresh the purchases to update download count
        const updatedPurchases = purchases.map(p => 
          p.id === purchaseId 
            ? { ...p, download_count: p.download_count + 1, last_download_at: new Date().toISOString() }
            : p
        )
        setPurchases(updatedPurchases)
      }

      return true
    }, 'downloadCourse')
    
    if (!result) {
      toast.error('Failed to download course')
    }
    
    setDownloading(null)
  }

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{t('myCourses')}</h2>
        <p className="text-gray-600 mt-1">{t('accessDownload')}</p>
      </div>

      <div className="p-6">
        {purchases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <ExternalLink className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noCoursesPurchased')}</h3>
            <p className="text-gray-600 mb-6">
              Start learning by purchasing your first course
            </p>
            <a
              href="/courses"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('browseCoursesBtn')}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={purchase.courses.cover_image_url}
                    alt={purchase.courses.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {purchase.courses.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          by {purchase.courses.instructor_name}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {t('purchased')} {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Download className="h-4 w-4 mr-1" />
                            Downloaded {purchase.download_count} times
                          </div>
                        </div>
                        {purchase.last_download_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last download: {format(new Date(purchase.last_download_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 mb-2">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: purchase.currency || 'USD',
                          }).format(purchase.amount)}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {t('purchased')}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {purchase.download_count} {purchase.download_count === 1 ? 'download' : 'downloads'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDownload(purchase.id, purchase.courses.title)}
                          disabled={downloading === purchase.id}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {downloading === purchase.id ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              {t('preparing')}
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              {t('downloadCourse')}
                            </>
                          )}
                        </button>
                      </div>
                      
                      {purchase.download_count === 0 && (
                        <div className="flex items-center text-amber-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {t('notDownloadedYet')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCourses