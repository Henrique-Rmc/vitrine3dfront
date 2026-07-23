import { createContext, useContext, useEffect, useState } from 'react'

type ThemePref = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemePref
  setTheme: (t: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(() => {
    try {
      return (localStorage.getItem('theme') as ThemePref | null) ?? 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])

  function setTheme(t: ThemePref) {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
