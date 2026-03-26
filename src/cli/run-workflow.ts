import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { archiveLatestReport } from '../core/archive.js';
import { secureArtifacts } from '../core/artifact-security.js';
import { loadResolvedConfig, validateResolvedConfig } from '../core/config.js';
import { exportTestCasesCsv } from '../core/csv.js';
import { checkEnvironmentReadiness } from '../core/environment.js';
import { executePlaywrightWorkflow } from '../core/executor.js';
import { createJiraDefects, loadRequirementsFromJira } from '../core/jira.js';
import { maybeSendSlackNotification } from '../core/notifications.js';
import { runDoctor } from '../core/preflight.js';
import { redactString, sanitizeForPersistence } from '../core/redaction.js';
import { loadRequirements } from '../core/requirement-loader.js';
import { writeWorkflowArtifacts, buildDefectsFromExecution } from '../core/reporter.js';
import { writeGeneratedSpecs } from '../core/spec-writer.js';
import { generateTestCases } from '../core/test-generator.js';
import type { WorkflowSummary } from '../types/contracts.js';
import { emptyDir, ensureDir, writeJsonFile } from '../utils/fs.js';

type Mode = 'plan' | 'generate' | 'execute' | 'doctor';

function parseMode(argv: string[]): Mode {
  const rawArg = argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1];
  if (rawArg === 'plan' || rawArg === 'generate' || rawArg === 'execute' || rawArg === 'doctor') {
    return rawArg;
  }

  return 'execute';
}

function resolveExecutionTargets(config: {
  test: {
    executeStable: boolean;
    executeGenerated: boolean;
  };
}): string[] {
  const targets: string[] = [];

  if (config.test.executeStable) {
    targets.push('tests/stable');
  }

  if (config.test.executeGenerated) {
    targets.push('tests/generated');
  }

  return targets;
}

async function main(): Promise<void> {
  const currentFile = fileURLToPath(import.meta.url);
  const projectRoot = path.resolve(path.dirname(currentFile), '../..');
  const config = await loadResolvedConfig(projectRoot);
  const mode = parseMode(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[:.]/g, '-');
  const warnings = validateResolvedConfig(config);

  await ensureDir(config.outputDir);

  if (mode === 'execute') {
    await emptyDir(config.outputDir);
  }

  const doctorReport = await runDoctor(config);

  if (mode === 'doctor') {
    await writeJsonFile(path.join(config.outputDir, 'doctor.json'), doctorReport);
    console.log(JSON.stringify(doctorReport, null, 2));
    process.exitCode = doctorReport.ok ? 0 : 1;
    return;
  }

  const requirements =
    config.requirementsSource === 'jira'
      ? await loadRequirementsFromJira(config)
      : await loadRequirements(config.requirementsPath);
  const generatedCases = generateTestCases(requirements);
  const generatedSpecs = await writeGeneratedSpecs(projectRoot, generatedCases);
  const testCaseCsvPath = config.test.exportCsv
    ? await exportTestCasesCsv(config.outputDir, generatedCases)
    : undefined;
  const readiness = await checkEnvironmentReadiness(config.environment.baseUrl);

  if (mode === 'execute' && config.test.requireEnvironmentReady && !readiness.ready) {
    throw new Error(
      `Environment readiness check failed for ${readiness.checkedUrl}: ${readiness.details}`,
    );
  }

  const executionTargets = resolveExecutionTargets(config);

  if (mode === 'execute' && executionTargets.length === 0) {
    throw new Error('Execution is enabled but no test targets are configured.');
  }

  const execution =
    mode === 'execute' ? await executePlaywrightWorkflow(executionTargets) : undefined;
  const preservedEvidence =
    mode === 'execute'
      ? await secureArtifacts(projectRoot, config.outputDir, {
          redactSensitiveData: config.test.redactSensitiveData,
          persistRawArtifacts: config.test.persistRawArtifacts,
        })
      : [];

  const defects = buildDefectsFromExecution(requirements, preservedEvidence, execution);

  const summary: WorkflowSummary = {
    runId,
    mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    environment: {
      name: config.environment.name,
      baseUrl: config.environment.baseUrl,
    },
    readiness,
    requirements: requirements.length,
    generatedCases: generatedCases.length,
    generatedSpecs: generatedSpecs.map((specPath) => path.relative(projectRoot, specPath)),
    configuration: {
      slackEnabled: config.notifications.slackEnabled,
      archiveHistory: config.test.archiveHistory,
      requirementsPath:
        config.requirementsSource === 'jira'
          ? 'jira-search'
          : path.relative(projectRoot, config.requirementsPath),
      requirementsSource: config.requirementsSource,
      safeMode: config.test.safeMode,
      redactSensitiveData: config.test.redactSensitiveData,
    },
    validation: {
      warnings,
    },
    defects,
    integrations: {
      jiraDefectsCreated: [],
      zephyrSync: config.test.syncZephyr ? 'csv-export-only' : 'disabled',
    },
  };

  if (testCaseCsvPath) {
    summary.exportedArtifacts = {
      testCaseCsv: path.relative(projectRoot, testCaseCsvPath),
    };
  }

  if (execution) {
    summary.execution = {
      passed: execution.passed,
      failed: execution.failed,
      flaky: execution.flaky,
      command: execution.command,
    };
  }

  const securityPosture = {
    safeMode: config.test.safeMode,
    redactSensitiveData: config.test.redactSensitiveData,
    persistRawArtifacts: config.test.persistRawArtifacts,
    slackNotificationsEnabled: config.notifications.slackEnabled,
    notes: [
      'Artifact JSON files are sanitized before persistence.',
      'Slack notifications are reduced in safe mode.',
      'Raw Playwright HTML and test-results artifacts are removed when persistRawArtifacts is false.',
      'Do not place customer records or secrets in requirement source files.',
    ],
  };

  const createdJiraDefects = await createJiraDefects(config, defects);
  summary.integrations = {
    jiraDefectsCreated: createdJiraDefects,
    zephyrSync: config.test.syncZephyr ? 'csv-export-only' : 'disabled',
  };

  await writeWorkflowArtifacts(
    config.outputDir,
    summary,
    generatedCases,
    requirements,
    securityPosture,
  );
  await writeJsonFile(
    path.join(config.outputDir, 'doctor.json'),
    sanitizeForPersistence(doctorReport),
  );

  if (config.test.archiveHistory) {
    const archivePath = await archiveLatestReport(config.outputDir, projectRoot, runId);
    await writeJsonFile(path.join(config.outputDir, 'archive.json'), {
      runId,
      archivePath: path.relative(projectRoot, archivePath),
    });
  }

  const notification = await maybeSendSlackNotification(config, summary);

  console.log(
    JSON.stringify(
      sanitizeForPersistence({
        message: 'Workflow completed',
        summary,
        doctorReport,
        notification,
      }),
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(redactString(message));
  process.exitCode = 1;
});
