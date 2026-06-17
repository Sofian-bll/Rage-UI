import { test } from '@playwright/test';

test('capture landing page screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto('https://sofian-bll.github.io/Rage-UI/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: '../docs/assets/screenshot.png',
    fullPage: true,
  });
});
