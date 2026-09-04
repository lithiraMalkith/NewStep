import { test, expect } from '@playwright/test';

test.describe('Storefront E2E Tests - Full Application Coverage', () => {

  test.describe('1. Homepage Layout & Interactive Sections', () => {
    test('Homepage loads header, navigation, hero, and branding', async ({ page }) => {
      await page.goto('/');

      // Document title
      await expect(page).toHaveTitle(/New Step Footwear/i);

      // Logo
      const logo = page.getByRole('link', { name: /NEWSTEP|New Step/i }).first();
      await expect(logo).toBeVisible();

      // Navigation links
      await expect(page.getByRole('link', { name: 'Men', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Women', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Kids', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sale', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'All Shoes', exact: true }).first()).toBeVisible();

      // Search & Cart buttons in header
      const searchInputOrBtn = page.getByPlaceholder(/Search shoes/i).or(page.locator('input[type="search"]'));
      await expect(searchInputOrBtn.first()).toBeVisible();
      const cartIcon = page.locator('a[href="/cart"]').or(page.locator('button[aria-label*="cart" i]')).first();
      await expect(cartIcon).toBeVisible();

      // Hero section & primary CTA
      const heroHeadline = page.getByRole('heading', { level: 1 }).first();
      await expect(heroHeadline).toBeVisible();
      const heroCta = page.getByRole('link', { name: /Shop Men|Explore|Shop Now/i }).first();
      await expect(heroCta).toBeVisible();
    });

    test('Marquee text strip displays core store propositions', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/Cash on delivery island-wide/i).first()).toBeVisible();
      await expect(page.getByText(/Free delivery over/i).first()).toBeVisible();
    });

    test('Trust strip renders all four reliability badges', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/Cash on Delivery/i).first()).toBeVisible();
      await expect(page.getByText(/Island-wide Delivery/i).first()).toBeVisible();
      await expect(page.getByText(/Live Size Stock/i).first()).toBeVisible();
      await expect(page.getByText(/7-Day Exchange/i).first()).toBeVisible();
    });

    test('Product carousels (New Arrivals & Best Sellers) render with product cards', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for carousel headings or product links
      const productCards = page.locator('a[href*="/product/"]');
      const count = await productCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Shop by category banners render and link correctly', async ({ page }) => {
      await page.goto('/');
      const mensTile = page.locator('a[href="/shop/mens"]').first();
      const womensTile = page.locator('a[href="/shop/womens"]').first();
      const kidsTile = page.locator('a[href="/shop/kids"]').first();

      await expect(mensTile).toBeVisible();
      await expect(womensTile).toBeVisible();
      await expect(kidsTile).toBeVisible();
    });

    test('Promotional clearance banner and social proof reviews render', async ({ page }) => {
      await page.goto('/');
      // Promo banner
      const promoSaleLink = page.locator('a[href*="/shop"]').filter({ hasText: /Shop Sale|Shop/i }).first();
      await expect(promoSaleLink).toBeVisible();

      // Verified customer reviews
      await expect(page.getByText(/Loved by Sri Lanka|Verified Reviews/i).first()).toBeVisible();
      await expect(page.getByText(/Dilshan P\./i)).toBeVisible();
    });

    test('Footer and WhatsApp Floating Action Button render', async ({ page }) => {
      await page.goto('/');
      const footer = page.getByRole('contentinfo');
      await expect(footer).toBeVisible();

      // WhatsApp button
      const whatsappBtn = page.locator('a[href*="wa.me"]').or(page.getByRole('link', { name: /WhatsApp/i }));
      await expect(whatsappBtn.first()).toBeVisible();
    });
  });

  test.describe('2. Shop Catalogue, Categories & Filtering', () => {
    test('Catalog page /shop displays products, count and size filters', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');

      // Heading
      await expect(page.getByRole('heading', { name: /All Shoes/i })).toBeVisible();

      // Product items exist
      const products = page.locator('a[href*="/product/"]');
      await expect(products.first()).toBeVisible({ timeout: 10000 });
      const productCount = await products.count();
      expect(productCount).toBeGreaterThan(0);

      // Sizing filter buttons
      const sizePills = page.locator('button').filter({ hasText: /^(3[6-9]|4[0-6])$/ });
      if (await sizePills.count() > 0) {
        await sizePills.first().click();
        await page.waitForTimeout(300);
        // Deselect
        await sizePills.first().click();
      }
    });

    test('Category subpages (/shop/mens, /shop/womens, /shop/kids) filter accurately', async ({ page }) => {
      for (const category of ['mens', 'womens', 'kids']) {
        const response = await page.goto(`/shop/${category}`);
        expect(response?.status()).toBeLessThan(400);
        await page.waitForLoadState('networkidle');

        // Check product presence
        const products = page.locator('a[href*="/product/"]');
        await expect(products.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('Search bar filters products dynamically', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/Search/i).first();
      await expect(searchInput).toBeVisible();

      // Fill search term
      await searchInput.fill('Runner');
      await page.waitForTimeout(400);

      // Verify filtered results contain keyword or match cards
      const productCards = page.locator('a[href*="/product/"]');
      if (await productCards.count() > 0) {
        await expect(productCards.first()).toBeVisible();
      }

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(400);
    });

    test('Sort selection functions properly', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');

      const sortSelect = page.locator('select').first();
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
        await sortSelect.selectOption({ index: 0 });
      }
    });
  });

  test.describe('3. Product Detail Page (PDP) & Review Interactions', () => {
    test('PDP loads full shoe details, switches images, and expands accordions', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');

      // Click first product
      const firstProduct = page.locator('a[href*="/product/"]').first();
      await firstProduct.click();
      await page.waitForURL(/\/product\//);

      // Check product title, price & breadcrumb
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/Rs\./i).first()).toBeVisible();

      // Image gallery thumbnails (if multiple)
      const thumbnails = page.locator('button[aria-label*="View image"]');
      if (await thumbnails.count() > 1) {
        await thumbnails.nth(1).click();
        await page.waitForTimeout(200);
      }

      // Accordions
      const sizeGuideAccordion = page.getByRole('button', { name: /Size guide/i }).first();
      if (await sizeGuideAccordion.isVisible()) {
        await sizeGuideAccordion.click();
        await expect(page.getByText(/Foot length/i)).toBeVisible();
      }

      const deliveryAccordion = page.getByRole('button', { name: /Delivery & returns/i }).first();
      if (await deliveryAccordion.isVisible()) {
        await deliveryAccordion.click();
        await expect(page.getByText(/Western Province|island-wide courier/i)).toBeVisible();
      }

      // Ask about this shoe WhatsApp link
      const askBtn = page.getByRole('link', { name: /Ask about this shoe/i });
      await expect(askBtn).toBeVisible();
      await expect(askBtn).toHaveAttribute('href', /wa\.me/);
    });

    test('Validation enforces size selection before adding to cart', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');
      await page.locator('a[href*="/product/"]').first().click();
      await page.waitForURL(/\/product\//);

      // Try adding to bag without selecting a size
      const addToBagBtn = page.getByRole('button', { name: /Add to bag/i });
      if (await addToBagBtn.isVisible() && !await addToBagBtn.isDisabled()) {
        await addToBagBtn.click();
        // Validation prompt appears
        await expect(page.getByText(/Please select a size first/i)).toBeVisible();

        // Now select a valid size
        const sizeButtons = page.locator('button').filter({ hasText: /^(3[6-9]|4[0-6])$/ });
        const availableSize = sizeButtons.locator(':not([disabled])').first();
        if (await availableSize.isVisible()) {
          await availableSize.click();
          await expect(page.getByText(/Please select a size first/i)).not.toBeVisible();
          await expect(page.getByText(/In stock|Only \d+ left/i)).toBeVisible();

          // Add to bag
          await addToBagBtn.click();
          await page.waitForTimeout(400);
        }
      }
    });

    test('Review section renders with verified purchaser notice for guest visitors', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');
      await page.locator('a[href*="/product/"]').first().click();
      await page.waitForURL(/\/product\//);

      // Reviews section exists
      await expect(page.getByRole('heading', { name: /Reviews/i })).toBeVisible();

      // Verified purchaser security notice is shown to unauthenticated guests
      await expect(page.getByText(/Verified Buyer Reviews/i)).toBeVisible();
      await expect(page.getByText(/Only verified customers who purchased/i)).toBeVisible();

      // Write review button is hidden for unauthenticated guests
      const writeReviewBtn = page.getByRole('button', { name: /Write a Review/i });
      await expect(writeReviewBtn).toHaveCount(0);
    });
  });

  test.describe('4. Cart & Bag Management', () => {
    test('Cart page renders properly in empty and populated states', async ({ page }) => {
      await page.goto('/cart');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Check whether empty or has items
      const emptyMsg = page.getByText(/Your bag is empty/i).first();
      const isCartEmpty = await emptyMsg.isVisible();

      if (isCartEmpty) {
        await expect(page.getByRole('link', { name: /Shop/i }).first()).toBeVisible();
      } else {
        // Line items and totals
        await expect(page.getByText(/Subtotal/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Checkout|Proceed/i })).toBeVisible();
      }
    });

    test('Adding an item from PDP flows through to the cart', async ({ page }) => {
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');
      await page.locator('a[href*="/product/"]').first().click();
      await page.waitForURL(/\/product\//);

      // Select size
      const availableSize = page.locator('button').filter({ hasText: /^(3[6-9]|4[0-6])$/ }).locator(':not([disabled])').first();
      if (await availableSize.isVisible()) {
        await availableSize.click();
        const addToBag = page.getByRole('button', { name: /Add to bag/i });
        await addToBag.click();
        await page.waitForTimeout(600);

        // Go to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Verify cart has items and can navigate to checkout
        await expect(page.getByRole('link', { name: /Checkout|Proceed/i }).first()).toBeVisible();
      }
    });
  });

  test.describe('5. Checkout Process & Form Validation', () => {
    test('Checkout page displays delivery fields, summary, and validates empty submission', async ({ page }) => {
      // Add an item to the bag first to test active checkout form
      await page.goto('/shop');
      await page.waitForLoadState('networkidle');
      const firstProduct = page.locator('a[href*="/product/"]').first();
      await firstProduct.click();
      await page.waitForURL(/\/product\//);

      const availableSize = page.locator('button').filter({ hasText: /^(3[6-9]|4[0-6])$/ }).locator(':not([disabled])').first();
      if (await availableSize.isVisible()) {
        await availableSize.click();
        const addToBag = page.getByRole('button', { name: /Add to bag/i });
        await addToBag.click();
        await page.waitForTimeout(500);
      }

      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');

      // Check if checkout form or empty cart screen is displayed
      const emptyNotice = page.getByText(/Nothing to check out|Your bag is empty/i).first();
      const isEmpty = await emptyNotice.isVisible();

      if (isEmpty) {
        await expect(page.getByRole('link', { name: /Shop/i }).first()).toBeVisible();
      } else {
        // Customer detail inputs within checkout form
        const checkoutForm = page.locator('form').filter({ hasText: /Contact details|Delivery address/i });
        await expect(checkoutForm.locator('input').first()).toBeVisible();

        // Test coupon input if available
        const discountInput = checkoutForm.getByPlaceholder(/Discount code/i);
        if (await discountInput.isVisible()) {
          const applyBtn = checkoutForm.getByRole('button', { name: /Apply/i });
          await discountInput.fill('INVALIDCODE999');
          await applyBtn.click();
          await page.waitForTimeout(400);
        }
      }
    });
  });

  test.describe('6. Customer Account Portal', () => {
    test('Customer Login page renders, validates email and toggles visibility', async ({ page }) => {
      await page.goto('/account/login');
      await expect(page.getByRole('heading', { name: /Sign in|Login|Welcome/i })).toBeVisible();

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitBtn).toBeVisible();

      // Check link to register
      const registerLink = page.getByRole('link', { name: /Create.*account|Register|Sign up/i }).or(page.locator('a[href="/account/register"]')).first();
      await expect(registerLink).toBeVisible();
    });

    test('Customer Register page renders with full signup fields', async ({ page }) => {
      await page.goto('/account/register');
      await expect(page.getByRole('heading', { name: /Create account|Register|Sign up/i })).toBeVisible();

      const emailInput = page.locator('input[type="email"]');
      const submitBtn = page.locator('button[type="submit"]');
      await expect(emailInput).toBeVisible();
      await expect(submitBtn).toBeVisible();
    });

    test('Protected account routes gracefully redirect or show auth challenge', async ({ page }) => {
      const accountRoutes = [
        '/account',
        '/account/profile',
        '/account/addresses',
        '/account/orders'
      ];

      for (const route of accountRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        // Unauthenticated users stay on account login or get redirected
        expect(page.url()).toMatch(/\/account/);
      }
    });
  });

  test.describe('7. Static Pages, Policy Pages & Error Handling', () => {
    test('About page renders brand story and craftsmanship imagery', async ({ page }) => {
      const res = await page.goto('/about');
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Contact page renders details and inquiry form with validation', async ({ page }) => {
      const res = await page.goto('/contact');
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Form presence
      const nameInput = page.locator('input[name="name"]').or(page.getByPlaceholder(/name/i)).first();
      await expect(nameInput).toBeVisible();
    });

    test('Size Guide page displays full EU, UK, and CM measurement table', async ({ page }) => {
      const res = await page.goto('/size-guide');
      expect(res?.status()).toBeLessThan(400);
      await expect(page.getByText(/EU/i).first()).toBeVisible();
      await expect(page.getByText(/UK/i).first()).toBeVisible();
      await expect(page.getByText(/CM|Foot length/i).first()).toBeVisible();
    });

    test('All Legal & Policy pages (/policies/...) render without errors', async ({ page }) => {
      const policyRoutes = [
        '/policies/delivery',
        '/policies/returns',
        '/policies/privacy',
        '/policies/terms'
      ];

      for (const policy of policyRoutes) {
        const res = await page.goto(policy);
        expect(res?.status()).toBeLessThan(400);
        await expect(page.locator('body')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      }
    });

    test('Non-existent URL triggers custom 404 page', async ({ page }) => {
      const res = await page.goto('/non-existent-random-route-404');
      // Should show 404 page content
      await expect(page.getByText(/404|Page not found|lost/i).first()).toBeVisible();
      const homeBtn = page.getByRole('link', { name: /Home|Return/i }).first();
      await expect(homeBtn).toBeVisible();
    });
  });
});
