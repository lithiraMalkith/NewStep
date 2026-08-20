import { test, expect } from '@playwright/test';

test.describe('API Route Security & Endpoint Tests', () => {

  test('GET /api/dashboard returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/dashboard');
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('GET /api/products returns 401 or list based on auth requirements', async ({ request }) => {
    const res = await request.get('/api/products');
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/orders returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('GET /api/customers returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/customers');
    expect(res.status()).toBe(401);
  });

  test('GET /api/inventory returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/inventory');
    expect(res.status()).toBe(401);
  });

  test('GET /api/categories returns status 200 or 401', async ({ request }) => {
    const res = await request.get('/api/categories');
    expect([200, 401]).toContain(res.status());
  });

  test('GET /api/messages returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/messages');
    expect(res.status()).toBe(401);
  });

  test('GET /api/roles returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/roles');
    expect(res.status()).toBe(401);
  });

  test('GET /api/users returns 401 when unauthorized', async ({ request }) => {
    const res = await request.get('/api/users');
    expect(res.status()).toBe(401);
  });

  test('GET /api/settings returns status 200 or 401', async ({ request }) => {
    const res = await request.get('/api/settings');
    expect([200, 401]).toContain(res.status());
  });
});
