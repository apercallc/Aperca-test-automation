import { expect, test } from '@playwright/test';

import { expectMainNavigation, gotoPublicPage } from '../support/site.js';

test.describe('Contact flow readiness', () => {
  test('contact page exposes the base inquiry form without submitting data', async ({ page }) => {
    await gotoPublicPage(page, '/contact');
    await expectMainNavigation(page);

    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'What do you need help with?' }),
    ).toHaveValue('general');
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeDisabled();
  });
});
