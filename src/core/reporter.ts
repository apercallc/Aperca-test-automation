import path from 'node:path';

import type { DefectDraft, GeneratedTestCase, Requirement, WorkflowSummary } from '../types/contracts.js';
import { writeJsonFile } from '../utils/fs.js';

export async function writeWorkflowArtifacts(
  projectRoot: string,
  summary: WorkflowSummary,
  generatedCases: GeneratedTestCase[],
  requirements: Requirement[],
): Promise<void> {
  const latestDir = path.join(projectRoot, 'reports/latest');
  await writeJsonFile(path.join(latestDir, 'summary.json'), summary);
  await writeJsonFile(path.join(latestDir, 'generated-cases.json'), generatedCases);
  await writeJsonFile(path.join(latestDir, 'requirements.json'), requirements);
  await writeJsonFile(path.join(latestDir, 'defects.json'), summary.defects);
}

export function buildDefectsFromExecution(
  requirements: Requirement[],
  execution?: WorkflowSummary['execution'],
): DefectDraft[] {
  if (!execution || execution.failed === 0) {
    return [];
  }

  return requirements.slice(0, Math.min(requirements.length, execution.failed)).map((requirement) => ({
    title: `[Auto Draft] Investigate failure for ${requirement.id}`,
    severity: requirement.priority === 'high' || requirement.priority === 'critical' ? 'high' : 'medium',
    requirementId: requirement.id,
    summary: `Automated execution surfaced a failure linked to ${requirement.title}. Review Playwright artifacts before filing externally.`,
    evidence: ['reports/latest/playwright-report.json', 'playwright-report/index.html'],
  }));
}
