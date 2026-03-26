import { expect, test } from '@playwright/test';

import { expectMainNavigation, gotoPublicPage } from '../support/site.js';

test.describe('Product discovery', () => {
  test('products page supports search and product detail navigation', async ({ page }) => {
    await gotoPublicPage(page, '/products');
    await expectMainNavigation(page);

    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search products' }).fill('FastCarb');
    await expect(page.getByRole('heading', { name: 'FastCarb', exact: true })).toBeVisible();

    await page.getByRole('link', { name: /FastCarb/ }).first().click();
    await expect(page).toHaveURL(/\/products\/fastcarb$/);

    await expect(page.getByRole('heading', { name: 'FastCarb', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Visit Website' })).toHaveAttribute(
      'href',
      /fastcarb\.apercallc\.com/,
    );
    await expect(page.getByRole('heading', { name: 'About FastCarb' })).toBeVisible();
  });
});
