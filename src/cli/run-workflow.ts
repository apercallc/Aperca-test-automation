import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { executePlaywrightWorkflow } from '../core/executor.js';
import { loadRequirements } from '../core/requirement-loader.js';
import { writeWorkflowArtifacts, buildDefectsFromExecution } from '../core/reporter.js';
import { writeGeneratedSpecs } from '../core/spec-writer.js';
import { generateTestCases } from '../core/test-generator.js';
import type { WorkflowSummary } from '../types/contracts.js';

type Mode = 'plan' | 'generate' | 'execute';

function parseMode(argv: string[]): Mode {
  const rawArg = argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1];
  if (rawArg === 'plan' || rawArg === 'generate' || rawArg === 'execute') {
    return rawArg;
  }

  return 'execute';
}

async function main(): Promise<void> {
  const currentFile = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentFile), '../..');
  const mode = parseMode(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[:.]/g, '-');

  const requirements = await loadRequirements(projectRoot);
  const generatedCases = generateTestCases(requirements);
  const generatedSpecs = await writeGeneratedSpecs(projectRoot, generatedCases);

  const execution = mode === 'execute' ? await executePlaywrightWorkflow('execute') : undefined;
  const defects = buildDefectsFromExecution(requirements, execution);

  const summary: WorkflowSummary = {
    runId,
    mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    requirements: requirements.length,
    generatedCases: generatedCases.length,
    generatedSpecs: generatedSpecs.map((specPath) => path.relative(projectRoot, specPath)),
    execution: execution
      ? {
          passed: execution.passed,
          failed: execution.failed,
          flaky: execution.flaky,
          command: execution.command,
        }
      : undefined,
    defects,
  };

  await writeWorkflowArtifacts(projectRoot, summary, generatedCases, requirements);

  console.log(
    JSON.stringify(
      {
        message: 'Workflow completed',
        summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
