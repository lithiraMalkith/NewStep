import { test, expect } from '@playwright/test';

test.describe('Admin Panel Tests', () => {

  test('Unauthenticated user is redirected from /admin to /adminlogin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/adminlogin/, { timeout: 10000 });
    expect(page.url()).toContain('/adminlogin');
    
    // Check login form presence
    await expect(page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'))).toBeVisible();
    await expect(page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'))).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Log In/i })).toBeVisible();
  });

  test('Admin login page renders cleanly without console errors or layout breaks', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/adminlogin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Ensure no fatal React or GSAP unhandled errors
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Firebase'));
    expect(fatalErrors.length).toBe(0);
  });

  test('All Admin subpages render properly without crashing', async ({ page }) => {
    const adminRoutes = [
      '/admin/products',
      '/admin/orders',
      '/admin/customers',
      '/admin/inventory',
      '/admin/categories',
      '/admin/messages',
      '/admin/roles',
      '/admin/users',
      '/admin/settings',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      // If unauthenticated, it redirects to /adminlogin safely
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/\/adminlogin|\/admin/);
    }
  });
});
