# Aperca Test Automation Orchestrator

Production-grade baseline for an AI-assisted QA orchestration framework targeting `ApercaLLC.com`. This repository combines requirement ingestion, test-case generation, Playwright execution, artifact capture, and defect/report drafting in a single extensible workflow.

## What is included

- TypeScript-based CLI orchestrator
- Playwright test runner with HTML and JSON reporting
- Modular workflow, agent, and skill specifications
- Generated test pipeline from requirement JSON input
- Structured reporting artifacts in `reports/latest/`
- CI workflow for GitHub Actions

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
npm run workflow:plan
npm run workflow
```

## Workflow modes

- `npm run workflow:plan`
  Loads requirements, generates candidate test cases, and writes artifacts without execution.
- `npm run workflow:generate`
  Loads requirements and writes generated Playwright specs into `tests/generated/`.
- `npm run workflow`
  Executes the full pipeline, including Playwright test execution and report generation.

## Configuration

- `config/env.json`
  Environment targets and browser defaults.
- `config/test-config.json`
  Parallelization, retries, timeouts, and artifact behavior.
- `config/secrets.json`
  Local-only secret material for Jira, GitHub, and test credentials.
- `config/requirements.sample.json`
  Sample requirement feed used by the orchestrator.

## Reporting

Primary artifacts are written to `reports/latest/`:

- `summary.json`
- `generated-cases.json`
- `requirements.json`
- `defects.json`
- `playwright-report.json`

For HTML inspection, run:

```bash
npm run report:open
```

## Recommended next extensions

1. Replace `config/requirements.sample.json` with a Jira ingestion adapter.
2. Add page objects or domain-specific helpers for ApercaLLC.com flows.
3. Promote reviewed generated specs from `tests/generated/` into `tests/stable/`.
4. Implement real defect creation in Jira or GitHub Issues from `reports/latest/defects.json`.

## Security

- Do not commit `config/secrets.json`.
- Use synthetic test data whenever possible.
- Review `skills/security-guardrails.md` before wiring external systems.
