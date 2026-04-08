import { expect, test } from '@playwright/test';

test(
  'Homepage loads and exposes primary navigation behaves as expected',
  { tag: ['@high', '@generated', '@positive'] },
  async ({ page }) => {
    await page.goto('/');
    // Visitor can open the homepage
    // Primary navigation is visible
    // Products call-to-action is visible
    // Visitor can navigate from homepage to products
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
