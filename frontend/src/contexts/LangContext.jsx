import { createContext, useContext, useState } from 'react'
import translations from '../locales/translations'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  function toggleLang() {
    const next = lang === 'en' ? 'mr' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  function t(section, key) {
    return translations[lang]?.[section]?.[key] ?? translations['en']?.[section]?.[key] ?? key
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
