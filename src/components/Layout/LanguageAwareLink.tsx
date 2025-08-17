import React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import { createLanguageLink } from './LanguageRouter'

interface LanguageAwareLinkProps extends Omit<LinkProps, 'to'> {
  to: string
  language?: string
}

export const LanguageAwareLink: React.FC<LanguageAwareLinkProps> = ({ 
  to, 
  language, 
  children, 
  ...props 
}) => {
  const languageAwarePath = createLanguageLink(to, language)
  
  return (
    <Link to={languageAwarePath} {...props}>
      {children}
    </Link>
  )
}

export default LanguageAwareLink