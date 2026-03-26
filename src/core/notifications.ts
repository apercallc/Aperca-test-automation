import type { ResolvedConfig, WorkflowSummary } from '../types/contracts.js';
import { redactString } from './redaction.js';

export async function maybeSendSlackNotification(
  config: ResolvedConfig,
  summary: WorkflowSummary,
): Promise<{ sent: boolean; reason?: string }> {
  const webhookUrl =
    process.env.APERCA_SLACK_WEBHOOK_URL ?? config.secrets.notifications?.slack?.webhookUrl;

  if (!webhookUrl) {
    return { sent: false, reason: 'Slack webhook not configured' };
  }

  const shouldNotify =
    summary.mode === 'execute' &&
    ((summary.execution?.failed ?? 0) > 0
      ? config.test.notifyOnFailure
      : config.test.notifyOnSuccess);

  if (!shouldNotify) {
    return { sent: false, reason: 'Notification suppressed by configuration' };
  }

  const payload = {
    text: redactString(buildSlackText(summary, config.test.safeMode)),
    username: config.secrets.notifications?.slack?.username ?? 'Aperca QA Orchestrator',
    channel: config.secrets.notifications?.slack?.channel,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { sent: false, reason: `Slack returned HTTP ${response.status}` };
  }

  return { sent: true };
}

function buildSlackText(summary: WorkflowSummary, safeMode: boolean): string {
  const status = summary.execution && summary.execution.failed > 0 ? 'FAILED' : 'PASSED';
  const executionLine = summary.execution
    ? `passed=${summary.execution.passed}, failed=${summary.execution.failed}, flaky=${summary.execution.flaky}`
    : 'execution skipped';
  const lines = [
    `Aperca QA workflow ${status}`,
    `runId=${summary.runId}`,
    `environment=${summary.environment.name}`,
    `requirements=${summary.requirements}`,
    `generatedCases=${summary.generatedCases}`,
    executionLine,
  ];

  if (!safeMode) {
    lines.splice(3, 0, `baseUrl=${summary.environment.baseUrl}`);
  }

  return lines.join('\n');
}
