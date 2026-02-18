import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`flex justify-center items-center ${className}`} role="status" aria-label="Loading">
      <Loader2 className={`animate-spin text-royal-blue-600 ${sizeClasses[size]}`} />
    </div>
  )
}

export default LoadingSpinner