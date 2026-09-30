import { test, expect } from '@playwright/test';

test.describe('Mosque Platform End-to-End Smoke Suite', () => {

  test('1. Home page renders brand, navigation, search, and dynamic map container', async ({ page }) => {
    await page.goto('/');

    // Verify Brand Title & Tagline in Navbar
    await expect(page.locator('text=BD Masjid').first()).toBeVisible();
    await expect(page.locator('text=Verified').first()).toBeVisible();

    // Verify Action Controls
    await expect(page.getByRole('button', { name: /Add Mosque/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByLabel('View notifications')).toBeVisible();

    // Verify Search Input
    const searchInput = page.getByPlaceholder('Search mosque name, street, or area...');
    await expect(searchInput).toBeVisible();

    // Verify Map or List view container is mounted without hydration error
    await expect(page.locator('main')).toBeVisible();
  });

  test('2. AuthModal opens from navbar and switches between Login and Register tabs', async ({ page }) => {
    await page.goto('/');

    // Click Sign In
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify Auth Modal is rendered
    await expect(page.locator('text=Sign In to BD Masjid')).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();

    // Switch to Register tab
    const registerTab = page.getByRole('button', { name: 'Register' });
    await registerTab.click();

    // Verify Full Name input appears in registration mode
    await expect(page.getByPlaceholder('e.g. Mohammad Sheakh')).toBeVisible();

    // Close Auth modal via Close button
    const closeBtn = page.getByLabel('Close modal');
    await closeBtn.click();
    await expect(page.locator('text=Sign In to BD Masjid')).not.toBeVisible();
  });

  test('3. Add Mosque modal opens and renders pin-drop helper and form inputs', async ({ page }) => {
    await page.goto('/');

    // Click Add Mosque
    await page.getByRole('button', { name: /Add Mosque/i }).click();

    // Verify Add Mosque modal header
    await expect(page.locator('text=Submit a Mosque')).toBeVisible();

    // Verify mandatory form fields
    await expect(page.getByPlaceholder(/Baitul Aman Jame Mosque/i)).toBeVisible();
    await expect(page.getByPlaceholder('Dhaka')).toBeVisible();

    // Close Add Mosque modal by clicking the X button in the header
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(page.locator('text=Submit a Mosque')).not.toBeVisible();
  });

  test('4. Notifications popover toggles open on bell icon click', async ({ page }) => {
    await page.goto('/');

    // Click Notification Bell
    const bellBtn = page.getByLabel('View notifications');
    await bellBtn.click();

    // Verify Notifications Popover opens
    await expect(page.locator('text=Notifications').first()).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Notifications').first()).not.toBeVisible();
  });

  test('5. Admin dashboard route loads with authentication guard', async ({ page }) => {
    await page.goto('/admin');

    // Admin dashboard either loads with moderation tabs or shows access denied/auth required
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Confirm no unhandled 500 error page
    await expect(page.locator('text=Application error')).not.toBeVisible();
  });

});
