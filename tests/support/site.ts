import { expect, type Locator, type Page } from '@playwright/test';

export async function gotoPublicPage(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
}

export function mainNav(page: Page): Locator {
  return page.getByRole('navigation', { name: 'Main navigation' });
}

export async function expectMainNavigation(page: Page): Promise<void> {
  const nav = mainNav(page);
  await expect(nav.getByRole('link', { name: 'Products' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Blog' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible();
}
