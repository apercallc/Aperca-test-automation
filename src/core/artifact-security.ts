import path from 'node:path';

import { sanitizeForPersistence } from './redaction.js';
import { copyPath, pathExists, readJsonFile, removePath, writeJsonFile } from '../utils/fs.js';

interface PlaywrightAttachment {
  name?: string;
  contentType?: string;
  path?: string;
}

interface PlaywrightResultNode {
  attachments?: PlaywrightAttachment[];
  results?: PlaywrightResultNode[];
  tests?: PlaywrightResultNode[];
  specs?: PlaywrightResultNode[];
  suites?: PlaywrightResultNode[];
}

export async function secureArtifacts(
  projectRoot: string,
  outputDir: string,
  options: {
    redactSensitiveData: boolean;
    persistRawArtifacts: boolean;
  },
): Promise<string[]> {
  const jsonReportPath = path.join(outputDir, 'playwright-report.json');
  const preservedEvidence: string[] = [];

  if (options.redactSensitiveData && (await pathExists(jsonReportPath))) {
    const report = await readJsonFile<PlaywrightResultNode>(jsonReportPath);
    preservedEvidence.push(...(await preserveFailureEvidence(projectRoot, outputDir, report)));
    await writeJsonFile(jsonReportPath, sanitizeForPersistence(report));
  }

  if (!options.persistRawArtifacts) {
    await removePath(path.join(projectRoot, 'playwright-report'));
    await removePath(path.join(projectRoot, 'test-results'));
  }

  return preservedEvidence;
}

async function preserveFailureEvidence(
  projectRoot: string,
  outputDir: string,
  report: PlaywrightResultNode,
): Promise<string[]> {
  const attachments = collectAttachments(report);
  const evidenceDir = path.join(outputDir, 'evidence');
  const kept: string[] = [];

  for (const attachment of attachments) {
    if (!attachment.path || !attachment.contentType?.startsWith('image/')) {
      continue;
    }

    const sourcePath = path.resolve(projectRoot, attachment.path);
    if (!(await pathExists(sourcePath))) {
      continue;
    }

    const targetPath = path.join(evidenceDir, path.basename(sourcePath));
    await copyPath(sourcePath, targetPath);
    kept.push(path.relative(projectRoot, targetPath));
  }

  return kept;
}

function collectAttachments(node: PlaywrightResultNode): PlaywrightAttachment[] {
  const attachments = [...(node.attachments ?? [])];
  for (const childCollection of [node.results, node.tests, node.specs, node.suites]) {
    for (const child of childCollection ?? []) {
      attachments.push(...collectAttachments(child));
    }
  }

  return attachments;
}
