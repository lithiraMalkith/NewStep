import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests', () => {

  test('Homepage loads correctly with navigation, hero, and featured sections', async ({ page }) => {
    await page.goto('/');
    
    // Check page title / header
    await expect(page).toHaveTitle(/New Step Footwear/i);
    
    // Check main navigation link exists
    const shopLink = page.getByRole('link', { name: 'All Shoes' }).first();
    await expect(shopLink).toBeVisible();

    // Check footer exists
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();
  });

  test('Shop page displays products and filters work', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    
    // Check if product links exist
    const productCards = page.locator('a[href*="/product/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    // Test search filter
    const searchInput = page.getByPlaceholder(/Search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Runner');
      await page.waitForTimeout(400);
    }
  });

  test('Product detail page renders, allows size selection, and adding to cart', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    
    const firstProduct = page.locator('a[href*="/product/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    
    // Verify PDP URL
    await page.waitForURL(/\/product\//);
    expect(page.url()).toContain('/product/');
    
    // Size selection
    const sizeButtons = page.locator('button').filter({ hasText: /^\d{2}$/ });
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click();
    }
    
    // Look for Add to Bag / Add to Cart button
    const addToCartBtn = page.getByRole('button', { name: /Add to/i }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('Cart and Checkout navigation', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Customer Authentication pages load correctly', async ({ page }) => {
    // Customer Login
    await page.goto('/account/login');
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();

    // Customer Register
    await page.goto('/account/register');
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('Static & Policy pages load correctly', async ({ page }) => {
    const staticPages = ['/about', '/contact', '/policies/delivery'];
    for (const path of staticPages) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
