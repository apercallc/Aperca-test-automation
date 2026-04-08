import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

import { sanitizeForPersistence } from './redaction.js';
import {
  copyPath,
  ensureDir,
  pathExists,
  readJsonFile,
  writeJsonFile,
  writeTextFile,
} from '../utils/fs.js';

export async function archiveLatestReport(
  outputDir: string,
  projectRoot: string,
  runId: string,
): Promise<string> {
  const latestDir = outputDir;
  const historyDir = path.join(projectRoot, 'reports/history', runId);
  await ensureDir(historyDir);

  const fileNames = [
    'summary.json',
    'generated-cases.json',
    'requirements.json',
    'defects.json',
    'playwright-report.json',
    'doctor.json',
    'security-posture.json',
    'test-cases.csv',
  ];

  for (const fileName of fileNames) {
    const source = path.join(latestDir, fileName);
    try {
      if (fileName.endsWith('.csv')) {
        const content = await readFile(source, 'utf8');
        await writeTextFile(
          path.join(historyDir, fileName),
          sanitizeForPersistence(content),
        );
      } else {
        const content = await readJsonFile<unknown>(source);
        await writeJsonFile(
          path.join(historyDir, fileName),
          sanitizeForPersistence(content),
        );
      }
    } catch {
      // Missing artifacts are tolerated so plan mode can archive partial outputs.
    }
  }

  const evidenceDir = path.join(latestDir, 'evidence');
  if (await pathExists(evidenceDir)) {
    const archivedEvidenceDir = path.join(historyDir, 'evidence');
    await ensureDir(archivedEvidenceDir);
    const evidenceFiles = await readdir(evidenceDir);
    for (const fileName of evidenceFiles) {
      await copyPath(
        path.join(evidenceDir, fileName),
        path.join(archivedEvidenceDir, fileName),
      );
    }
  }

  return historyDir;
}
