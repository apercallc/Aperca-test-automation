# New Hire Handbook

## Purpose

This handbook is the starting point for any engineer who needs to learn, run, maintain, or extend the Aperca Test Automation Orchestrator. Read this before making changes to test generation, execution, reporting, or external integrations.

For stricter run and incident procedures, also read [OPERATIONS.md](/Users/tommyhoang/Aperca-test-automation/docs/OPERATIONS.md).

## What this system does

The repository is a QA orchestration layer for `ApercaLLC.com`. It takes requirements, turns them into structured test cases, generates Playwright specs, executes them, and writes artifacts that help the team decide whether a failure is a product bug, a flaky test, or outdated automation.

The current implementation is a production-ready baseline. It is intentionally modular so new integrations can be added without rewriting the core workflow.

## What a new hire needs to understand first

1. This is both a codebase and an operating model.
2. Generated tests are not automatically trusted forever.
3. Stable tests represent reviewed coverage.
4. Reports are the source of truth for each run.
5. Secrets must stay local and never enter source control.

## Architecture overview

### Main workflow

The orchestration entrypoint is [run-workflow.ts](/Users/tommyhoang/Aperca-test-automation/src/cli/run-workflow.ts).

High-level flow:

1. Load requirements from JSON or a future external system.
2. Normalize them into an internal contract.
3. Generate test cases.
4. Write Playwright specs into `tests/generated/`.
5. Execute stable and generated tests with Playwright.
6. Read execution artifacts and summarize results.
7. Draft defect payloads when failures appear.

### Core code map

- [run-workflow.ts](/Users/tommyhoang/Aperca-test-automation/src/cli/run-workflow.ts)
  Main CLI entrypoint.
- [requirement-loader.ts](/Users/tommyhoang/Aperca-test-automation/src/core/requirement-loader.ts)
  Loads the current requirement feed.
- [test-generator.ts](/Users/tommyhoang/Aperca-test-automation/src/core/test-generator.ts)
  Transforms requirements into structured test cases.
- [spec-writer.ts](/Users/tommyhoang/Aperca-test-automation/src/core/spec-writer.ts)
  Writes generated Playwright specs.
- [executor.ts](/Users/tommyhoang/Aperca-test-automation/src/core/executor.ts)
  Runs Playwright and reads the JSON report.
- [reporter.ts](/Users/tommyhoang/Aperca-test-automation/src/core/reporter.ts)
  Produces run summaries and defect drafts.
- [contracts.ts](/Users/tommyhoang/Aperca-test-automation/src/types/contracts.ts)
  Shared interfaces for requirements, test cases, and reporting.

### Non-code operating docs

- [main.md](/Users/tommyhoang/Aperca-test-automation/workflows/main.md)
  End-to-end orchestration contract.
- [requirement-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/requirement-agent.md)
  Requirement ingestion responsibility.
- [test-generator.md](/Users/tommyhoang/Aperca-test-automation/agents/test-generator.md)
  Test case generation responsibility.
- [automation-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/automation-agent.md)
  Automation authoring responsibility.
- [executor-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/executor-agent.md)
  Execution responsibility.
- [maintainer-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/maintainer-agent.md)
  Maintenance and drift handling responsibility.
- [reporter-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/reporter-agent.md)
  Reporting responsibility.
- [defect-agent.md](/Users/tommyhoang/Aperca-test-automation/agents/defect-agent.md)
  Defect-drafting responsibility.

## Repository layout

- `agents/`
  Markdown contracts for each orchestration role.
- `skills/`
  Reusable operating rules such as setup, teardown, retries, and security.
- `config/`
  Environment, test settings, secrets template, and requirement seed data.
- `src/`
  Executable orchestration logic.
- `tests/generated/`
  Machine-generated specs. Review before promoting.
- `tests/stable/`
  Human-reviewed or proven specs.
- `reports/latest/`
  Most recent machine-readable outputs.
- `reports/history/`
  Reserved for archived artifacts.

## Local setup

### Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Playwright browser dependencies

### First-time setup

```bash
cd /Users/tommyhoang/Aperca-test-automation
npm install
npx playwright install chromium
cp config/secrets.example.json config/secrets.json
```

### Optional environment variables

- `APERCA_BASE_URL`
  Overrides the target site URL.
- `APERCA_REQUIREMENTS_PATH`
  Points to a different requirement input file.
- `APERCA_OUTPUT_DIR`
  Reserved for future output routing.

Example:

```bash
APERCA_BASE_URL=https://staging.apercallc.com npm run workflow
```

## Daily commands

### Plan mode

Use this when you want to inspect what the orchestrator would generate without running tests.

```bash
npm run workflow:plan
```

### Generate mode

Use this when you want fresh specs written to `tests/generated/`.

```bash
npm run workflow:generate
```

### Full execution

Use this for normal end-to-end runs.

```bash
npm run workflow
```

### Smoke test only

Use this for a fast validation of local Playwright health.

```bash
npm run test:smoke
```

### Open HTML report

```bash
npm run report:open
```

## Standard operating workflow

