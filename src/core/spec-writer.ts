import path from 'node:path';

import type { GeneratedTestCase } from '../types/contracts.js';
import { ensureDir, writeTextFile } from '../utils/fs.js';

function escapeText(value: string): string {
  return value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildSpec(caseItem: GeneratedTestCase): string {
  const tagTitle = caseItem.tags.map((tag) => `@${tag}`).join(' ');
  const assertionComments = caseItem.assertions
    .map((assertion) => `  // ${escapeText(assertion)}`)
    .join('\n');

  return `import { expect, test } from '@playwright/test';

test('${escapeText(tagTitle)} ${escapeText(caseItem.title)}', async ({ page }) => {
  await page.goto('/');
${assertionComments}
  await expect(page).toHaveURL(/apercallc\\.com|staging\\.apercallc\\.com|localhost/);
  await expect(page.locator('body')).toBeVisible();
});
`;
}

export async function writeGeneratedSpecs(
  projectRoot: string,
  cases: GeneratedTestCase[],
): Promise<string[]> {
  const outputDir = path.join(projectRoot, 'tests/generated');
  await ensureDir(outputDir);

  const specPaths: string[] = [];

  for (const caseItem of cases) {
    const fileName = `${caseItem.id}.spec.ts`;
    const filePath = path.join(outputDir, fileName);
    await writeTextFile(filePath, buildSpec(caseItem));
    specPaths.push(filePath);
  }

  return specPaths;
}
