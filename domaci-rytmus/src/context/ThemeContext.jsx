import { createContext, useContext, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export const THEMES = {
  indigo:  { primary: '#4f46e5', bg: '#eef2ff', ring: '#6366f1', tailwind: 'indigo' },
  violet:  { primary: '#7c3aed', bg: '#f5f3ff', ring: '#8b5cf6', tailwind: 'violet' },
  rose:    { primary: '#e11d48', bg: '#fff1f2', ring: '#f43f5e', tailwind: 'rose'   },
  emerald: { primary: '#059669', bg: '#ecfdf5', ring: '#10b981', tailwind: 'emerald'},
  amber:   { primary: '#d97706', bg: '#fffbeb', ring: '#f59e0b', tailwind: 'amber'  },
  cyan:    { primary: '#0891b2', bg: '#ecfeff', ring: '#06b6d4', tailwind: 'cyan'   },
}

const ThemeContext = createContext('indigo')

export function ThemeProvider({ children }) {
  const [colorTheme] = useLocalStorage('color-theme', 'indigo')

  useEffect(() => {
    const t = THEMES[colorTheme] || THEMES.indigo
    const root = document.documentElement
    root.style.setProperty('--color-primary', t.primary)
    root.style.setProperty('--color-primary-bg', t.bg)
    root.style.setProperty('--color-primary-ring', t.ring)
  }, [colorTheme])

  return (
    <ThemeContext.Provider value={colorTheme}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
