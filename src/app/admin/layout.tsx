'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Boxes,
  FolderTree,
  Shield,
  UserCog,
  MessageSquare,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  X,
  Loader2,
  Star,
  BarChart3,
  Tag,
  ExternalLink,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import AdminNotifications from './AdminNotifications'

interface SidebarItem {
  label: string
  href: string
  permission: string
  icon: React.ReactNode
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin', permission: 'dashboard:read', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Product Catalog', href: '/admin/products', permission: 'products:read', icon: <Package className="w-5 h-5" /> },
  { label: 'Featured Products', href: '/admin/featured', permission: 'featured:read', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Categories', href: '/admin/categories', permission: 'categories:read', icon: <FolderTree className="w-5 h-5" /> },
  { label: 'Inventory', href: '/admin/inventory', permission: 'inventory:read', icon: <Boxes className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', permission: 'orders:read', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', permission: 'customers:read', icon: <Users className="w-5 h-5" /> },
  { label: 'Reviews', href: '/admin/reviews', permission: 'reviews:read', icon: <Star className="w-5 h-5" /> },
  { label: 'Discounts', href: '/admin/discounts', permission: 'discounts:read', icon: <Tag className="w-5 h-5" /> },
  { label: 'Reports', href: '/admin/reports', permission: 'dashboard:read', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Roles & Permissions', href: '/admin/roles', permission: 'roles:read', icon: <Shield className="w-5 h-5" /> },
  { label: 'Messages', href: '/admin/messages', permission: 'messages:read', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Audit Log', href: '/admin/audit', permission: 'audit:read', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', permission: 'settings:read', icon: <Settings className="w-5 h-5" /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role, hasPermission, signOut, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMobileOpen(false), [pathname])

  useGSAP(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,y' }
      )
    }
  }, { dependencies: [pathname] })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/adminlogin')
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/adminlogin')) {
          window.location.replace('/adminlogin')
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  if (role === 'customer') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="w-16 h-16 rounded-full bg-[#E05252]/10 border border-[#E05252]/30 flex items-center justify-center text-[#E05252] mb-5">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#F7F4EE] mb-2">Access Denied</h1>
        <p className="text-[#A39E93] text-sm max-w-md mb-6 leading-relaxed">
          You are currently signed in as <strong className="text-[#F7F4EE]">{user.email}</strong>, which does not have administrator privileges.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg bg-[#1A1A1A] text-[#F7F4EE] text-sm hover:bg-[#242424] transition-colors border border-[#2E2A24]"
          >
            Back to Store
          </Link>
          <button
            onClick={async () => {
              await signOut()
              router.push('/adminlogin')
            }}
            className="px-5 py-2.5 rounded-lg bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-sm hover:bg-[#FFFFFF] transition-colors shadow-xs"
          >
            Sign In with Admin Account
          </button>
        </div>
      </div>
    )
  }

  const filteredItems = SIDEBAR_ITEMS.filter((item) => hasPermission(item.permission))

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#24221F]">
        {!collapsed && (
          <Link href="/admin" className="text-xl font-bold text-[#FFFFFF] tracking-tight">
            New<span className="text-[#D4CBBF]">Step</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-[#A39E93] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(item.href)
                ? 'bg-[#F7F4EE] text-[#0B0B0B] font-semibold shadow-xs'
                : 'text-[#A39E93] hover:text-[#FFFFFF] hover:bg-[#1A1A1A]',
              collapsed && 'justify-center'
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[#24221F] p-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm text-[#F7F4EE] truncate">{user.email}</p>
            <p className="text-xs text-[#A39E93] capitalize">{role || 'user'}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A39E93] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors w-full',
            collapsed && 'justify-center'
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F7F4EE]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col bg-[#121212] border-r border-[#24221F] transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
      <div
        className={cn('fixed inset-0 z-50 lg:hidden', mobileOpen ? '' : 'pointer-events-none')}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn('absolute inset-0 bg-black/70 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[260px] bg-[#121212] border-r border-[#24221F] flex flex-col transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-[#24221F]">
            <span className="text-xl font-bold text-[#FFFFFF]">
              New<span className="text-[#D4CBBF]">Step</span>
            </span>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 text-[#A39E93] hover:text-[#FFFFFF]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive(item.href)
                    ? 'bg-[#F7F4EE] text-[#0B0B0B] font-semibold shadow-xs'
                    : 'text-[#A39E93] hover:text-[#FFFFFF] hover:bg-[#1A1A1A]'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-[#24221F] p-4">
            <p className="text-sm text-[#F7F4EE] truncate">{user.email}</p>
            <p className="text-xs text-[#A39E93] capitalize mb-3">{role || 'user'}</p>
            <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A39E93] hover:text-[#E05252] w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>
      </div>

      {/* Top bar */}
      <header
        className={cn(
          'sticky top-0 z-30 bg-[#0B0B0B]/80 backdrop-blur-md border-b border-[#24221F] transition-all duration-300',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-[#A39E93] hover:text-[#FFFFFF] lg:hidden">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#D4CBBF] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors border border-[#2E2A24]"
              title="Open storefront in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Store</span>
            </Link>

            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F4EE]/10 text-[#F7F4EE] border border-[#F7F4EE]/30 capitalize">
              {role === 'superadmin' ? 'Super Admin' : (role ? role.replace('_', ' ') : 'Staff')}
            </span>

            <AdminNotifications />
            <div className="w-8 h-8 rounded-full bg-[#F7F4EE] flex items-center justify-center text-[#0B0B0B] text-sm font-bold shadow-xs">
              {(user.email?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        ref={contentRef}
        className={cn(
          'p-6 transition-all duration-300 min-h-[calc(100vh-56px)]',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        {children}
      </main>
    </div>
  )
}
