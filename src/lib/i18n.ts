import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import { getCurrentLanguageFromUrl } from '../components/Layout/LanguageRouter'

const initialLang = getCurrentLanguageFromUrl()

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr', 'hi', 'id', 'bn', 'vi', 'ur'],
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
