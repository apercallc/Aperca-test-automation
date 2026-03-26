# Aperca Test Automation Orchestrator

Production-grade baseline for an AI-assisted QA orchestration framework targeting `ApercaLLC.com`. This repository combines requirement ingestion, test-case generation, Playwright execution, artifact capture, and defect/report drafting in a single extensible workflow.

## What is included

- TypeScript-based CLI orchestrator
- Playwright test runner with HTML and JSON reporting
- Modular workflow, agent, and skill specifications
- Generated test pipeline from requirement JSON input
- Structured reporting artifacts in `reports/latest/`
- CI workflow for GitHub Actions
- New-hire onboarding and maintenance handbook

## Project structure

```text
Aperca-test-automation/
├── agents/
├── config/
├── reports/
├── scripts/
├── skills/
├── src/
├── tests/
├── workflows/
├── .github/workflows/ci.yml
├── package.json
├── playwright.config.ts
└── README.md
```

## Quick start

```bash
cd /Users/tommyhoang/Aperca-test-automation
npm install
npx playwright install chromium
cp config/secrets.example.json config/secrets.json
npm run workflow:doctor
npm run workflow:plan
npm run workflow
```

## Documentation

- [New Hire Handbook](/Users/tommyhoang/Aperca-test-automation/docs/new-hire-handbook.md)
  Learn the architecture, operating model, maintenance expectations, and daily commands.
- [Operations Runbook](/Users/tommyhoang/Aperca-test-automation/docs/OPERATIONS.md)
  Use for stricter execution standards, CI discipline, incident response, and release checks.
- [Architecture](/Users/tommyhoang/Aperca-test-automation/docs/ARCHITECTURE.md)
  Use for system design, data flow, trust boundaries, and extension planning.
- [Integrations](/Users/tommyhoang/Aperca-test-automation/docs/INTEGRATIONS.md)
  Use for Slack, Jira, GitHub, and API-key setup.
- [Main Workflow](/Users/tommyhoang/Aperca-test-automation/workflows/main.md)
  Understand the orchestration stages and outputs.

## Workflow modes

- `npm run workflow:plan`
  Loads requirements, generates candidate test cases, and writes artifacts without execution.
- `npm run workflow:generate`
  Loads requirements and writes generated Playwright specs into `tests/generated/`.
- `npm run workflow`
  Executes the full pipeline, including Playwright test execution and report generation.
- `npm run workflow:doctor`
  Validates configuration, secrets presence, and integration readiness.

## Configuration

- `config/env.json`
  Environment targets and browser defaults.
- `config/test-config.json`
  Parallelization, retries, timeouts, and artifact behavior.
- `config/secrets.json`
  Local-only secret material for Jira, GitHub, and test credentials.
- `config/secrets.example.json`
  Includes Slack webhook and API-key placeholders for integrations.
- `config/requirements.sample.json`
  Sample requirement feed used by the orchestrator.
- `APERCA_REQUIREMENTS_SOURCE`
  Switches requirement intake between `file` and `jira`.

## Reporting

Primary artifacts are written to `reports/latest/`:

- `summary.json`
- `generated-cases.json`
- `requirements.json`
- `defects.json`
- `playwright-report.json`
- `doctor.json`
- `archive.json`
- `security-posture.json`
- `test-cases.csv`

For HTML inspection, run:

```bash
npm run report:open
```

Note: when `persistRawArtifacts` is `false` in [test-config.json](/Users/tommyhoang/Aperca-test-automation/config/test-config.json), raw Playwright HTML and `test-results` are removed after execution for safer default handling.

## Recommended next extensions

1. Replace `config/requirements.sample.json` with a Jira ingestion adapter.
2. Add page objects or domain-specific helpers for ApercaLLC.com flows.
3. Promote reviewed generated specs from `tests/generated/` into `tests/stable/`.
4. Implement real defect creation in Jira or GitHub Issues from `reports/latest/defects.json`.

## Security

- Do not commit `config/secrets.json`.
- Use synthetic test data whenever possible.
- Review `skills/security-guardrails.md` before wiring external systems.
