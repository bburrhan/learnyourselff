import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getCurrentLanguageFromUrl } from '../components/Layout/LanguageRouter'

const initialLang = getCurrentLanguageFromUrl()

const fetchBackend = {
  type: 'backend' as const,
  init: () => {},
  read: (language: string, namespace: string, callback: (err: unknown, data: unknown) => void) => {
    fetch(`/locales/${language}/${namespace}.json`)
      .then((res) => res.json())
      .then((data) => callback(null, data))
      .catch((err) => callback(err, null))
  },
}

i18n
  .use(fetchBackend)
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr', 'hi', 'id', 'bn', 'vi', 'ur'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
