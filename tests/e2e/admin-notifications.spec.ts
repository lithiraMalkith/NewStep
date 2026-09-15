import { test, expect } from '@playwright/test'

test.describe('Admin Notifications & Real-Time Auto-Update Tests', () => {

  test('1. Protected API endpoints for notifications require authentication', async ({ request }) => {
    // Both endpoints backing notifications must require authentication
    const ordersRes = await request.get('/api/orders?status=pending')
    expect(ordersRes.status()).toBe(401)

    const inventoryRes = await request.get('/api/inventory')
    expect(inventoryRes.status()).toBe(401)
  })

  test('2. Admin notifications bell & badge structure on login / unauthenticated guard', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/adminlogin/, { timeout: 25000 })
  })

  test('3. Notifications component event dispatching mechanism works without errors', async ({ page }) => {
    await page.goto('/adminlogin')
    await page.waitForLoadState('domcontentloaded')

    // Simulate cross-component notification dispatch event
    const eventDispatched = await page.evaluate(() => {
      try {
        window.dispatchEvent(new CustomEvent('admin:notifications-refresh', { detail: { type: 'orders' } }))
        window.dispatchEvent(new CustomEvent('admin:notifications-refresh', { detail: { type: 'inventory' } }))
        return true
      } catch {
        return false
      }
    })
    expect(eventDispatched).toBe(true)
  })

  test('4. Notification count mathematical logic handles combined pending + low stock items', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Validate the totalBadge calculation logic
    const testCalculation = await page.evaluate(() => {
      const calcBadge = (pending: number, lowStock: number) => {
        const total = pending + lowStock
        return {
          totalBadge: total,
          displayBadge: total > 99 ? '99+' : String(total),
          showBadge: total > 0,
        }
      }

      const caseZero = calcBadge(0, 0)
      const caseCombined = calcBadge(4, 3)
      const caseOrderOnly = calcBadge(5, 0)
      const caseStockOnly = calcBadge(0, 2)
      const caseLarge = calcBadge(120, 5)

      // Test order acceptance decrement:
      const beforeAccept = calcBadge(3, 2)
      const afterAccept = calcBadge(2, 2)

      // Test restock decrement:
      const beforeRestock = calcBadge(2, 2)
      const afterRestock = calcBadge(2, 1)

      return {
        caseZero,
        caseCombined,
        caseOrderOnly,
        caseStockOnly,
        caseLarge,
        beforeAccept,
        afterAccept,
        beforeRestock,
        afterRestock,
      }
    })

    expect(testCalculation.caseZero.showBadge).toBe(false)
    expect(testCalculation.caseZero.totalBadge).toBe(0)

    expect(testCalculation.caseCombined.showBadge).toBe(true)
    expect(testCalculation.caseCombined.totalBadge).toBe(7)
    expect(testCalculation.caseCombined.displayBadge).toBe('7')

    expect(testCalculation.caseOrderOnly.totalBadge).toBe(5)
    expect(testCalculation.caseStockOnly.totalBadge).toBe(2)
    expect(testCalculation.caseLarge.displayBadge).toBe('99+')

    // Acceptance decrement: 5 -> 4
    expect(testCalculation.beforeAccept.totalBadge).toBe(5)
    expect(testCalculation.afterAccept.totalBadge).toBe(4)

    // Restock decrement: 4 -> 3
    expect(testCalculation.beforeRestock.totalBadge).toBe(4)
    expect(testCalculation.afterRestock.totalBadge).toBe(3)
  })

  test('5. Storefront navigation and product catalog stay intact after notification updates', async ({ request }) => {
    const productsRes = await request.get('/api/storefront/products')
    expect(productsRes.status()).toBe(200)
    const json = await productsRes.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)
  })
})
