import { test, expect } from '@playwright/test';

test.describe('API Route Security, Integrity & Public Endpoint Tests', () => {

  test.describe('1. Public Storefront & Customer API Endpoints', () => {
    test('GET /api/storefront/products returns published product catalogue', async ({ request }) => {
      const res = await request.get('/api/storefront/products');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('GET /api/storefront/products?category=mens filters correctly', async ({ request }) => {
      const res = await request.get('/api/storefront/products?category=mens');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      if (json.data.length > 0) {
        expect(json.data[0].category).toBe('mens');
      }
    });

    test('GET /api/storefront/products?slug=velocity-runner-white returns single shoe', async ({ request }) => {
      const res = await request.get('/api/storefront/products?slug=velocity-runner-white');
      // Either found (200) or not seeded in DB (404)
      expect([200, 404]).toContain(res.status());
      const json = await res.json();
      if (res.status() === 200) {
        expect(json.success).toBe(true);
        expect(json.data.slug).toBe('velocity-runner-white');
      }
    });

    test('GET /api/reviews requires productId parameter', async ({ request }) => {
      const res = await request.get('/api/reviews');
      expect(res.status()).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/productId/i);
    });

    test('GET /api/reviews?productId=p-001 returns approved reviews array', async ({ request }) => {
      const res = await request.get('/api/reviews?productId=p-001');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
    });

    test('GET /api/reviews/stats?productId=p-001 returns rating aggregates', async ({ request }) => {
      const res = await request.get('/api/reviews/stats?productId=p-001');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toHaveProperty('averageRating');
      expect(json.data).toHaveProperty('totalReviews');
      expect(json.data).toHaveProperty('ratingDistribution');
    });

    test('POST /api/discounts/validate handles empty or invalid coupon payload', async ({ request }) => {
      const res = await request.post('/api/discounts/validate', {
        data: { code: 'NONEXISTENT_PROMO_CODE', subtotal: 15000 },
      });
      // Should return 400, 404 or success: false
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('POST /api/messages requires authentication or validates contact inquiry fields', async ({ request }) => {
      const res = await request.post('/api/messages', {
        data: { name: '', email: 'invalid-email', message: '' },
      });
      // Returns 401 (unauthorized) or validation error (400, 422)
      expect([400, 401, 422]).toContain(res.status());
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('SEO endpoints /robots.txt and /sitemap.xml return 200 with appropriate content types', async ({ request }) => {
      const robotsRes = await request.get('/robots.txt');
      expect(robotsRes.status()).toBe(200);
      const robotsText = await robotsRes.text();
      expect(robotsText).toMatch(/User-agent/i);

      const sitemapRes = await request.get('/sitemap.xml');
      expect(sitemapRes.status()).toBe(200);
    });
  });

  test.describe('2. Protected Admin & User API Endpoints (401 Unauthorized Enforcement)', () => {
    test('GET /api/dashboard blocks unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/dashboard');
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('GET and POST /api/products require admin authorization', async ({ request }) => {
      const getRes = await request.get('/api/products');
      expect([200, 401]).toContain(getRes.status());

      const postRes = await request.post('/api/products', { data: { name: 'Test Shoe' } });
      expect(postRes.status()).toBe(401);
    });

    test('GET /api/orders rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/orders');
      expect(res.status()).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    test('GET /api/customers rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/customers');
      expect(res.status()).toBe(401);
    });

    test('GET /api/inventory rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/inventory');
      expect(res.status()).toBe(401);
    });

    test('GET /api/categories rejects unauthenticated caller or returns list', async ({ request }) => {
      const res = await request.get('/api/categories');
      expect([200, 401]).toContain(res.status());
    });

    test('GET /api/discounts rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/discounts');
      expect(res.status()).toBe(401);
    });

    test('GET /api/reviews?admin=true rejects unauthenticated admin review listing', async ({ request }) => {
      const res = await request.get('/api/reviews?admin=true');
      expect(res.status()).toBe(401);
    });

    test('POST /api/reviews rejects unauthenticated review submissions', async ({ request }) => {
      const res = await request.post('/api/reviews', {
        data: { productId: 'p-001', rating: 5, comment: 'Great fit shoe' },
      });
      expect(res.status()).toBe(401);
    });

    test('GET /api/reports rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/reports');
      expect(res.status()).toBe(401);
    });

    test('GET /api/messages rejects unauthenticated admin message listing', async ({ request }) => {
      const res = await request.get('/api/messages');
      expect(res.status()).toBe(401);
    });

    test('GET /api/roles rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/roles');
      expect(res.status()).toBe(401);
    });

    test('GET /api/users rejects unauthenticated caller', async ({ request }) => {
      const res = await request.get('/api/users');
      expect(res.status()).toBe(401);
    });

    test('GET /api/settings rejects unauthenticated caller or enforces role access', async ({ request }) => {
      const res = await request.get('/api/settings');
      expect([200, 401]).toContain(res.status());
    });

    test('POST /api/upload rejects unauthenticated file uploads', async ({ request }) => {
      const res = await request.post('/api/upload', { data: {} });
      expect(res.status()).toBe(401);
    });

    test('GET /api/account/orders rejects unauthenticated or parameter-less customer requests', async ({ request }) => {
      const res = await request.get('/api/account/orders');
      expect([400, 401]).toContain(res.status());
    });
  });
});
