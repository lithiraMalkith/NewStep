'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { fetchDashboardStats } from '@/lib/admin-client'
import { formatPrice } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { DashboardStats } from '@/types'

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait until Firebase Auth has resolved before attempting to fetch
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        setError(null)
        const token = await user.getIdToken()
        const data = await fetchDashboardStats(token)
        setStats(data)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (!stats) return
    const tl = gsap.timeline()
    tl.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,y' })
    tl.fromTo('.stat-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' }, '-=0.2')
    tl.fromTo('.chart-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,y' }, '-=0.3')
    tl.fromTo('.activity-item', { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out', clearProps: 'opacity,x' }, '-=0.3')
  }, { scope: containerRef, dependencies: [stats] })

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <p className="text-[#E05252] text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Revenue Today', value: formatPrice(stats.revenueToday), icon: <DollarSign className="w-5 h-5" />, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', trend: stats.revenueTrend, trendLabel: `${stats.revenueTrend > 0 ? '+' : ''}${stats.revenueTrend}%` },
    { label: 'Orders Today', value: stats.ordersToday, icon: <ShoppingCart className="w-5 h-5" />, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10', trend: stats.ordersTrend, trendLabel: `${stats.ordersTrend > 0 ? '+' : ''}${stats.ordersTrend}` },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: <Clock className="w-5 h-5" />, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
    { label: 'Low Stock Alert', value: stats.lowStockProducts, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-[#E05252]', bg: 'bg-[#E05252]/10' },
  ]

  const quickActions = [
    { label: 'View Orders', href: '/admin/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Add Product', href: '/admin/products/new', icon: <Package className="w-4 h-4" /> },
    { label: 'Customers', href: '/admin/customers', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div ref={containerRef} className="space-y-6 pb-10">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-2xl font-semibold text-[#F0EDE8]">Dashboard</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Welcome back — here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-5 relative overflow-hidden hover:border-[#3A3A3A] transition-colors">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className={`${card.bg} ${card.color} p-2.5 rounded-lg`}>
                  {card.icon}
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${card.trend >= 0 ? 'text-[#4CAF7D]' : 'text-[#E05252]'}`}>
                    {card.trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {card.trendLabel}
                  </div>
                )}
              </div>
              <p className="text-[#6B6B6B] text-sm mt-4">{card.label}</p>
              <p className="text-2xl font-bold text-[#F0EDE8] mt-1">{card.value}</p>
            </div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#C9A84C]/5 rounded-full blur-2xl" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-4">Revenue (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                labelStyle={{ color: '#C9A84C', fontWeight: 'bold' }}
                formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={3} dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6, fill: '#E2C270' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-4">Orders (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#C9A84C" radius={[6, 6, 0, 0]} name="Total" />
              <Bar dataKey="completed" fill="#6B6B6B" radius={[6, 6, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats summary */}
        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-4">Monthly Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Orders this month</span>
              <span className="text-sm font-semibold text-[#F0EDE8]">{stats.ordersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Revenue this month</span>
              <span className="text-sm font-semibold text-[#F0EDE8]">{formatPrice(stats.revenueThisMonth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Total products</span>
              <span className="text-sm font-semibold text-[#F0EDE8]">{stats.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B6B6B]">Total customers</span>
              <span className="text-sm font-semibold text-[#F0EDE8]">{stats.totalCustomers}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2A2A2A]">
            <h3 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((a) => (
                <button
                  key={a.href}
                  onClick={() => router.push(a.href)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-[#F0EDE8] hover:bg-[#1E1E1E] transition-colors"
                >
                  <span className="flex items-center gap-2">{a.icon} {a.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#6B6B6B]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="chart-card lg:col-span-2 bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-4">Recent Activity</h2>
          {stats.recentActivities.length === 0 ? (
            <p className="text-[#6B6B6B] text-sm text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="activity-item flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1E1E1E] transition-colors">
                  <div className="p-2 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] mt-0.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F0EDE8]">{activity.message}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {new Date(activity.time).toLocaleString('en-LK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
