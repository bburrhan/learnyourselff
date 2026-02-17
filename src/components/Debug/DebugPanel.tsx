import React, { useState } from 'react'
import { Bug, X, Database, Wifi, User, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import logger from '../../utils/logger'
import LogViewer from './LogViewer'

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')

  const checkSupabaseConnection = async () => {
    setConnectionStatus('checking')
    try {
      const { data, error } = await supabase.from('courses').select('count').limit(1)
      if (error) throw error
      setConnectionStatus('connected')
      logger.info('Supabase connection test successful')
    } catch (error) {
      setConnectionStatus('disconnected')
      logger.error('Supabase connection test failed', { error }, error as Error)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      checkSupabaseConnection()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bug className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Debug Panel</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Environment Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Environment</span>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>Mode:</strong> {import.meta.env.MODE}</p>
              <p><strong>Dev:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}</p>
              <p><strong>URL:</strong> {window.location.origin}</p>
            </div>
          </div>

          {/* User Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">User Status</span>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>Logged In:</strong> {user ? 'Yes' : 'No'}</p>
              {user && (
                <>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Role:</strong> {user.app_metadata?.role || 'user'}</p>
                </>
              )}
            </div>
          </div>

          {/* Database Connection */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <p className="flex items-center space-x-1">
                  <span>Status:</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></span>
                  <span>{connectionStatus}</span>
                </p>
              </div>
              <button
                onClick={checkSupabaseConnection}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                Test
              </button>
            </div>
          </div>

          {/* Network Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Wifi className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="text-xs">
              <p><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</p>
              <p><strong>Connection:</strong> {(navigator as any).connection?.effectiveType || 'Unknown'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setLogViewerOpen(true)}
              className="w-full text-left px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              View Application Logs
            </button>
            <button
              onClick={() => {
                logger.clearLogs()
                alert('Logs cleared!')
              }}
              className="w-full text-left px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              Clear All Logs
            </button>
          </div>
        </div>
      </div>

      <LogViewer 
        isOpen={logViewerOpen} 
        onClose={() => setLogViewerOpen(false)} 
      />
    </>
  )
}

export default DebugPanel