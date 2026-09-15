import { test, expect } from '@playwright/test';

test.describe('Hierarchical Category Tree & Mega-Menu E2E Tests', () => {

  test.describe('1. Storefront Navigation & Categories API', () => {
    test('GET /api/storefront/navigation returns hierarchical category tree', async ({ request }) => {
      const res = await request.get('/api/storefront/navigation');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(Array.isArray(json.tree)).toBe(true);
      expect(json.tree.length).toBeGreaterThan(0);

      // Verify 3-level tree node structure
      const rootNode = json.tree.find((n: { slug: string }) => n.slug === 'mens');
      expect(rootNode).toBeDefined();
      expect(rootNode.depth).toBe(0);
      expect(Array.isArray(rootNode.children)).toBe(true);
      expect(rootNode.children.length).toBeGreaterThan(0);

      // Level 1 subcategory
      const subNode = rootNode.children.find((c: { slug: string }) => c.slug === 'footwear');
      expect(subNode).toBeDefined();
      expect(subNode.depth).toBe(1);
      expect(Array.isArray(subNode.children)).toBe(true);

      // Level 2 sub-subcategory
      if (subNode.children.length > 0) {
        const subSubNode = subNode.children[0];
        expect(subSubNode.depth).toBe(2);
      }
    });

    test('GET /api/storefront/categories returns full tree for category browsing', async ({ request }) => {
      const res = await request.get('/api/storefront/categories');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });

    test('GET /api/categories admin endpoint requires authentication', async ({ request }) => {
      const res = await request.get('/api/categories');
      expect(res.status()).toBe(401);
    });

    test('POST /api/categories/reorder admin endpoint requires authentication', async ({ request }) => {
      const res = await request.post('/api/categories/reorder', {
        data: { updates: [] },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('2. Desktop Header Mega-Menu Navigation', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Hovering over category link triggers mega-menu dropdown with subcategories', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Desktop nav should be visible
      const menNavLink = page.locator('nav').getByRole('link', { name: 'Men', exact: true });
      await expect(menNavLink).toBeVisible({ timeout: 15000 });

      // Hover on "Men" nav link to trigger mega menu
      await menNavLink.hover();

      // Mega menu panel should appear with subcategories
      const footwearHeading = page.getByRole('link', { name: /Footwear/i }).first();
      await expect(footwearHeading).toBeVisible({ timeout: 10000 });

      // Sub-sub-categories under Footwear should be visible
      const sportsLink = page.getByRole('link', { name: /Sports & Running/i }).first();
      await expect(sportsLink).toBeVisible();

      // Promo banner card should be visible in mega menu
      const promoCard = page.locator('text=Men Collection').or(page.locator('text=Shop All Men'));
      await expect(promoCard.first()).toBeVisible();
    });

    test('Clicking subcategory link in mega-menu filters the shop page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const menNavLink = page.locator('nav').getByRole('link', { name: 'Men', exact: true });
      await expect(menNavLink).toBeVisible({ timeout: 15000 });
      await menNavLink.hover();

      // Click on Footwear subcategory
      const footwearLink = page.getByRole('link', { name: /Footwear/i }).first();
      await expect(footwearLink).toBeVisible({ timeout: 10000 });
      await footwearLink.click();

      // Should navigate to /shop/mens?sub=footwear
      await expect(page).toHaveURL(/\/shop\/mens\?sub=footwear/);
      await expect(page.locator('h1')).toContainText("Men's Shoes");
    });
  });

  test.describe('3. Category Page Sub-Category Filter Chips', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Category page renders sub-category filter pills and secondary sub-sub-category row', async ({ page }) => {
      await page.goto('/shop/mens?sub=footwear');
      await page.waitForLoadState('domcontentloaded');

      // Primary collection filter chips
      const allMenChip = page.getByRole('link', { name: "All Men's", exact: true });
      await expect(allMenChip).toBeVisible();

      const footwearChip = page.getByRole('link', { name: 'Footwear', exact: true }).first();
      await expect(footwearChip).toBeVisible();

      // Active subcategory badge in header
      const subBadge = page.locator('header').getByText(/Footwear/i);
      await expect(subBadge.first()).toBeVisible();

      // Secondary row of sub-sub-categories should appear because Footwear has children
      const sportsSubSub = page.getByRole('link', { name: /Sports & Running/i }).first();
      await expect(sportsSubSub).toBeVisible();

      // Click on Sports & Running
      await sportsSubSub.click();
      await expect(page).toHaveURL(/sub=footwear/);
      await expect(page).toHaveURL(/subsub=sports/);
    });

    test('Clearing sub-category filter resets URL to root category', async ({ page }) => {
      await page.goto('/shop/mens?sub=footwear');
      await page.waitForLoadState('domcontentloaded');

      // Click "All Men's" chip
      const allMenChip = page.getByRole('link', { name: "All Men's", exact: true });
      await expect(allMenChip).toBeVisible();
      await allMenChip.click();

      await expect(page).toHaveURL(/\/shop\/mens$/);
    });
  });

  test.describe('4. Mobile Navigation Drawer Accordion', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('Mobile drawer expands category accordion on toggle click', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Open mobile hamburger menu
      const menuButton = page.getByLabel('Open menu');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      await page.waitForTimeout(500);

      // Toggle button for Men's subcategories
      const toggleMen = page.getByLabel('Toggle Men subcategories');
      await expect(toggleMen).toBeVisible({ timeout: 5000 });
      await toggleMen.dispatchEvent('click');

      // Subcategories should expand in the drawer
      const subFootwear = page.locator('nav').getByRole('link', { name: 'Footwear' });
      await expect(subFootwear.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('5. Admin Categories Page Route Protection', () => {
    test('Unauthenticated access to /admin/categories redirects to /adminlogin', async ({ page }) => {
      await page.goto('/admin/categories');
      await expect(page).toHaveURL(/\/adminlogin/, { timeout: 35000 });
    });
  });

  test.describe('6. Catalog Product Verification for Each Category & Subcategory', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Men category and subcategories show populated products', async ({ page }) => {
      // Men Root
      await page.goto('/shop/mens');
      await page.waitForLoadState('domcontentloaded');
      const menProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await menProducts.count()).toBeGreaterThan(0);

      // Men Footwear
      await page.goto('/shop/mens?sub=footwear');
      await page.waitForLoadState('domcontentloaded');
      expect(await menProducts.count()).toBeGreaterThan(0);

      // Men Clothing (Heavyweight Relaxed Tee)
      await page.goto('/shop/mens?sub=clothing');
      await page.waitForLoadState('domcontentloaded');
      const clothingProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await clothingProducts.count()).toBeGreaterThan(0);
      await expect(page.locator('text=Relaxed Tee').first()).toBeVisible();

      // Men Accessories (Crew Socks)
      await page.goto('/shop/mens?sub=accessories');
      await page.waitForLoadState('domcontentloaded');
      const accProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await accProducts.count()).toBeGreaterThan(0);
      await expect(page.locator('text=Crew Socks').first()).toBeVisible();
    });

    test('Women category and subcategories show populated products', async ({ page }) => {
      // Women Root
      await page.goto('/shop/womens');
      await page.waitForLoadState('domcontentloaded');
      const womenProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await womenProducts.count()).toBeGreaterThan(0);

      // Women Footwear
      await page.goto('/shop/womens?sub=footwear');
      await page.waitForLoadState('domcontentloaded');
      expect(await womenProducts.count()).toBeGreaterThan(0);

      // Women Clothing (Studio Ribbed Tee)
      await page.goto('/shop/womens?sub=clothing');
      await page.waitForLoadState('domcontentloaded');
      const clothingProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await clothingProducts.count()).toBeGreaterThan(0);
      await expect(page.locator('text=Studio Ribbed Tee').first()).toBeVisible();

      // Women Accessories (Revive Care Kit)
      await page.goto('/shop/womens?sub=accessories');
      await page.waitForLoadState('domcontentloaded');
      const accProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await accProducts.count()).toBeGreaterThan(0);
      await expect(page.locator('text=Care Kit').first()).toBeVisible();
    });

    test('Kids category and subcategories show populated products', async ({ page }) => {
      // Kids Root
      await page.goto('/shop/kids');
      await page.waitForLoadState('domcontentloaded');
      const kidsProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await kidsProducts.count()).toBeGreaterThan(0);

      // Kids Footwear
      await page.goto('/shop/kids?sub=footwear');
      await page.waitForLoadState('domcontentloaded');
      expect(await kidsProducts.count()).toBeGreaterThan(0);

      // Kids Footwear > School (Explorer Backpack)
      await page.goto('/shop/kids?sub=footwear&subsub=school');
      await page.waitForLoadState('domcontentloaded');
      const schoolProducts = page.locator('article, [data-testid="product-card"], a[href*="/product/"]');
      expect(await schoolProducts.count()).toBeGreaterThan(0);
      await expect(page.locator('text=Backpack').or(page.locator('text=School')).first()).toBeVisible();
    });
  });

});
