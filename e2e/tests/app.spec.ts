import { test, expect } from '@playwright/test';

test.describe('Rage UI End-to-End', () => {
  test('has title and basic UI elements', async ({ page }) => {
    // We assume the frontend is running on localhost:5173
    try {
      await page.goto('/');

      // Expect a title "to contain" a substring.
      await expect(page).toHaveTitle(/Rage UI/);

      // We expect the app to load and show "Loading..." initially
      // Or show the sidebar
      const mainApp = page.locator('.app');
      await expect(mainApp).toBeVisible({ timeout: 5000 });
      
    } catch (e) {
      console.log('Ensure the frontend server is running on port 5173 before running this E2E test.');
      throw e;
    }
  });
});
