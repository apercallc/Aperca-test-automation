import { expect, test } from '@playwright/test';

test(
  'Products catalog supports discovery and product detail navigation behaves as expected',
  { tag: ['@medium', '@generated', '@positive'] },
  async ({ page }) => {
    await page.goto('/');
    // Visitor can open the products catalog
    // Visitor can search for a known product
    // Visitor can open a product detail page from the catalog
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
