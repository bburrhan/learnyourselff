import React, { useState, useEffect } from 'react'
import { X, Download, Trash2, Filter, Search, AlertTriangle, Info, AlertCircle, Bug } from 'lucide-react'
import logger from '../../utils/logger'

interface LogViewerProps {
  isOpen: boolean
  onClose: () => void
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState(logger.getLogs())
  const [filteredLogs, setFilteredLogs] = useState(logs)
  const [levelFilter, setLevelFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      const currentLogs = logger.getLogs()
      setLogs(currentLogs)
      setFilteredLogs(currentLogs)
    }
  }, [isOpen])

  useEffect(() => {
    let filtered = logs

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }, [logs, levelFilter, searchTerm])

  const handleExportLogs = () => {
    const logsJson = logger.exportLogs()
    const blob = new Blob([logsJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs()
      setLogs([])
      setFilteredLogs([])
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warn':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'debug':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Application Logs</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No logs found</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start space-x-2">
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="text-xs font-medium uppercase">
                        {log.level}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{log.message}</p>
                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-gray-600">
                          View Details
                        </summary>
                        <pre className="text-xs mt-1 p-2 bg-white bg-opacity-50 rounded border overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-gray-600">
                          Stack Trace
                        </summary>
                        <pre className="text-xs mt-1 p-2 bg-white bg-opacity-50 rounded border overflow-x-auto whitespace-pre-wrap">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                    {log.url && (
                      <p className="text-xs text-gray-600 mt-1">
                        URL: {log.url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Showing {filteredLogs.length} of {logs.length} logs
          </p>
        </div>
      </div>
    </div>
  )
}

export default LogViewer