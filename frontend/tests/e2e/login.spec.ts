import { test, expect } from '@playwright/test';

// Test users with different roles
const testUsers = [
  { role: 'Admin', email: 'admin@test.com', password: '123456', redirectPath: '/dashboard', uniqueElement: 'text=Admin Dashboard' },
  { role: 'Professional', email: 'doctor@test.com', password: '123456', redirectPath: '/dashboard', uniqueElement: 'text=Dashboard' },
  { role: 'Secretary', email: 'secretary@test.com', password: '123456', redirectPath: '/dashboard', uniqueElement: 'text=Secretary Dashboard' },
  { role: 'Patient', email: 'patient@test.com', password: '123456', redirectPath: '/dashboard', uniqueElement: 'text=Dashboard' },
];

test.describe('Login Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });

  for (const user of testUsers) {
    test(`should allow ${user.role} to login and navigate to dashboard`, async ({ page }) => {
      // Fill in credentials
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      // Click login button
      await page.click('button[type="submit"]');

      // Expect to be redirected to the dashboard or specific path
      await page.waitForURL(user.redirectPath);
      await expect(page).toHaveURL(user.redirectPath);

      // Assert unique element for the role is visible
      await expect(page.locator(user.uniqueElement).first()).toBeVisible();

      // Optional: Log out to clean up session for next test (if not handled by test isolation)
      // await page.click('button:has-text("Logout")'); // Assuming a logout button exists
      // await page.waitForURL('/login');
    });
  }

  test('should display error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Expect error message to be visible
    await expect(page.locator('div.v-alert__content').first()).toContainText('Login failed. Please check your credentials.');
    await expect(page).toHaveURL('/login'); // Should remain on login page
  });
});
