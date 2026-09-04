import { test, expect } from '@playwright/test';

test.describe('Enhanced Admin Panel Modules & Analytics E2E Tests', () => {

  test.describe('1. Admin Route Protection & Security Guards', () => {
    const requiredModules = [
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/products', name: 'Products Catalog' },
      { path: '/admin/categories', name: 'Categories' },
      { path: '/admin/inventory', name: 'Inventory Manager' },
      { path: '/admin/orders', name: 'Orders' },
      { path: '/admin/customers', name: 'Customers' },
      { path: '/admin/reviews', name: 'Reviews Moderation' },
      { path: '/admin/discounts', name: 'Discounts & Coupons' },
      { path: '/admin/reports', name: 'Reports & Analytics' },
      { path: '/admin/roles', name: 'Roles & Permissions' },
    ];

    for (const mod of requiredModules) {
      test(`Unauthenticated request to ${mod.path} (${mod.name}) is protected and redirected to /adminlogin`, async ({ page }) => {
        await page.goto(mod.path);
        await expect(page).toHaveURL(/\/adminlogin/, { timeout: 15000 });
      });
    }
  });

  test.describe('2. Admin API Route Status & Response Envelopes', () => {
    test('GET /api/dashboard blocks unauthorized access with 401', async ({ request }) => {
      const res = await request.get('/api/dashboard');
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('GET /api/products requires authorization header', async ({ request }) => {
      const res = await request.get('/api/products');
      expect(res.status()).toBe(401);
    });

    test('GET /api/inventory requires authorization header', async ({ request }) => {
      const res = await request.get('/api/inventory');
      expect(res.status()).toBe(401);
    });

    test('GET /api/reviews with admin=true requires authorization', async ({ request }) => {
      const res = await request.get('/api/reviews?admin=true');
      expect(res.status()).toBe(401);
    });
  });

  test.describe('3. Admin UI Components & Shell Resilience', () => {
    test('Admin login page renders cleanly with zero console crashes and supports keyboard navigation', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/adminlogin');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      await expect(emailInput).toBeVisible({ timeout: 10000 });
      await expect(passwordInput).toBeVisible({ timeout: 10000 });

      // Keyboard navigation flow
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(passwordInput).toBeFocused();

      const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Firebase'));
      expect(fatalErrors.length).toBe(0);
    });
  });
});
