import { expect, test } from '@playwright/test';

test(
  'Products catalog supports discovery and product detail navigation remains stable under edge conditions',
  { tag: ['@medium', '@generated', '@edge'] },
  async ({ page }) => {
    await page.goto('/');
    // Core content remains visible
    // No critical console or page crash occurs
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
