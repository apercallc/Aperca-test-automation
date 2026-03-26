import path from 'node:path';

import type {
  DefectDraft,
  GeneratedTestCase,
  Requirement,
  SecurityPosture,
  WorkflowSummary,
} from '../types/contracts.js';
import { sanitizeForPersistence } from './redaction.js';
import { writeJsonFile } from '../utils/fs.js';

export async function writeWorkflowArtifacts(
  outputDir: string,
  summary: WorkflowSummary,
  generatedCases: GeneratedTestCase[],
  requirements: Requirement[],
  securityPosture: SecurityPosture,
): Promise<void> {
  await writeJsonFile(path.join(outputDir, 'summary.json'), sanitizeForPersistence(summary));
  await writeJsonFile(
    path.join(outputDir, 'generated-cases.json'),
    sanitizeForPersistence(generatedCases),
  );
  await writeJsonFile(
    path.join(outputDir, 'requirements.json'),
    sanitizeForPersistence(requirements),
  );
  await writeJsonFile(path.join(outputDir, 'defects.json'), sanitizeForPersistence(summary.defects));
  await writeJsonFile(
    path.join(outputDir, 'security-posture.json'),
    sanitizeForPersistence(securityPosture),
  );
}

export function buildDefectsFromExecution(
  requirements: Requirement[],
  preservedEvidence: string[],
  execution?: WorkflowSummary['execution'],
): DefectDraft[] {
  if (!execution || execution.failed === 0) {
    return [];
  }

  return requirements.slice(0, Math.min(requirements.length, execution.failed)).map((requirement) => ({
    title: `[Auto Draft] Investigate failure for ${requirement.id}`,
    severity:
      requirement.priority === 'high' || requirement.priority === 'critical' ? 'high' : 'medium',
    requirementId: requirement.id,
    summary: `Automated execution surfaced a failure linked to ${requirement.title}. Review Playwright artifacts before filing externally.`,
    evidence: [
      'reports/latest/playwright-report.json',
      'reports/latest/summary.json',
      ...preservedEvidence,
    ],
  }));
}
