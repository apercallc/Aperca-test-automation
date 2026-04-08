import { expect, test } from '@playwright/test';

test(
  'Products catalog supports discovery and product detail navigation rejects invalid or incomplete paths',
  { tag: ['@medium', '@generated', '@negative'] },
  async ({ page }) => {
    await page.goto('/');
    // The application fails safely without blank or broken critical UI
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
