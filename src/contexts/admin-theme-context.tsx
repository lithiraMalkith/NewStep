'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type AdminTheme = 'dark' | 'light'

interface AdminThemeContextType {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'newstep_admin_theme'

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY) as AdminTheme | null
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme)
        document.documentElement.setAttribute('data-admin-theme', savedTheme)
      } else {
        document.documentElement.setAttribute('data-admin-theme', 'dark')
      }
    } catch {
      document.documentElement.setAttribute('data-admin-theme', 'dark')
    }
    setMounted(true)
  }, [])

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignore quota/storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-admin-theme', newTheme)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div data-admin-theme={theme} className="admin-theme-wrapper contents">
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext)
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  }
  return context
}
