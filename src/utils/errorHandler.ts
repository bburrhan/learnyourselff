import logger from './logger'
import toast from 'react-hot-toast'

export interface AppError extends Error {
  code?: string
  statusCode?: number
  context?: any
}

export class CustomError extends Error implements AppError {
  code?: string
  statusCode?: number
  context?: any

  constructor(message: string, code?: string, statusCode?: number, context?: any) {
    super(message)
    this.name = 'CustomError'
    this.code = code
    this.statusCode = statusCode
    this.context = context
  }
}

export const handleError = (error: unknown, context?: string, showToast = true) => {
  let errorMessage = 'An unexpected error occurred'
  let errorCode = 'UNKNOWN_ERROR'
  let statusCode = 500

  if (error instanceof CustomError) {
    errorMessage = error.message
    errorCode = error.code || 'CUSTOM_ERROR'
    statusCode = error.statusCode || 500
  } else if (error instanceof Error) {
    errorMessage = error.message
    if (error.message.includes('fetch')) {
      errorCode = 'NETWORK_ERROR'
      errorMessage = 'Network connection failed. Please check your internet connection.'
    } else if (error.message.includes('auth')) {
      errorCode = 'AUTH_ERROR'
      errorMessage = 'Authentication failed. Please log in again.'
    }
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  // Log the error
  logger.error(`Error in ${context || 'unknown context'}`, {
    message: errorMessage,
    code: errorCode,
    statusCode,
    originalError: error,
    context,
  }, error instanceof Error ? error : new Error(errorMessage))

  // Show toast notification if requested
  if (showToast) {
    toast.error(errorMessage)
  }

  return {
    message: errorMessage,
    code: errorCode,
    statusCode,
  }
}

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: string,
  showToast = true
): Promise<T | null> => {
  try {
    logger.debug(`Starting async operation: ${context}`)
    const result = await asyncFn()
    logger.debug(`Completed async operation: ${context}`)
    return result
  } catch (error) {
    handleError(error, context, showToast)
    return null
  }
}

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: string,
  showToast = true
) => {
  return (...args: T): R | null => {
    try {
      logger.debug(`Executing function: ${context}`)
      const result = fn(...args)
      logger.debug(`Function completed: ${context}`)
      return result
    } catch (error) {
      handleError(error, context, showToast)
      return null
    }
  }
}

// Supabase error handler
export const handleSupabaseError = (error: any, context?: string) => {
  let message = 'Database operation failed'
  let code = 'SUPABASE_ERROR'

  if (error?.message) {
    if (error.message.includes('JWT')) {
      message = 'Session expired. Please log in again.'
      code = 'SESSION_EXPIRED'
    } else if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
      message = 'Session expired. Please log in again.'
      code = 'SESSION_EXPIRED'
    } else if (error.message.includes('Row Level Security')) {
      message = 'Access denied. You don\'t have permission for this action.'
      code = 'ACCESS_DENIED'
    } else if (error.message.includes('duplicate key')) {
      message = 'This item already exists.'
      code = 'DUPLICATE_ENTRY'
    } else if (error.message.includes('foreign key')) {
      message = 'Cannot complete operation due to data dependencies.'
      code = 'FOREIGN_KEY_CONSTRAINT'
    } else {
      message = error.message
    }
  }

  return handleError(new CustomError(message, code, error.status), context)
}

// Network error handler
export const handleNetworkError = (error: any, context?: string) => {
  let message = 'Network request failed'
  let code = 'NETWORK_ERROR'

  if (error?.status) {
    switch (error.status) {
      case 400:
        message = 'Bad request. Please check your input.'
        code = 'BAD_REQUEST'
        break
      case 401:
        message = 'Unauthorized. Please log in again.'
        code = 'UNAUTHORIZED'
        break
      case 403:
        message = 'Access forbidden. You don\'t have permission.'
        code = 'FORBIDDEN'
        break
      case 404:
        message = 'Resource not found.'
        code = 'NOT_FOUND'
        break
      case 429:
        message = 'Too many requests. Please try again later.'
        code = 'RATE_LIMITED'
        break
      case 500:
        message = 'Server error. Please try again later.'
        code = 'SERVER_ERROR'
        break
      default:
        message = `Request failed with status ${error.status}`
    }
  }

  return handleError(new CustomError(message, code, error.status), context)
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise,
  })
  event.preventDefault() // Prevent the default browser behavior
})

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  logger.error('Uncaught error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})