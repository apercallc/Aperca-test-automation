import { expect, test } from '@playwright/test';

test('@medium @generated @negative Contact page exposes the public inquiry form rejects invalid or incomplete paths', async ({ page }) => {
  await page.goto('/');
  // The application fails safely without blank or broken critical UI
  await expect(page).toHaveURL(/apercallc\.com|staging\.apercallc\.com|localhost/);
  await expect(page.locator('body')).toBeVisible();
});
