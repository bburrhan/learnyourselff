import { useEffect } from 'react'

interface SeoOptions {
  title?: string
  description?: string
}

const SITE_NAME = 'LearnYourself'

export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle

    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    if (description) {
      metaDesc.setAttribute('content', description)
    }

    return () => {
      document.title = SITE_NAME
    }
  }, [title, description])
}

export default useSeo
