import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import T, { LANGUAGES } from '../i18n/index'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useLocalStorage('app-language', 'sk')

  const t = (key, fallback) => {
    const dict = T[lang] || T.sk
    return dict[key] ?? T.sk[key] ?? fallback ?? key
  }

  const locale = LANGUAGES.find(l => l.code === lang)?.locale ?? 'sk-SK'

  return (
    <I18nContext.Provider value={{ lang, setLang, t, locale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