### When a new requirement arrives

1. Add it to the active requirement source.
2. Run `npm run workflow:plan`.
3. Review `reports/latest/generated-cases.json`.
4. Run `npm run workflow:generate`.
5. Review generated specs for correctness and selector quality.
6. Run `npm run workflow`.
7. Promote good coverage from `tests/generated/` into `tests/stable/` when appropriate.

### When a test fails

1. Open `reports/latest/summary.json`.
2. Open `reports/latest/playwright-report.json` or the HTML report.
3. Check screenshots, trace, and Playwright output.
4. Decide whether the failure is:
   - product defect
   - flaky test
   - environment issue
   - requirement drift
   - bad generated automation
5. Update the test, config, or requirement source accordingly.

### When the application changes

1. Update requirements first if the business behavior changed.
2. Regenerate tests if the expected paths changed.
3. Manually refactor stable tests if selectors or navigation changed.
4. Re-run the workflow and confirm artifacts are clean.

## How to maintain this codebase

### Safe areas to change often

- `config/requirements.sample.json`
- `tests/generated/`
- `tests/stable/`
- `agents/*.md`
- `skills/*.md`

### Areas that require more care

- [contracts.ts](/Users/tommyhoang/Aperca-test-automation/src/types/contracts.ts)
  Schema changes affect multiple pipeline stages.
- [executor.ts](/Users/tommyhoang/Aperca-test-automation/src/core/executor.ts)
  Small mistakes here can misreport run health.
- [playwright.config.ts](/Users/tommyhoang/Aperca-test-automation/playwright.config.ts)
  Changes affect all browser execution.
- [run-workflow.ts](/Users/tommyhoang/Aperca-test-automation/src/cli/run-workflow.ts)
  This is the orchestration spine.

### Maintenance rules

1. Keep generated and stable tests conceptually separate.
2. Do not put secrets into logs, code comments, or reports.
3. Prefer resilient selectors over brittle DOM chains.
4. Treat flaky tests as defects in the automation system until proven otherwise.
5. Update the docs when you change workflow behavior.

## How to promote a generated test to stable

Move a spec from `tests/generated/` to `tests/stable/` only after:

1. The requirement is clearly defined.
2. The assertions reflect actual business behavior.
3. The selectors are reasonably durable.
4. The test passes consistently across repeated runs.
5. The test adds meaningful coverage instead of duplicate intent.

## Reporting artifacts you must know

- [summary.json](/Users/tommyhoang/Aperca-test-automation/reports/latest/summary.json)
  Top-level run result.
- [generated-cases.json](/Users/tommyhoang/Aperca-test-automation/reports/latest/generated-cases.json)
  Test cases created from requirements.
- [requirements.json](/Users/tommyhoang/Aperca-test-automation/reports/latest/requirements.json)
  Requirement snapshot used for the run.
- [defects.json](/Users/tommyhoang/Aperca-test-automation/reports/latest/defects.json)
  Draft defects based on failures.
- [playwright-report.json](/Users/tommyhoang/Aperca-test-automation/reports/latest/playwright-report.json)
  Machine-readable execution data.

## Troubleshooting

### `npm install` fails

- Confirm Node and npm versions.
- Delete `node_modules/` and retry.
- Check for local network or registry issues.

### Playwright fails before tests start

- Run `npx playwright install chromium`.
- Confirm the target URL is reachable.
- Verify local security tooling is not blocking browser launch.

### Workflow completes but reports look wrong

- Inspect [executor.ts](/Users/tommyhoang/Aperca-test-automation/src/core/executor.ts).
- Confirm `reports/latest/playwright-report.json` was written.
- Re-run with a clean working tree if generated artifacts are stale.

### Generated tests are low quality

- Improve the requirement source first.
- Tighten generation logic in [test-generator.ts](/Users/tommyhoang/Aperca-test-automation/src/core/test-generator.ts).
- Add domain-aware generation rules rather than patching one-off files repeatedly.

## Security expectations

Read [security-guardrails.md](/Users/tommyhoang/Aperca-test-automation/skills/security-guardrails.md) before integrating Jira, GitHub, credentials, or production-like data.

Non-negotiable rules:

1. Never commit `config/secrets.json`.
2. Never print passwords, tokens, cookies, or personal data.
3. Prefer synthetic test data.
4. Clean up transient data after execution.

## What good looks like

A healthy operator of this system should be able to:

1. Add or update a requirement.
2. Generate and review tests.
3. Run the workflow locally.
4. Read artifacts and explain failures.
5. Distinguish automation bugs from product bugs.
6. Keep stable coverage clean and intentional.

## Recommended first-week learning path

1. Read [README.md](/Users/tommyhoang/Aperca-test-automation/README.md).
2. Read [main.md](/Users/tommyhoang/Aperca-test-automation/workflows/main.md).
3. Read this handbook end to end.
4. Run `npm run workflow:plan`.
5. Run `npm run workflow`.
6. Inspect `tests/generated/` and `reports/latest/`.
7. Make one small requirement change and observe how the pipeline responds.
