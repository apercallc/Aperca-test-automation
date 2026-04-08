# Integrations

## Purpose

This document explains the external integrations the Aperca Test Automation Orchestrator is prepared to use, what credentials they require, and what is currently enabled versus scaffolded.

## Current integration status

Implemented now:

- Slack incoming webhook notifications
- runtime detection of API key and token availability
- doctor checks for missing integration credentials
- Jira-backed requirement intake
- CSV export for generated test cases
- Jira defect creation wiring

Scaffolded but not fully implemented yet:

- Zephyr API sync beyond CSV export
- GitHub issue creation
- external LLM provider calls for generation workflows

## Secrets file

Copy [secrets.example.json](../config/secrets.example.json) to `config/secrets.json` and replace placeholder values.

```bash
cp config/secrets.example.json config/secrets.json
```

Any value left as `replace-me` is treated as not configured.

## Slack

### What it is used for

- notify the team when execute-mode runs fail
- optionally notify on successful runs

### Required secret

- `notifications.slack.webhookUrl`

Optional:

- `notifications.slack.channel`
- `notifications.slack.username`

### Example

```json
{
  "notifications": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/real/value",
      "channel": "#qa-automation",
      "username": "Aperca QA Orchestrator"
    }
  }
}
```

### Runtime behavior

- notifications only fire in `execute` mode
- success notifications are controlled by `notifyOnSuccess`
- failure notifications are controlled by `notifyOnFailure`

Configuration lives in [test-config.json](../config/test-config.json).

## LLM API keys

### What they are for

These are not actively called by the current baseline, but they are tracked and validated because the system is intended to support AI-assisted requirement parsing and test generation.

Supported placeholders:

- `apiKeys.openai`
- `apiKeys.anthropic`
- `apiKeys.apercaInternal`

At least one external LLM key is recommended if the next phase is adding live AI generation.

## Jira

### Intended uses

- requirement ingestion
- defect creation

### Required fields

- `jira.baseUrl`
- `jira.email`
- `jira.apiToken`

Optional:

- `jira.projectKey`

Current state:

The orchestrator can ingest requirements from Jira search and can create Jira defects when enabled. Set:

- `APERCA_REQUIREMENTS_SOURCE=jira`
- `APERCA_JIRA_REQUIREMENTS_JQL=...`

and provide Jira credentials in `config/secrets.json`.

Defect creation is controlled by `createJiraDefects` in [test-config.json](../config/test-config.json).

## Zephyr

### Current state

The framework exports generated test cases to [test-cases.csv](../reports/latest/test-cases.csv), which can be imported into Zephyr. Direct Zephyr API sync is not yet implemented because Zephyr product variants differ materially.

Current supported mode:

- `syncZephyr=false`
  CSV export only

## GitHub

### Intended uses

- issue creation
- repository-linked defect tracking

### Required fields

- `github.token`
- `github.repository`

Current state:

The orchestrator validates whether the token is present, but it does not yet create issues automatically.

## How to check readiness

Run:

```bash
npm run workflow:doctor
```

If the doctor command returns a non-zero exit code, review the missing checks and update `config/secrets.json` or environment variables.

## Environment variable overrides

You can override selected values at runtime:

- `APERCA_BASE_URL`
- `APERCA_ENVIRONMENT`
- `APERCA_REQUIREMENTS_PATH`
- `APERCA_OUTPUT_DIR`
- `APERCA_SLACK_WEBHOOK_URL`

Example:

```bash
APERCA_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/real/value npm run workflow
```

## Practical launch checklist

Before calling this project “operational,” provide:

1. a real `config/secrets.json`
2. a real Slack webhook
3. at least one real LLM API key if AI integrations are planned immediately
4. the correct target base URL for the intended environment
5. a real requirement source beyond the sample JSON
