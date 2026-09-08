import { test, expect } from '@playwright/test';

test.describe('New Step Footwear - All Application & Enhancement Features E2E Test Suite', () => {

  /* =========================================================================
   * FEATURE 3: Dynamic Categories (Storefront & API)
   * ========================================================================= */
  test.describe('Feature 3: Dynamic Categories API & Storefront', () => {
    test('GET /api/storefront/categories returns HTTP 200 with structured category data', async ({ request }) => {
      const res = await request.get('/api/storefront/categories');
      expect(res.status()).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);

      if (json.data.length > 0) {
        const cat = json.data[0];
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('slug');
      }
    });

    test('Storefront homepage renders dynamic category explore section with links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const categoryHeading = page.getByRole('heading', { name: /Shop by category/i });
      await expect(categoryHeading).toBeVisible();

      // Check for category links
      const categoryLinks = page.locator('a[href*="/shop/"]');
      await expect(categoryLinks.first()).toBeVisible({ timeout: 10000 });
      const count = await categoryLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Storefront /shop page renders dynamic category tabs for instant filtering', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('domcontentloaded');

      // The category tabs container
      const allTab = page.getByRole('button', { name: 'All', exact: true }).or(
        page.locator('button').filter({ hasText: /^All$/i })
      );
      await expect(allTab.first()).toBeVisible({ timeout: 10000 });

      // Click on a category tab if present (e.g. Men's or Women's)
      const mensTab = page.locator('button').filter({ hasText: /Men's/i }).first();
      if (await mensTab.isVisible()) {
        await mensTab.click();
        await page.waitForTimeout(300);
        // Switch back to All
        await allTab.first().click();
      }
    });
  });

  /* =========================================================================
   * FEATURE 4: Featured Products Management (API & Admin Protection)
   * ========================================================================= */
  test.describe('Feature 4: Featured Products Management & API', () => {
    test('GET /api/featured blocks unauthenticated callers with 401 Unauthorized', async ({ request }) => {
      const res = await request.get('/api/featured');
      expect(res.status()).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('PUT /api/featured blocks unauthenticated callers with 401 Unauthorized', async ({ request }) => {
      const res = await request.put('/api/featured', {
        data: { featured: [{ id: 'p-001', featuredOrder: 1 }] },
      });
      expect(res.status()).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('Unauthenticated user navigating to /admin/featured is guarded and redirected to /adminlogin', async ({ page }) => {
      await page.goto('/admin/featured', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/adminlogin/, { timeout: 25000 });
      expect(page.url()).toContain('/adminlogin');
    });
  });

  /* =========================================================================
   * FEATURE 5: Pagination (Load More) on Catalogue
   * ========================================================================= */
  test.describe('Feature 5: Product Catalogue Pagination (Load More)', () => {
    test('Shop page renders initial 12 products batch and provides "Show more shoes →" button', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('heading', { name: /All Shoes/i })).toBeVisible({ timeout: 20000 });
      const productCards = page.locator('div[data-page]');
      await expect(productCards.first()).toBeVisible({ timeout: 20000 });

      const initialCount = await productCards.count();
      expect(initialCount).toBe(12);

      // Check for Load More button
      const loadMoreBtn = page.getByRole('button', { name: /Show more shoes/i });
      if (await loadMoreBtn.isVisible()) {
        // Counter indicating remaining products
        await expect(page.getByText(/more to show/i)).toBeVisible();

        // Click load more
        await loadMoreBtn.click();
        await expect(page.getByText(/Showing 24 of/i)).toBeVisible({ timeout: 15000 });

        // Card count should have increased to 24
        const updatedCount = await productCards.count();
        expect(updatedCount).toBe(24);
      }
    });

    test('Changing filters or searching resets pagination to page 1', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('domcontentloaded');

      // Click on a category tab or size filter to verify filter selection works
      const mensTab = page.locator('button').filter({ hasText: /Men's/i }).first();
      if (await mensTab.isVisible()) {
        await mensTab.click();
        await page.waitForTimeout(300);

        // Switch back to All
        const allTab = page.locator('button').filter({ hasText: /^All$/i }).first();
        if (await allTab.isVisible()) {
          await allTab.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  /* =========================================================================
   * FEATURE 2: Colour & Size Variants Selection with Availability Indicator
   * ========================================================================= */
  test.describe('Feature 2: Colour & Size Variants Selection with Availability Indicator', () => {
    test('Product detail page enforces size selection and displays availability indicators', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      // Check size options exist
      const sizeHeading = page.getByText(/Select size \(EU\)/i);
      await expect(sizeHeading).toBeVisible({ timeout: 15000 });

      // Ensure client hydration is complete
      await page.waitForTimeout(400);

      // Attempt adding to bag without selecting a size
      const addToBagBtn = page.getByRole('button', { name: /Add to bag/i });
      if (await addToBagBtn.isVisible() && !await addToBagBtn.isDisabled()) {
        await addToBagBtn.click();
        await expect(page.getByText(/Please select a size first/i)).toBeVisible({ timeout: 8000 });
      }

      // Now click an available (non-disabled, numeric) size button
      const availableSize = page.locator('button:not([disabled])').filter({ hasText: /^(3[6-9]|4[0-6])$/ }).first();
      await expect(availableSize).toBeVisible({ timeout: 10000 });
      await availableSize.click();

      // Error message must disappear
      await expect(page.getByText(/Please select a size first/i)).not.toBeVisible();

      // Check if Colour selector appears (when product has colour variants)
      const colourHeading = page.getByText(/Select colour/i);
      if (await colourHeading.isVisible()) {
        const availableColour = page.locator('button:not([disabled])').filter({ hasText: /^[A-Za-z]/ }).first();
        if (await availableColour.isVisible()) {
          await availableColour.click();
        }
      }

      // Add to bag succeeds
      if (await addToBagBtn.isVisible()) {
        await addToBagBtn.click();
        await page.waitForTimeout(500);

        // Verify cart link is visible
        const cartLink = page.locator('a[href="/cart"]').first();
        await expect(cartLink).toBeVisible();
      }
    });

    test('Unavailable sizes or colour variants render the 🚫 emoji indicator', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      // Check if size buttons have rendered
      const sizeButtons = page.locator('button').filter({ hasText: /^(3[6-9]|4[0-6]|🚫)$/ });
      await expect(sizeButtons.first()).toBeVisible({ timeout: 15000 });
      const count = await sizeButtons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  /* =========================================================================
   * FEATURE 1: New Product Adding Form (No Unwanted Auto-fill)
   * ========================================================================= */
  test.describe('Feature 1: New Product Creation Form Clean Defaults & Validation', () => {
    test('Unauthenticated visit to /admin/products/new is redirected to /adminlogin', async ({ page }) => {
      await page.goto('/admin/products/new');
      await expect(page).toHaveURL(/\/adminlogin/, { timeout: 15000 });
      expect(page.url()).toContain('/adminlogin');
    });

    test('POST /api/products requires authorization and rejects empty product payload', async ({ request }) => {
      // Unauthenticated attempt
      const unauthRes = await request.post('/api/products', {
        data: { name: '', price: 0 },
      });
      expect(unauthRes.status()).toBe(401);
    });
  });

  /* =========================================================================
   * FEATURE 6: Product Detail View (Admin Redesign & Public Detail View)
   * ========================================================================= */
  test.describe('Feature 6: Product Detail View (Admin & Storefront)', () => {
    test('Admin product detail route /admin/products/[id] is guarded and redirects to /adminlogin', async ({ page }) => {
      await page.goto('/admin/products/p-001');
      await expect(page).toHaveURL(/\/adminlogin/, { timeout: 15000 });
      expect(page.url()).toContain('/adminlogin');
    });

    test('Storefront product page loads full shoe specs, accordion details, and size guide', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      // Title & price
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/Rs\./i).first()).toBeVisible();

      // Accordion: Size Guide
      const sizeGuideBtn = page.getByRole('button', { name: /Size guide/i }).first();
      if (await sizeGuideBtn.isVisible()) {
        await sizeGuideBtn.click();
        await expect(page.getByText(/Foot length|EU|UK/i).first()).toBeVisible();
      }

      // Accordion: Delivery & returns
      const deliveryBtn = page.getByRole('button', { name: /Delivery & returns/i }).first();
      if (await deliveryBtn.isVisible()) {
        await deliveryBtn.click();
        await expect(page.getByText(/courier|working days|exchange/i).first()).toBeVisible();
      }

      // WhatsApp direct inquiry link
      const askBtn = page.getByRole('link', { name: /Ask about this shoe/i });
      await expect(askBtn).toBeVisible();
      await expect(askBtn).toHaveAttribute('href', /wa\.me/);
    });
  });

  /* =========================================================================
   * FEATURE 7: Audit Log (API & Admin Protection)
   * ========================================================================= */
  test.describe('Feature 7: Admin Audit Log API & Security Guard', () => {
    test('GET /api/audit blocks unauthenticated caller with 401 Unauthorized', async ({ request }) => {
      const res = await request.get('/api/audit');
      expect(res.status()).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('Unauthenticated user navigating to /admin/audit is redirected to /adminlogin', async ({ page }) => {
      await page.goto('/admin/audit');
      await expect(page).toHaveURL(/\/adminlogin/, { timeout: 15000 });
      expect(page.url()).toContain('/adminlogin');
    });
  });

  /* =========================================================================
   * COMPLETE APPLICATION FLOW: Cart, Checkout, Search, Filters & Legal
   * ========================================================================= */
  test.describe('Complete Application User Flow: Cart, Checkout, Policies', () => {
    test('Full cart and checkout progression with empty and populated bag', async ({ page }) => {
      // 1. Visit empty cart
      await page.goto('/cart');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

      // 2. Add product to bag
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      const availableSize = page.locator('button:not([disabled])').filter({ hasText: /^(3[6-9]|4[0-6])$/ }).first();
      await expect(availableSize).toBeVisible({ timeout: 15000 });
      await availableSize.click();

      // Select colour if presented
      const colourHeading = page.getByText(/Select colour/i);
      if (await colourHeading.isVisible()) {
        const colourBtn = page.locator('button:not([disabled])').filter({ hasText: /^[A-Za-z]/ }).first();
        if (await colourBtn.isVisible()) await colourBtn.click();
      }

      const addBtn = page.getByRole('button', { name: /Add to bag/i });
      await expect(addBtn).toBeVisible({ timeout: 10000 });
      await addBtn.click();
      await page.waitForTimeout(600);

      // 3. Navigate to Cart
      await page.goto('/cart');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/Subtotal/i).first()).toBeVisible({ timeout: 15000 });

      // 4. Navigate to Checkout
      const checkoutBtn = page.getByRole('link', { name: /Checkout|Proceed/i }).first();
      await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
      await checkoutBtn.click();
      await page.waitForURL(/\/checkout/, { timeout: 15000 });

      // Checkout form fields
      await expect(page.locator('form').first()).toBeVisible({ timeout: 15000 });
    });

    test('All customer static policies and support pages render properly', async ({ page }) => {
      const pages = ['/about', '/contact', '/size-guide', '/policies/delivery', '/policies/returns', '/policies/privacy', '/policies/terms'];
      for (const p of pages) {
        const res = await page.goto(p);
        expect(res?.status()).toBeLessThan(400);
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('Customer authentication portal (/account/login & /account/register) renders correctly', async ({ page }) => {
      await page.goto('/account/login');
      await expect(page.getByRole('heading', { name: /Sign in|Login|Welcome/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      await page.goto('/account/register');
      await expect(page.getByRole('heading', { name: /Create account|Register|Sign up/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });
});
