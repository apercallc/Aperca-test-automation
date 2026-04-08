import { expect, test } from '@playwright/test';

import { expectMainNavigation, gotoPublicPage } from '../support/site.js';

test.describe('Homepage navigation', () => {
  test('homepage exposes core messaging and products CTA', async ({ page }) => {
    await gotoPublicPage(page, '/');
    await expectMainNavigation(page);

    await expect(
      page.getByRole('heading', { name: 'Less noise. More of what matters.' }),
    ).toBeVisible();
    await expect(
      page.getByText('Trusted by 12,000+ users worldwide'),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Explore Our Products' }),
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/products$/),
      page.getByRole('link', { name: 'Explore Our Products' }).click(),
    ]);
    await expect(page).toHaveURL(/\/products$/);
    await expect(
      page.getByRole('heading', { name: 'Products', exact: true }),
    ).toBeVisible();
  });
});
