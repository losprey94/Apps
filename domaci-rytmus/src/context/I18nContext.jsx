import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import T, { LANGUAGES } from '../i18n/index'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useLocalStorage('app-language', 'sk')

  const t = (key, vars) => {
    const dict = T[lang] || T.sk
    let str = dict[key] ?? T.sk[key] ?? (typeof vars === 'string' ? vars : key)
    if (vars && typeof vars === 'object') {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
      })
    }
    return str
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
