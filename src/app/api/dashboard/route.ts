import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/dashboard — Dashboard stats
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart)
      weekStart.setDate(weekStart.getDate() - 7)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Fetch all orders for the month (sort in memory to avoid composite index)
      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('createdAt', '>=', monthStart)
        .get()

      const orders = ordersSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          orderRef: data.orderRef || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          total: data.total || 0,
          status: data.status || 'pending',
        }
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      const ordersToday = orders.filter((o) => o.createdAt >= todayStart)
      const ordersThisWeek = orders.filter((o) => o.createdAt >= weekStart)

      const revenueToday = ordersToday.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)
      const revenueThisWeek = ordersThisWeek.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)
      const revenueThisMonth = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)

      const pendingOrders = orders.filter((o) => o.status === 'pending').length

      // Products stats
      const productsSnapshot = await adminDb.collection('products').get()
      const products = productsSnapshot.docs.map((doc) => doc.data())
      const totalProducts = products.length
      const lowStockProducts = products.filter((p) => {
        const totalQty = (p.variants || []).reduce((s: number, v: { stockQty: number }) => s + v.stockQty, 0)
        return totalQty > 0 && totalQty <= 5
      }).length

      // Customers count
      const customersSnapshot = await adminDb.collection('customers').count().get()
      const totalCustomers = customersSnapshot.data().count

      // Revenue data (last 7 days)
      const revenueData = []
      for (let i = 6; i >= 0; i--) {
        const day = new Date(todayStart)
        day.setDate(day.getDate() - i)
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)

        const dayOrders = orders.filter((o) => o.createdAt >= day && o.createdAt < nextDay)
        revenueData.push({
          day: day.toLocaleDateString('en-LK', { weekday: 'short' }),
          revenue: dayOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0),
        })
      }

      // Orders data (last 7 days)
      const ordersData = []
      for (let i = 6; i >= 0; i--) {
        const day = new Date(todayStart)
        day.setDate(day.getDate() - i)
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)

        const dayOrders = orders.filter((o) => o.createdAt >= day && o.createdAt < nextDay)
        ordersData.push({
          day: day.toLocaleDateString('en-LK', { weekday: 'short' }),
          orders: dayOrders.length,
          completed: dayOrders.filter((o) => o.status === 'delivered').length,
        })
      }

      // Recent activities
      const recentActivities = orders.slice(0, 10).map((o) => ({
        id: Math.random().toString(36).slice(2),
        type: 'order' as const,
        message: `New order ${o.orderRef || 'N/A'} — Rs. ${(o.total || 0).toLocaleString()}`,
        time: o.createdAt.toISOString(),
      }))

      // Trends
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      const yesterdayOrders = orders.filter((o) => o.createdAt >= yesterdayStart && o.createdAt < todayStart)
      const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total : 0), 0)

      const stats = {
        ordersToday: ordersToday.length,
        ordersThisWeek: ordersThisWeek.length,
        ordersThisMonth: orders.length,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        pendingOrders,
        lowStockProducts,
        totalProducts,
        totalCustomers,
        revenueData,
        ordersData,
        recentActivities,
        revenueTrend: yesterdayRevenue > 0 ? Math.round(((revenueToday - yesterdayRevenue) / yesterdayRevenue) * 100) : 0,
        ordersTrend: ordersToday.length - yesterdayOrders.length,
      }

      return NextResponse.json({ success: true, data: stats })
    } catch (error) {
      console.error('GET /api/dashboard error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
  }, 'dashboard:read')
}
