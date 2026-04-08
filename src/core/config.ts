import path from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

import type {
  EnvironmentConfig,
  ResolvedConfig,
  SecretConfig,
  TestConfig,
} from '../types/contracts.js';
import { readJsonFile } from '../utils/fs.js';

interface EnvironmentFile {
  default: EnvironmentConfig;
  [key: string]: EnvironmentConfig;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isConfiguredSecret(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().toLowerCase() !== 'replace-me'
  );
}

export async function loadResolvedConfig(
  projectRoot: string,
): Promise<ResolvedConfig> {
  const envFile = await readJsonFile<EnvironmentFile>(
    path.join(projectRoot, 'config/env.json'),
  );
  const testFile = await readJsonFile<TestConfig>(
    path.join(projectRoot, 'config/test-config.json'),
  );
  const environmentName = process.env.APERCA_ENVIRONMENT ?? 'default';
  const environment = envFile[environmentName] ?? envFile.default;
  const requirementsPath = path.resolve(
    projectRoot,
    process.env.APERCA_REQUIREMENTS_PATH ?? './config/requirements.sample.json',
  );
  const requirementsSource =
    process.env.APERCA_REQUIREMENTS_SOURCE === 'jira' ? 'jira' : 'file';
  const outputDir = path.resolve(
    projectRoot,
    process.env.APERCA_OUTPUT_DIR ?? './reports/latest',
  );
  const secretsPath = path.resolve(projectRoot, './config/secrets.json');
  const secrets = await loadSecrets(secretsPath);
  const baseUrl = process.env.APERCA_BASE_URL ?? environment.baseUrl;
  const slackWebhook =
    process.env.APERCA_SLACK_WEBHOOK_URL ??
    secrets.notifications?.slack?.webhookUrl;

  return {
    environment: {
      ...environment,
      baseUrl,
    },
    test: testFile,
    secrets,
    projectRoot,
    outputDir,
    secretsPath,
    requirementsPath,
    requirementsSource,
    notifications: {
      slackEnabled: isConfiguredSecret(slackWebhook),
    },
  };
}

export function validateResolvedConfig(config: ResolvedConfig): string[] {
  const warnings: string[] = [];

  if (!/^https?:\/\//.test(config.environment.baseUrl)) {
    warnings.push('APERCA_BASE_URL is not a valid absolute URL.');
  }

  if (config.test.maxThreads < 1) {
    warnings.push('config/test-config.json must set maxThreads to at least 1.');
  }

  if (config.test.retryCount < 0) {
    warnings.push(
      'config/test-config.json must set retryCount to 0 or greater.',
    );
  }

  if (!isNonEmptyString(config.test.artifactsDir)) {
    warnings.push(
      'config/test-config.json must include a non-empty artifactsDir.',
    );
  }

  if (config.test.safeMode && config.test.persistRawArtifacts) {
    warnings.push(
      'safeMode is enabled while persistRawArtifacts is true. Raw artifact retention increases exposure.',
    );
  }

  if (
    isConfiguredSecret(config.secrets.notifications?.slack?.webhookUrl) &&
    !config.secrets.notifications?.slack?.webhookUrl.startsWith('https://')
  ) {
    warnings.push('Slack webhook URL should be an HTTPS URL.');
  }

  if (!isConfiguredSecret(config.secrets.github?.token)) {
    warnings.push(
      'GitHub token is not configured. GitHub issue automation is disabled.',
    );
  }

  if (!isConfiguredSecret(config.secrets.jira?.apiToken)) {
    warnings.push(
      'Jira API token is not configured. Jira requirement and defect automation is disabled.',
    );
  }

  if (
    !isConfiguredSecret(config.secrets.apiKeys?.openai) &&
    !isConfiguredSecret(config.secrets.apiKeys?.anthropic)
  ) {
    warnings.push(
      'No LLM API key is configured. External AI-assisted generation integrations are disabled.',
    );
  }

  if (
    config.requirementsSource === 'jira' &&
    !isConfiguredSecret(config.secrets.jira?.apiToken)
  ) {
    warnings.push(
      'Requirements source is Jira but Jira credentials are incomplete.',
    );
  }

  if (!config.notifications.slackEnabled) {
    warnings.push(
      'Slack webhook is not configured. Run notifications are disabled.',
    );
  }

  return warnings;
}

async function loadSecrets(secretsPath: string): Promise<SecretConfig> {
  try {
    await access(secretsPath, constants.R_OK);
  } catch {
    return {};
  }

  return readJsonFile<SecretConfig>(secretsPath);
}
