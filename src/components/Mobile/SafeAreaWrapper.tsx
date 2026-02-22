import React from 'react'

interface SafeAreaWrapperProps {
  children: React.ReactNode
  className?: string
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {children}
    </div>
  )
}

export default SafeAreaWrapper
