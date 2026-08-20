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
  { label: 'Products', href: '/admin/products', permission: 'products:read', icon: <Package className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', permission: 'orders:read', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'Customers', href: '/admin/customers', permission: 'customers:read', icon: <Users className="w-5 h-5" /> },
  { label: 'Inventory', href: '/admin/inventory', permission: 'inventory:read', icon: <Boxes className="w-5 h-5" /> },
  { label: 'Categories', href: '/admin/categories', permission: 'categories:read', icon: <FolderTree className="w-5 h-5" /> },
  { label: 'Messages', href: '/admin/messages', permission: 'messages:read', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Roles', href: '/admin/roles', permission: 'roles:read', icon: <Shield className="w-5 h-5" /> },
  { label: 'Users', href: '/admin/users', permission: 'users:read', icon: <UserCog className="w-5 h-5" /> },
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
      router.push('/adminlogin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const filteredItems = SIDEBAR_ITEMS.filter((item) => hasPermission(item.permission))

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#2A2A2A]">
        {!collapsed && (
          <Link href="/admin" className="text-xl font-bold text-[#F0EDE8] tracking-tight">
            New<span className="text-[#6B6B6B]">Step</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E] transition-colors"
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
                ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C]'
                : 'text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E]',
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
      <div className="border-t border-[#2A2A2A] p-4">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm text-[#F0EDE8] truncate">{user.email}</p>
            <p className="text-xs text-[#6B6B6B] capitalize">{role || 'user'}</p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6B6B6B] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors w-full',
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
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0EDE8]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col bg-[#161616] border-r border-[#2A2A2A] transition-all duration-300',
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
          className={cn('absolute inset-0 bg-black/60 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[260px] bg-[#161616] border-r border-[#2A2A2A] flex flex-col transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-[#2A2A2A]">
            <span className="text-xl font-bold text-[#F0EDE8]">
              New<span className="text-[#6B6B6B]">Step</span>
            </span>
            <button onClick={() => setMobileOpen(false)} className="p-1.5 text-[#6B6B6B] hover:text-[#F0EDE8]">
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
                    ? 'bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C]'
                    : 'text-[#6B6B6B] hover:text-[#F0EDE8] hover:bg-[#1E1E1E]'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-[#2A2A2A] p-4">
            <p className="text-sm text-[#F0EDE8] truncate">{user.email}</p>
            <p className="text-xs text-[#6B6B6B] capitalize mb-3">{role || 'user'}</p>
            <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#6B6B6B] hover:text-[#E05252] w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>
      </div>

      {/* Top bar */}
      <header
        className={cn(
          'sticky top-0 z-30 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-[#2A2A2A] transition-all duration-300',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
        )}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#F0EDE8] lg:hidden">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <AdminNotifications />
            <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#0D0D0D] text-sm font-bold">
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
