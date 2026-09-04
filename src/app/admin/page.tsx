'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { fetchDashboardStats } from '@/lib/admin-client'
import { formatPrice } from '@/lib/utils'
import {
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  Eye,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { DashboardStats } from '@/types'

const CATEGORY_COLORS = ['#F7F4EE', '#D4CBBF', '#9E978C', '#5C564E']

export default function AdminDashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
    tl.fromTo('.stat-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out', clearProps: 'opacity,y' }, '-=0.2')
    tl.fromTo('.chart-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out', clearProps: 'opacity,y' }, '-=0.2')
    tl.fromTo('.table-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out', clearProps: 'opacity,y' }, '-=0.2')
  }, { scope: containerRef, dependencies: [stats] })

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <p className="text-[#E05252] text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-[#F7F4EE]/10 border border-[#F7F4EE]/30 text-[#F7F4EE] text-sm hover:bg-[#F7F4EE]/20 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  // 7 KPI metric cards
  const statCards = [
    {
      label: 'Total Revenue',
      value: formatPrice(stats.revenueThisMonth),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-[#F7F4EE]',
      bg: 'bg-[#F7F4EE]/10',
      trend: stats.revenueTrend,
      trendLabel: `${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend}%`,
    },
    {
      label: 'Total Orders',
      value: stats.ordersThisMonth,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: 'text-[#FAF8F5]',
      bg: 'bg-[#FAF8F5]/10',
      trend: stats.ordersTrend,
      trendLabel: `${stats.ordersTrend >= 0 ? '+' : ''}${stats.ordersTrend}`,
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-[#D4CBBF]',
      bg: 'bg-[#D4CBBF]/10',
      badge: stats.pendingOrders > 0 ? 'Action Needed' : undefined,
      badgeColor: 'bg-[#D4CBBF]/15 text-[#D4CBBF]',
    },
    {
      label: 'Completed Orders',
      value: stats.completedOrders ?? 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-[#FAF8F5]',
      bg: 'bg-[#FAF8F5]/10',
      badge: 'Delivered',
      badgeColor: 'bg-[#FAF8F5]/15 text-[#FAF8F5]',
    },
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: <Users className="w-5 h-5" />,
      color: 'text-[#D4CBBF]',
      bg: 'bg-[#D4CBBF]/10',
    },
    {
      label: 'Total Products',
      value: stats.totalProducts,
      icon: <Package className="w-5 h-5" />,
      color: 'text-[#F7F4EE]',
      bg: 'bg-[#F7F4EE]/10',
    },
    {
      label: 'Low Stock Alerts',
      value: stats.lowStockProducts,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-[#E05252]',
      bg: 'bg-[#E05252]/10',
      badge: stats.lowStockProducts > 0 ? '≤ 5 units' : 'Healthy',
      badgeColor: stats.lowStockProducts > 0 ? 'bg-[#E05252]/15 text-[#E05252]' : 'bg-[#FAF8F5]/15 text-[#FAF8F5]',
    },
  ]

  const quickActions = [
    { label: 'View Orders', href: '/admin/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Add Product', href: '/admin/products/new', icon: <Package className="w-4 h-4" /> },
    { label: 'Manage Inventory', href: '/admin/inventory', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Moderate Reviews', href: '/admin/reviews', icon: <Clock className="w-4 h-4" /> },
  ]

  const categoryPieData = stats.salesByCategory && stats.salesByCategory.length > 0
    ? stats.salesByCategory
    : (stats.categoryRevenue && stats.categoryRevenue.length > 0
        ? stats.categoryRevenue.map((c, i) => ({ name: c.category, value: c.revenue, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
        : [
            { name: "Men's", value: 48500, color: '#F7F4EE' },
            { name: "Women's", value: 36200, color: '#D4CBBF' },
            { name: "Kids'", value: 19400, color: '#8A8478' },
          ])

  const topProductsList = stats.topProducts && stats.topProducts.length > 0
    ? stats.topProducts
    : []

  const recentOrdersList = stats.recentOrders && stats.recentOrders.length > 0
    ? stats.recentOrders
    : []

  return (
    <div ref={containerRef} className="space-y-6 pb-12">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Dashboard</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            Real-time analytics and management overview for New Step Footwear.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => router.push('/admin/products/new')}
            className="px-4 py-2 rounded-lg bg-[#F7F4EE] text-[#0B0B0B] font-semibold text-xs hover:bg-[#FFFFFF] transition-colors shadow-xs"
          >
            + New Product
          </button>
        </div>
      </div>

      {/* 7 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="stat-card bg-[#121212] rounded-xl border border-[#24221F] p-4 relative overflow-hidden hover:border-[#3A352F] transition-all duration-200"
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <div className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                  {card.icon}
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${card.trend >= 0 ? 'text-[#FAF8F5]' : 'text-[#E05252]'}`}>
                    {card.trend >= 0 ? <TrendingUp className="w-3 h-3 text-[#F7F4EE]" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{card.trendLabel}</span>
                  </div>
                )}
                {card.badge && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[#8A8478] text-xs font-medium">{card.label}</p>
                <p className="text-xl font-bold text-[#FAF8F5] mt-0.5 tracking-tight truncate">{card.value}</p>
              </div>
            </div>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#F7F4EE]/5 rounded-full blur-xl" />
          </div>
        ))}
      </div>

      {/* 3 Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. 7-Day Revenue Trend (Smooth Area Chart with Cream Gradient) */}
        <div className="chart-card bg-[#121212] rounded-xl border border-[#24221F] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF8F5]">Revenue Trend</h2>
              <p className="text-xs text-[#8A8478]">Last 7 days performance</p>
            </div>
            <span className="text-xs font-semibold text-[#F7F4EE] bg-[#F7F4EE]/10 px-2.5 py-1 rounded-full border border-[#F7F4EE]/20">
              {formatPrice(stats.revenueThisWeek)} this week
            </span>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.revenueData}>
              <defs>
                <linearGradient id="creamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7F4EE" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#F7F4EE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#24221F" vertical={false} />
              <XAxis dataKey="day" stroke="#8A8478" style={{ fontSize: '11px' }} />
              <YAxis stroke="#8A8478" style={{ fontSize: '11px' }} tickFormatter={(val) => `Rs.${(val/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #24221F', borderRadius: '8px' }}
                labelStyle={{ color: '#F7F4EE', fontWeight: 'bold' }}
                formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#F7F4EE"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#creamGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Orders Distribution (Bar Chart: Total vs Completed) */}
        <div className="chart-card bg-[#121212] rounded-xl border border-[#24221F] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF8F5]">Orders Distribution</h2>
              <p className="text-xs text-[#8A8478]">Total vs Delivered orders</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.ordersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#24221F" vertical={false} />
              <XAxis dataKey="day" stroke="#8A8478" style={{ fontSize: '11px' }} />
              <YAxis stroke="#8A8478" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #24221F', borderRadius: '8px' }}
              />
              <Bar dataKey="orders" fill="#F7F4EE" radius={[4, 4, 0, 0]} name="Total Placed" />
              <Bar dataKey="completed" fill="#8A8478" radius={[4, 4, 0, 0]} name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Sales by Category (Donut Chart) */}
        <div className="chart-card bg-[#121212] rounded-xl border border-[#24221F] p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF8F5]">Sales by Category</h2>
              <p className="text-xs text-[#8A8478]">Revenue share across lines</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryPieData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid #24221F', borderRadius: '8px' }}
                formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-center gap-4 text-xs mt-2">
            {categoryPieData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: c.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="text-[#8A8478]">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Tables & Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Columns) */}
        <div className="table-card lg:col-span-2 bg-[#121212] rounded-xl border border-[#24221F] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#FAF8F5]">Recent Orders</h2>
              <p className="text-xs text-[#8A8478]">Latest island-wide customer orders</p>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="text-xs font-medium text-[#F7F4EE] hover:underline flex items-center gap-1"
            >
              All Orders <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentOrdersList.length === 0 ? (
            <div className="py-12 text-center text-[#8A8478] text-sm">
              No recent orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#24221F] text-[#8A8478]">
                    <th className="text-left pb-2.5 font-medium">Order Ref</th>
                    <th className="text-left pb-2.5 font-medium">Customer</th>
                    <th className="text-left pb-2.5 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-left pb-2.5 font-medium">Status</th>
                    <th className="text-right pb-2.5 font-medium">Total</th>
                    <th className="text-right pb-2.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24221F]/60">
                  {recentOrdersList.map((order) => (
                    <tr key={order.id} className="hover:bg-[#181818] transition-colors">
                      <td className="py-3 font-mono font-medium text-[#F7F4EE]">{order.orderRef}</td>
                      <td className="py-3 font-medium text-[#FAF8F5]">{order.customerName}</td>
                      <td className="py-3 text-[#8A8478] hidden sm:table-cell">
                        {new Date(order.date).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                          order.status === 'delivered'
                            ? 'bg-white/10 text-white border border-white/20'
                            : order.status === 'processing'
                              ? 'bg-[#F7F4EE]/10 text-[#F7F4EE] border border-[#F7F4EE]/30'
                              : order.status === 'dispatched'
                                ? 'bg-[#D4CBBF]/15 text-[#FAF8F5] border border-[#D4CBBF]/30'
                                : 'bg-[#D4CBBF]/10 text-[#D4CBBF] border border-[#D4CBBF]/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-[#FAF8F5]">Rs. {order.total.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="p-1.5 rounded hover:bg-[#1C1C1C] text-[#8A8478] hover:text-[#FAF8F5] transition-colors"
                          title="View order"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Selling Products & Quick Actions (1 Column) */}
        <div className="space-y-6">
          {/* Top Selling Products */}
          <div className="table-card bg-[#121212] rounded-xl border border-[#24221F] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#FAF8F5]">Top Selling Products</h2>
                <p className="text-xs text-[#8A8478]">By sales volume & revenue</p>
              </div>
              <button
                onClick={() => router.push('/admin/products')}
                className="text-xs font-medium text-[#F7F4EE] hover:underline"
              >
                Catalog
              </button>
            </div>

            <div className="space-y-3">
              {topProductsList.map((product, idx) => (
                <div
                  key={product.name + idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0B0B] border border-[#24221F] hover:border-[#3A352F] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#181818] shrink-0 border border-[#24221F]">
                      <Image
                        src={product.image || '/images/p1.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#FAF8F5] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#8A8478]">{product.category || 'Footwear'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[#F7F4EE]">Rs. {product.revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-[#8A8478]">{product.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav Actions */}
          <div className="table-card bg-[#121212] rounded-xl border border-[#24221F] p-5">
            <h3 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.href}
                  onClick={() => router.push(a.href)}
                  className="flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium text-[#FAF8F5] bg-[#0B0B0B] border border-[#24221F] hover:border-[#F7F4EE]/50 hover:bg-[#181818] transition-colors text-left"
                >
                  <span className="text-[#F7F4EE]">{a.icon}</span>
                  <span className="truncate">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
