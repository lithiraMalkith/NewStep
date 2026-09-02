import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth, AuthedRequest } from '@/lib/auth-middleware'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthedRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const range = searchParams.get('range') || '30' // 7, 30, 90
      const days = parseInt(range, 10)
      
      const now = new Date()
      const startDate = startOfDay(subDays(now, days - 1))
      
      // Fetch orders within range
      const ordersSnapshot = await adminDb.collection('orders')
        .where('createdAt', '>=', startDate)
        .get()

      // Aggregate data
      const dailyRevenue: Record<string, number> = {}
      const categoryStats: Record<string, { revenue: number, count: number }> = {}
      const productStats: Record<string, { revenue: number, units: number }> = {}
      const statusStats: Record<string, number> = {
        pending: 0, processing: 0, dispatched: 0, delivered: 0, cancelled: 0
      }

      // Initialize daily revenue array
      for (let i = 0; i < days; i++) {
        const d = startOfDay(subDays(now, days - 1 - i)).toISOString().split('T')[0]
        dailyRevenue[d!] = 0
      }

      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data()
        const dateStr = order.createdAt?.toDate?.()?.toISOString().split('T')[0] || order.createdAt.split('T')[0]
        
        // Status breakdown
        if (order.status) {
          statusStats[order.status] = (statusStats[order.status] || 0) + 1
        }

        if (order.status !== 'cancelled') {
          if (dateStr && dailyRevenue[dateStr] !== undefined) {
            dailyRevenue[dateStr] += order.total
          }

          // Items aggregation
          order.items?.forEach((item: any) => {
            // Products
            if (!productStats[item.productName]) {
              productStats[item.productName] = { revenue: 0, units: 0 }
            }
            productStats[item.productName]!.revenue += item.price * item.quantity
            productStats[item.productName]!.units += item.quantity
          })
        }
      })

      // Format for charts
      const revenueChartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue
      }))

      const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      const orderStatuses = Object.entries(statusStats).map(([name, value]) => ({ name, value }))

      return NextResponse.json({
        success: true,
        data: {
          revenueChartData,
          topProducts,
          orderStatuses
        }
      })

    } catch (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
  }, 'dashboard:read')
}
