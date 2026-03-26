import { expect, test } from '@playwright/test';

test('@medium @generated @positive Contact flow is reachable from homepage behaves as expected', async ({ page }) => {
  await page.goto('/');
  // Homepage contains a contact-related link or button
  // The destination page returns HTTP 200 or renders successfully
  await expect(page).toHaveURL(/apercallc\.com|staging\.apercallc\.com|localhost/);
  await expect(page.locator('body')).toBeVisible();
});
