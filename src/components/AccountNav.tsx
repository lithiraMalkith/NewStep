'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AccountNavProps {
  activeTab?: 'orders' | 'profile' | 'addresses'
}

export default function AccountNav({ activeTab }: AccountNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const navItems = [
    {
      id: 'orders',
      label: 'Recent Orders',
      href: '/account/orders',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/account/profile',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      ),
    },
    {
      id: 'addresses',
      label: 'Address Book',
      href: '/account/addresses',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="hidden md:block border-b border-line bg-paper/60 backdrop-blur pb-px">
      <div className="container-x flex flex-wrap items-center justify-between gap-4 py-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-muted hover:text-ink hover:bg-mist'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Status / Quick Actions */}
        <div className="flex items-center gap-3 text-xs text-muted">
          {user ? (
            <>
              <span className="hidden sm:inline">Signed in as <strong className="text-ink font-medium">{user.displayName || user.email}</strong></span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-ink hover:border-ink hover:bg-mist transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/account/login"
              className="rounded-full border border-ink bg-ink px-4 py-1.5 text-xs font-medium text-paper hover:bg-ink/80 transition-colors"
            >
              Sign in / Register
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
