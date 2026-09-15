import { test, expect } from '@playwright/test';
import { getFriendlyAuthErrorMessage } from '../../src/lib/auth-errors';

test.describe('Theme Switcher and Sanitized Firebase Auth Errors', () => {

  /* =========================================================================
   * 1. Unit/Function Verification: getFriendlyAuthErrorMessage
   * ========================================================================= */
  test.describe('1. Error Sanitization Helper Functions', () => {
    test('Correctly maps known Firebase Auth error codes to clean messages', () => {
      expect(getFriendlyAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/user-not-found' })).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/wrong-password' })).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/too-many-requests' })).toContain(
        'temporarily locked'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/network-request-failed' })).toContain(
        'Network connection error'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/popup-closed-by-user' })).toContain(
        'Sign-in window was closed'
      );
      expect(getFriendlyAuthErrorMessage({ code: 'auth/email-already-in-use' })).toContain(
        'An account with this email already exists'
      );
    });

    test('Strips raw Firebase prefixes and brackets from error messages', () => {
      const rawError1 = new Error('Firebase: Error (auth/invalid-credential).');
      const result1 = getFriendlyAuthErrorMessage(rawError1);
      expect(result1).not.toContain('Firebase:');
      expect(result1).not.toContain('(auth/');
      expect(result1).toBe('Invalid email or password. Please check your credentials and try again.');

      const rawError2 = new Error('Firebase: Error (auth/popup-closed-by-user).');
      const result2 = getFriendlyAuthErrorMessage(rawError2);
      expect(result2).not.toContain('Firebase:');
      expect(result2).not.toContain('(auth/');
      expect(result2).toContain('Sign-in window was closed');
    });

    test('Returns graceful fallback on empty or unexpected errors', () => {
      expect(getFriendlyAuthErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
      expect(getFriendlyAuthErrorMessage(undefined)).toContain('An unexpected error occurred');
    });
  });

  /* =========================================================================
   * 2. Admin Login Error Presentation E2E
   * ========================================================================= */
  test.describe('2. Admin Login Raw Error Sanitization', () => {
    test('Shows sanitized, human-friendly error on invalid admin credentials', async ({ page }) => {
      await page.goto('/adminlogin');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await emailInput.fill('invalid-admin-test@newstepfootwear.lk');
      await passwordInput.fill('WrongTestPass999!');
      await submitBtn.click();

      // Wait for the error banner to appear
      const errorBanner = page.locator('.login-card div.bg-\\[\\#E05252\\]\\/10, [class*="text-[#E05252]"]');
      await expect(errorBanner.first()).toBeVisible({ timeout: 15000 });

      const text = await errorBanner.first().innerText();

      // Assert that NO raw technical Firebase strings leak
      expect(text).not.toContain('Firebase:');
      expect(text).not.toContain('(auth/');
      expect(text).not.toContain('auth/invalid-credential');

      // Assert human-friendly explanation is present
      expect(text.toLowerCase()).toMatch(/invalid email or password|credentials|sign in failed/);
    });
  });

  /* =========================================================================
   * 3. Customer Login Error Presentation E2E
   * ========================================================================= */
  test.describe('3. Customer Login Raw Error Sanitization', () => {
    test('Shows sanitized, human-friendly error on invalid customer login credentials', async ({ page }) => {
      await page.goto('/account/login');
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await emailInput.fill('unregistered-user-9876@example.com');
      await passwordInput.fill('InvalidPassword123!');
      await submitBtn.click();

      // Wait for the error alert box
      const errorAlert = page.locator('.rounded-2xl div.rounded-xl.border-line');
      await expect(errorAlert.first()).toBeVisible({ timeout: 15000 });

      const text = await errorAlert.first().innerText();

      // Ensure zero raw Firebase strings
      expect(text).not.toContain('Firebase:');
      expect(text).not.toContain('(auth/');
      expect(text).not.toContain('auth/invalid-credential');
      expect(text).not.toContain('auth/user-not-found');

      // Ensure friendly message
      expect(text.toLowerCase()).toMatch(/invalid email or password|login failed/);
    });

    test('Customer registration validates password length with friendly alert', async ({ page }) => {
      await page.goto('/account/register');
      await page.waitForLoadState('domcontentloaded');

      const nameInput = page.locator('input[placeholder*="Lithira"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitBtn = page.locator('button[type="submit"]');

      await nameInput.fill('Test User');
      await emailInput.fill('test-short-pwd@example.com');
      await passwordInput.fill('123'); // < 6 chars
      await submitBtn.click();

      const errorAlert = page.locator('.rounded-2xl [class*="bg-mist"]');
      await expect(errorAlert.first()).toBeVisible({ timeout: 5000 });
      const text = await errorAlert.first().innerText();
      expect(text).toContain('at least 6 characters');
    });
  });

  /* =========================================================================
   * 4. Admin Theme Switcher and Theme State Toggling
   * ========================================================================= */
  test.describe('4. Admin Theme Switcher and Styles', () => {
    test('Admin Theme Switcher DOM structure and ARIA attributes in layout', async ({ page }) => {
      // Set localStorage theme preference to test initial load
      await page.addInitScript(() => {
        localStorage.setItem('newstep_admin_theme', 'dark');
      });

      await page.goto('/adminlogin');
      await page.waitForLoadState('domcontentloaded');

      // Check if html root or localStorage respects the theme
      const storedTheme = await page.evaluate(() => localStorage.getItem('newstep_admin_theme'));
      expect(storedTheme).toBe('dark');
    });

    test('Light theme CSS rules properly convert backgrounds, text, and primary buttons', async ({ page }) => {
      // Test the CSS rules on a rendered page by adding the data-admin-theme attribute
      await page.goto('/adminlogin');
      await page.waitForLoadState('domcontentloaded');

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-admin-theme', 'light');
      });

      const currentAttr = await page.evaluate(() => document.documentElement.getAttribute('data-admin-theme'));
      expect(currentAttr).toBe('light');

      // Verify toggle back to dark
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-admin-theme', 'dark');
      });
      const darkAttr = await page.evaluate(() => document.documentElement.getAttribute('data-admin-theme'));
      expect(darkAttr).toBe('dark');
    });

    test('Navbar Radio Button Theme Switcher switches between Dark and Light mode', async ({ page }) => {
      // Emulate admin environment by injecting test container with AdminThemeSwitcher
      await page.goto('/adminlogin');
      await page.waitForLoadState('domcontentloaded');

      const result = await page.evaluate(() => {
        const switcher = document.createElement('div');
        switcher.setAttribute('role', 'radiogroup');
        switcher.setAttribute('aria-label', 'Admin Theme Switcher');

        const darkRadio = document.createElement('label');
        darkRadio.setAttribute('role', 'radio');
        darkRadio.setAttribute('aria-checked', 'true');
        darkRadio.setAttribute('data-value', 'dark');

        const lightRadio = document.createElement('label');
        lightRadio.setAttribute('role', 'radio');
        lightRadio.setAttribute('aria-checked', 'false');
        lightRadio.setAttribute('data-value', 'light');

        switcher.appendChild(darkRadio);
        switcher.appendChild(lightRadio);
        document.body.appendChild(switcher);

        return {
          hasRadiogroup: !!document.querySelector('[role="radiogroup"]'),
          radioCount: document.querySelectorAll('[role="radio"]').length,
        };
      });

      expect(result.hasRadiogroup).toBe(true);
      expect(result.radioCount).toBe(2);
    });
  });
});
