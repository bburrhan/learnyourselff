interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: keyof LogLevel
  message: string
  data?: any
  stack?: string
  userAgent?: string
  url?: string
  userId?: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private createLogEntry(level: keyof LogLevel, message: string, data?: any, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    if (error) {
      entry.stack = error.stack
    }

    // Add user ID if available
    const user = this.getCurrentUser()
    if (user) {
      entry.userId = user.id
    }

    return entry
  }

  private getCurrentUser() {
    try {
      // Try to get user from localStorage or session storage
      const userStr = localStorage.getItem('supabase.auth.token')
      if (userStr) {
        const authData = JSON.parse(userStr)
        return authData.user
      }
    } catch (e) {
      // Ignore errors when getting user
    }
    return null
  }

  private storeLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100))) // Store last 100 logs
    } catch (e) {
      // Ignore storage errors
    }
  }

  private sendToConsole(entry: LogEntry) {
    const consoleMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
    
    switch (entry.level) {
      case LOG_LEVELS.ERROR:
        console.error(consoleMessage, entry.data, entry.stack)
        break
      case LOG_LEVELS.WARN:
        console.warn(consoleMessage, entry.data)
        break
      case LOG_LEVELS.INFO:
        console.info(consoleMessage, entry.data)
        break
      case LOG_LEVELS.DEBUG:
        if (this.isDevelopment) {
          console.debug(consoleMessage, entry.data)
        }
        break
    }
  }

  private async sendToRemote(entry: LogEntry) {
    // Only send errors and warnings to remote logging in production
    if (!this.isDevelopment && (entry.level === LOG_LEVELS.ERROR || entry.level === LOG_LEVELS.WARN)) {
      try {
        // You can implement remote logging here (e.g., send to Supabase, Sentry, etc.)
        // For now, we'll just store it locally
        console.log('Would send to remote logging:', entry)
      } catch (e) {
        // Ignore remote logging errors
      }
    }
  }

  error(message: string, data?: any, error?: Error) {
    const entry = this.createLogEntry(LOG_LEVELS.ERROR, message, data, error)
    this.storeLog(entry)
    this.sendToConsole(entry)
    this.sendToRemote(entry)
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry(LOG_LEVELS.WARN, message, data)
    this.storeLog(entry)
    this.sendToConsole(entry)
    this.sendToRemote(entry)
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry(LOG_LEVELS.INFO, message, data)
    this.storeLog(entry)
    this.sendToConsole(entry)
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      const entry = this.createLogEntry(LOG_LEVELS.DEBUG, message, data)
      this.storeLog(entry)
      this.sendToConsole(entry)
    }
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Get logs by level
  getLogsByLevel(level: keyof LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  // Clear all logs
  clearLogs() {
    this.logs = []
    localStorage.removeItem('app_logs')
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Load logs from localStorage on initialization
  loadStoredLogs() {
    try {
      const storedLogs = localStorage.getItem('app_logs')
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs)
      }
    } catch (e) {
      console.warn('Failed to load stored logs:', e)
    }
  }
}

// Create singleton instance
const logger = new Logger()
logger.loadStoredLogs()

export default logger