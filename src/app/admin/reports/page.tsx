'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { cn, formatPrice } from '@/lib/utils'
import { BarChart3, Loader2, Download, TrendingUp } from 'lucide-react'
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
  Legend
} from 'recharts'

export default function AdminReportsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      setLoading(true)
      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/reports?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const payload = await res.json()
        if (payload.success) {
          setData(payload.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading, range])

  useGSAP(() => {
    if (loading) return
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'all' })
    gsap.fromTo('.chart-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out', clearProps: 'all' })
  }, { scope: containerRef, dependencies: [loading, data] })

  const PIE_COLORS = ['#C9A84C', '#4CAF7D', '#6B6B6B', '#E05252', '#3B82F6']

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  const totalRevenue = data?.revenueChartData?.reduce((acc: number, item: any) => acc + item.revenue, 0) || 0

  return (
    <div ref={containerRef} className="space-y-6 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F0EDE8]">Reports & Analytics</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Deep dive into your store's performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            className="bg-[#161616] border border-[#2A2A2A] rounded-lg px-4 py-2 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1E1E1E] text-[#F0EDE8] border border-[#2A2A2A] text-sm font-medium rounded-lg hover:bg-[#2A2A2A] transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {loading && data && (
        <div className="absolute top-20 right-10 z-50">
           <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
        </div>
      )}

      {/* Overview Stat */}
      <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#6B6B6B]">Total Revenue (Selected Period)</p>
            <h2 className="text-4xl font-bold text-[#F0EDE8] mt-2">{formatPrice(totalRevenue)}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#C9A84C]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="chart-card lg:col-span-2 bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-6">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.revenueChartData || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="date" stroke="#6B6B6B" style={{ fontSize: '12px' }} tickMargin={10} minTickGap={30} />
              <YAxis stroke="#6B6B6B" style={{ fontSize: '12px' }} tickFormatter={v => `Rs.${v/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                formatter={(value: number) => [formatPrice(value), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 flex flex-col">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-6">Order Status Breakdown</h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.orderStatuses || []}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.orderStatuses || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '8px' }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-sm font-semibold text-[#F0EDE8] mb-4">Top Selling Products (By Revenue)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-[#6B6B6B] text-left">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Units</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topProducts || []).map((product: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#2A2A2A] last:border-0 hover:bg-[#1E1E1E]/50">
                    <td className="py-3 text-[#F0EDE8] truncate max-w-[200px]">{product.name}</td>
                    <td className="py-3 text-[#6B6B6B] text-right">{product.units}</td>
                    <td className="py-3 text-[#C9A84C] font-medium text-right">{formatPrice(product.revenue)}</td>
                  </tr>
                ))}
                {(!data?.topProducts || data.topProducts.length === 0) && (
                  <tr><td colSpan={3} className="py-4 text-center text-[#6B6B6B]">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 flex flex-col justify-center items-center text-center">
            <BarChart3 className="w-12 h-12 text-[#2A2A2A] mb-4" />
            <h3 className="text-lg font-medium text-[#F0EDE8]">More reports coming soon</h3>
            <p className="text-sm text-[#6B6B6B] mt-2 max-w-sm">We are working on adding advanced analytics, cohort analysis, and geographic sales data.</p>
        </div>
      </div>
    </div>
  )
}
