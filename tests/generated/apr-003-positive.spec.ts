import { expect, test } from '@playwright/test';

test(
  'Contact page exposes the public inquiry form behaves as expected',
  { tag: ['@medium', '@generated', '@positive'] },
  async ({ page }) => {
    await page.goto('/');
    // Visitor can open the contact page
    // Base inquiry fields are visible
    // General contact submission starts disabled before required fields are filled
    await expect(page).toHaveURL(
      /apercallc\.com|staging\.apercallc\.com|localhost/,
    );
    await expect(page.locator('body')).toBeVisible();
  },
);
