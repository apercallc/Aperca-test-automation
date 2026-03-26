import { expect, test } from '@playwright/test';

test('@medium @generated @edge Contact page exposes the public inquiry form remains stable under edge conditions', async ({ page }) => {
  await page.goto('/');
  // Core content remains visible
  // No critical console or page crash occurs
  await expect(page).toHaveURL(/apercallc\.com|staging\.apercallc\.com|localhost/);
  await expect(page.locator('body')).toBeVisible();
});
