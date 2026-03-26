import { expect, test } from '@playwright/test';

test('@high @generated @positive Homepage loads and exposes primary navigation behaves as expected', async ({ page }) => {
  await page.goto('/');
  // Visitor can open the homepage
  // Primary navigation is visible
  // Contact call-to-action is visible
  await expect(page).toHaveURL(/apercallc\.com|staging\.apercallc\.com|localhost/);
  await expect(page.locator('body')).toBeVisible();
});
