import { test, expect } from '@playwright/test';

test.describe('Storefront Reviews System & Expanded Catalog E2E Tests', () => {

  test.describe('1. Reviews API Verification', () => {
    test('GET /api/reviews requires productId parameter', async ({ request }) => {
      const res = await request.get('/api/reviews');
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/productId/i);
    });

    test('GET /api/reviews?productId=velocity-runner-white returns approved reviews list', async ({ request }) => {
      const res = await request.get('/api/reviews?productId=velocity-runner-white');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('GET /api/reviews/stats returns aggregate rating breakdown', async ({ request }) => {
      const res = await request.get('/api/reviews/stats?productId=velocity-runner-white');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('averageRating');
      expect(json.data).toHaveProperty('totalReviews');
      expect(json.data).toHaveProperty('ratingDistribution');
    });

    test('POST /api/reviews requires bearer authentication', async ({ request }) => {
      const res = await request.post('/api/reviews', {
        data: {
          productId: 'velocity-runner-white',
          rating: 5,
          comment: 'Outstanding shoe for morning city runs and daily errands!',
        },
      });
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });
    test('GET /api/reviews/eligibility returns unauthenticated data without bearer token', async ({ request }) => {
      const res = await request.get('/api/reviews/eligibility?productId=velocity-runner-white');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.canReview).toBe(false);
      expect(json.data.hasPurchased).toBe(false);
      expect(json.data.isAuthenticated).toBe(false);
    });
  });

  test.describe('2. Product Reviews Layout & Interaction on Product Page', () => {
    test('Product page renders reviews section with graceful verified buyer notice for guests', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      // Check that section#reviews exists
      const reviewsSection = page.locator('#reviews');
      await expect(reviewsSection).toBeVisible();

      // Heading should be visible
      await expect(reviewsSection.getByRole('heading', { name: /reviews/i })).toBeVisible();

      // Unauthenticated visitors see the graceful verified buyer notice
      await expect(reviewsSection.locator('text=Verified Buyer Reviews')).toBeVisible();
      await expect(reviewsSection.locator('text=Only verified customers who purchased')).toBeVisible();

      // Ensure write review button is removed for unauthenticated visitors
      const writeReviewBtn = reviewsSection.getByRole('button', { name: /write a review/i });
      await expect(writeReviewBtn).toHaveCount(0);
    });

    test('Clicking star rating badge near title smoothly targets reviews section', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      const ratingAnchor = page.locator('a[href="#reviews"]');
      if (await ratingAnchor.count() > 0) {
        await expect(ratingAnchor).toBeVisible();
        await ratingAnchor.click();
        await expect(page.locator('#reviews')).toBeInViewport({ ratio: 0.1 });
      }
    });

    test('Unauthenticated guest is presented with sign-in link to check purchase status', async ({ page }) => {
      await page.goto('/product/velocity-runner-white');
      await page.waitForLoadState('domcontentloaded');

      const reviewsSection = page.locator('#reviews');
      const signInLink = reviewsSection.getByRole('link', { name: /Sign in to check purchase status/i });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', /account\/login/);
    });
  });

  test.describe('3. Expanded Catalog Products & Categorization', () => {
    test('Catalog products appear across Men, Women, and Kids collections', async ({ page }) => {
      // 1. Mens
      await page.goto('/shop/mens');
      await page.waitForLoadState('domcontentloaded');
      const mensProducts = page.locator('a[href^="/product/"]');
      expect(await mensProducts.count()).toBeGreaterThanOrEqual(4);

      // 2. Womens
      await page.goto('/shop/womens');
      await page.waitForLoadState('domcontentloaded');
      const womensProducts = page.locator('a[href^="/product/"]');
      expect(await womensProducts.count()).toBeGreaterThanOrEqual(4);

      // 3. Kids
      await page.goto('/shop/kids');
      await page.waitForLoadState('domcontentloaded');
      const kidsProducts = page.locator('a[href^="/product/"]');
      expect(await kidsProducts.count()).toBeGreaterThanOrEqual(4);
    });

    test('Newly added product Apex Street Sneaker renders with images, price, and details', async ({ page }) => {
      await page.goto('/product/apex-street-sneaker-slate');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Apex Street/i);
      await expect(page.locator('body')).toContainText(/Rs\.\s*13,900/);
      await expect(page.locator('body')).toContainText(/Slate Blue/i);

      // Check size buttons
      const sizeButtons = page.locator('button[aria-pressed]');
      expect(await sizeButtons.count()).toBeGreaterThan(0);
    });

    test('Newly added product Summit Trekker Boot renders correctly', async ({ page }) => {
      await page.goto('/product/summit-trekker-boot-tobacco');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Summit Trekker/i);
      await expect(page.locator('body')).toContainText(/Rs\.\s*18,500/);
      await expect(page.locator('body')).toContainText(/Tobacco Brown/i);
    });

    test('Newly added product Aura Velocity Runner renders correctly', async ({ page }) => {
      await page.goto('/product/aura-velocity-runner-peach');
      await page.waitForLoadState('domcontentloaded');

      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Aura Velocity/i);
      await expect(page.locator('body')).toContainText(/Peach/i);
    });
  });

  test.describe('4. Size Selection, Add to Bag & Checkout Flow with New Products', () => {
    test('User can select a size and add newly expanded shoe to bag', async ({ page }) => {
      await page.goto('/product/apex-street-sneaker-slate');
      await page.waitForLoadState('domcontentloaded');

      // Select size 40
      const sizeBtn = page.getByRole('button', { name: '40', exact: true });
      await sizeBtn.waitFor({ state: 'visible' });
      await sizeBtn.click();

      // Click Add to bag
      const addToBagBtn = page.getByRole('button', { name: /Add to bag/i });
      await addToBagBtn.click();

      // Verify cart drawer or bag feedback opens
      const cartDrawer = page.locator('aside, [role="dialog"], div').filter({ hasText: /Bag|Cart|Apex Street/i });
      await expect(cartDrawer.first()).toBeVisible({ timeout: 6000 });
    });
  });
});
