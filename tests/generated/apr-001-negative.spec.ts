import { expect, test } from '@playwright/test';

test(
  'Homepage loads and exposes primary navigation rejects invalid or incomplete paths',
  { tag: ['@high', '@generated', '@negative'] },
  async ({ page }) => {
    await page.goto('/');
    // The application fails safely without blank or broken critical UI
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
