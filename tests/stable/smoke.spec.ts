import { expect, test } from '@playwright/test';

test('homepage returns a visible body', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
