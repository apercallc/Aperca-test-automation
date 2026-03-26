import { access } from 'node:fs/promises';
import { constants } from 'node:fs';

import type { DoctorReport, ResolvedConfig } from '../types/contracts.js';

export async function runDoctor(config: ResolvedConfig): Promise<DoctorReport> {
  const checks: DoctorReport['checks'] = [];

  checks.push({
    name: 'Base URL',
    ok: isValidHttpUrl(config.environment.baseUrl),
    details: config.environment.baseUrl,
  });

  checks.push({
    name: 'Requirements File',
    ok: config.requirementsSource === 'jira' ? true : await pathExists(config.requirementsPath),
    details:
      config.requirementsSource === 'jira'
        ? 'Requirement intake uses Jira search'
        : config.requirementsPath,
  });

  checks.push({
    name: 'Secrets File',
    ok: await pathExists(config.secretsPath),
    details: (await pathExists(config.secretsPath))
      ? `${config.secretsPath} present`
      : `${config.secretsPath} not found; optional integrations disabled`,
  });

  checks.push({
    name: 'Slack Webhook',
    ok: config.notifications.slackEnabled,
    details: config.notifications.slackEnabled
      ? 'Configured'
      : 'Missing; notifications will be skipped',
  });

  checks.push({
    name: 'LLM API Key',
    ok: Boolean(config.secrets.apiKeys?.openai || config.secrets.apiKeys?.anthropic),
    details:
      isConfigured(config.secrets.apiKeys?.openai) || isConfigured(config.secrets.apiKeys?.anthropic)
        ? 'Configured'
        : 'Missing; external AI integrations unavailable',
  });

  checks.push({
    name: 'Jira API Token',
    ok: isConfigured(config.secrets.jira?.apiToken),
    details: isConfigured(config.secrets.jira?.apiToken)
      ? 'Configured'
      : 'Missing; Jira integration unavailable',
  });

  checks.push({
    name: 'Requirement Source',
    ok: true,
    details: config.requirementsSource,
  });

  checks.push({
    name: 'GitHub Token',
    ok: isConfigured(config.secrets.github?.token),
    details: isConfigured(config.secrets.github?.token)
      ? 'Configured'
      : 'Missing; GitHub issue integration unavailable',
  });

  checks.push({
    name: 'Safe Mode',
    ok: config.test.safeMode,
    details: config.test.safeMode
      ? 'Enabled'
      : 'Disabled; persisted outputs and notifications may expose more detail',
  });

  checks.push({
    name: 'Redaction',
    ok: config.test.redactSensitiveData,
    details: config.test.redactSensitiveData
      ? 'Enabled'
      : 'Disabled; sensitive strings may persist in artifacts',
  });

  const warnings = checks.filter((check) => !check.ok).map((check) => `${check.name}: ${check.details}`);

  return {
    ok: warnings.length === 0,
    environment: {
      baseUrl: config.environment.baseUrl,
      environmentName: config.environment.name,
    },
    checks,
    warnings,
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isConfigured(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim() !== 'replace-me';
}
