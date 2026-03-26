import path from 'node:path';

import type { GeneratedTestCase } from '../types/contracts.js';
import { ensureDir, writeTextFile } from '../utils/fs.js';

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function exportTestCasesCsv(
  outputDir: string,
  generatedCases: GeneratedTestCase[],
): Promise<string> {
  const rows = [
    [
      'Test Case ID',
      'Requirement ID',
      'Title',
      'Type',
      'Preconditions',
      'Steps',
      'Assertions',
      'Tags',
    ].join(','),
    ...generatedCases.map((testCase) =>
      [
        escapeCsv(testCase.id),
        escapeCsv(testCase.requirementId),
        escapeCsv(testCase.title),
        escapeCsv(testCase.type),
        escapeCsv(testCase.preconditions.join(' | ')),
        escapeCsv(testCase.steps.join(' | ')),
        escapeCsv(testCase.assertions.join(' | ')),
        escapeCsv(testCase.tags.join(' | ')),
      ].join(','),
    ),
  ];

  await ensureDir(outputDir);
  const csvPath = path.join(outputDir, 'test-cases.csv');
  await writeTextFile(csvPath, `${rows.join('\n')}\n`);
  return csvPath;
}
