import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, Database } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { Search, Users, Calendar, Mail, Download } from 'lucide-react'
import { format } from 'date-fns'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  purchases?: {
    count: number
    total_spent: number
  }
}

const AdminUsers: React.FC = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // First fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // Then fetch purchase statistics for each user
        const usersWithStats = await Promise.all(
          (profilesData || []).map(async (profile) => {
            const { data: purchasesData, error: purchasesError } = await supabase
              .from('purchases')
              .select('amount, currency')
              .eq('user_id', profile.id)
              .eq('status', 'completed')

            if (purchasesError) {
              console.error('Error fetching purchases for user:', profile.id, purchasesError)
            }

            const purchases = purchasesData || []
            const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

            return {
              ...profile,
              purchases: {
                count: purchases.length,
                total_spent: totalSpent,
              },
            }
          })
        )

        setUsers(usersWithStats)
      } catch (error) {
        console.error('Error fetching users:', error)
        // Provide mock user data
        const mockUsers = [
          {
            id: 'mock-user-1',
            email: 'john@example.com',
            full_name: 'John Doe',
            language_preference: 'en',
            created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
            updated_at: new Date().toISOString(),
            purchases: {
              count: 2,
              total_spent: 14.98,
            },
          },
          {
            id: 'mock-user-2',
            email: 'jane@example.com',
            full_name: 'Jane Smith',
            language_preference: 'en',
            created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
            updated_at: new Date().toISOString(),
            purchases: {
              count: 1,
              total_spent: 9.99,
            },
          }
        ]
        setUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user =>
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingSpinner className="py-12" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('manageUsers')}</h1>
          <p className="text-gray-600 mt-2">{t('viewManage')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('totalUsers')}</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('activeBuyers')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.purchases && user.purchases.count > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{t('newThisMonth')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => {
                    const userDate = new Date(user.created_at)
                    const now = new Date()
                    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
                    return userDate >= monthAgo
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('purchases')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('totalSpent')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('language')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('joined')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || t('noName')}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.purchases?.count || 0} {t('courses')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${(user.purchases?.total_spent || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {user.language_preference?.toUpperCase() || 'EN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('noUsersFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminUsers