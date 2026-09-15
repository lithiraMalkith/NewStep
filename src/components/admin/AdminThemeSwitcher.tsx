'use client'

import React from 'react'
import { useAdminTheme } from '@/contexts/admin-theme-context'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminThemeSwitcherProps {
  collapsed?: boolean
}

export default function AdminThemeSwitcher({ collapsed = false }: AdminThemeSwitcherProps) {
  const { theme, toggleTheme } = useAdminTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center justify-center p-2 rounded-lg transition-all duration-200',
        'text-[#A39E93] hover:text-[#FAF8F5] hover:bg-[#1A1A1A]',
        collapsed && 'w-full'
      )}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
