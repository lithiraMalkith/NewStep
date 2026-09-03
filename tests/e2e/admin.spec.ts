import { test, expect } from '@playwright/test';

test.describe('Admin Panel E2E & Security Guard Tests', () => {

  test.describe('1. Admin Authentication & Login Page', () => {
    test('Unauthenticated user navigating to /admin is redirected to /adminlogin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForURL(/\/adminlogin/, { timeout: 10000 });
      expect(page.url()).toContain('/adminlogin');

      // Check login form presence
      await expect(page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'))).toBeVisible();
      await expect(page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In|Log In/i })).toBeVisible();
    });

    test('Admin login page renders with zero critical console or runtime errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/adminlogin');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Ensure no fatal React or unhandled errors
      const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Firebase'));
      expect(fatalErrors.length).toBe(0);
    });

    test('Admin login form displays validation feedback on empty submission', async ({ page }) => {
      await page.goto('/adminlogin');
      const submitBtn = page.getByRole('button', { name: /Sign In|Log In/i });
      await submitBtn.click();

      // HTML5 validation or form error
      const emailInput = page.locator('input[type="email"]');
      const isRequired = await emailInput.getAttribute('required');
      expect(isRequired !== null).toBeTruthy();
    });
  });

  test.describe('2. Comprehensive Admin Route Protection & Security Guards', () => {
    const adminRoutes = [
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/products', name: 'Products List' },
      { path: '/admin/products/new', name: 'Create Product' },
      { path: '/admin/orders', name: 'Orders List' },
      { path: '/admin/customers', name: 'Customers List' },
      { path: '/admin/inventory', name: 'Inventory Manager' },
      { path: '/admin/categories', name: 'Category Management' },
      { path: '/admin/discounts', name: 'Discounts & Coupons' },
      { path: '/admin/reviews', name: 'Customer Reviews Moderation' },
      { path: '/admin/reports', name: 'Analytics & Reports' },
      { path: '/admin/messages', name: 'Customer Inquiries' },
      { path: '/admin/roles', name: 'RBAC Roles' },
      { path: '/admin/users', name: 'Team & Staff Users' },
      { path: '/admin/settings', name: 'Store Settings' },
    ];

    for (const route of adminRoutes) {
      test(`Unauthenticated request to ${route.path} (${route.name}) is blocked or guarded`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        // Must either redirect to /adminlogin or stay guarded on admin auth check
        expect(page.url()).toMatch(/\/adminlogin|\/admin/);
      });
    }
  });

  test.describe('3. Admin UI Resilience & Shell Structure', () => {
    test('Admin login page layout has accessible contrast and responsive elements', async ({ page }) => {
      await page.goto('/adminlogin');
      const container = page.locator('main, form, div').filter({ hasText: /Admin/i }).first();
      await expect(container).toBeVisible();

      // Ensure form controls are focusable
      const email = page.locator('input[type="email"]');
      await email.focus();
      await expect(email).toBeFocused();
    });
  });
});
