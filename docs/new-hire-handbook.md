# New Hire Handbook

## Purpose

This handbook covers everything you need to set up, run, understand, maintain, and extend the Aperca Test Automation Orchestrator. Read it before touching the codebase.

For execution standards and incident response, also read [OPERATIONS.md](OPERATIONS.md).

---

## What this system does

This repository is a QA orchestration layer for `ApercaLLC.com`. It:

1. Ingests requirements from a local JSON file or Jira.
2. Generates structured positive, negative, and edge test cases.
3. Writes executable Playwright specs into `tests/generated/`.
4. Executes stable and generated suites with configurable parallelism and retries.
5. Redacts sensitive data and writes structured artifacts to `reports/latest/`.
6. Drafts defect payloads linked to failures.
7. Optionally archives each run to `reports/history/` and notifies Slack.

The system is intentionally modular. New integrations plug into `src/core/` without touching the orchestration spine.

---

## Prerequisites

Before you can run anything:

| Requirement | Minimum version |
|---|---|
| Node.js | 22.0.0 |
| npm | 10.0.0 |
| Git | any recent version |

Verify your versions:

```bash
node --version   # must be >= 22
npm --version    # must be >= 10
```

---

## First-time setup

### 1. Install JavaScript dependencies

```bash
npm install
```

### 2. Install the Playwright browser runtime

```bash
npx playwright install chromium
```

This downloads the Chromium binary Playwright uses for test execution. You only need to do this once, or when the Playwright version is updated.

### 3. Create your local secrets file

```bash
cp config/secrets.example.json config/secrets.json
```

`config/secrets.json` is gitignored and stays on your machine. Open it and fill in any credentials you need. Leave values as `replace-me` if you are not using that integration — the system treats those as unconfigured and skips gracefully.

### 4. Run the doctor check

```bash
npm run workflow:doctor
```

This validates your configuration, confirms environment reachability, and reports which integrations are ready. Review the output and fix any warnings relevant to your work. It is normal to see warnings for Jira, GitHub, and LLM keys if you are not using those integrations yet.

### 5. Run a plan pass

```bash
npm run workflow:plan
```

This loads requirements, generates test cases and specs, and writes artifacts to `reports/latest/` — without running any browser tests. Use it to confirm the pipeline is wired correctly without needing a live environment.

---

## Running the full workflow

```bash
npm run workflow
```

This runs the complete pipeline:

1. Doctor checks
2. Requirement loading
3. Test-case generation
4. Spec writing to `tests/generated/`
5. CSV export to `reports/latest/test-cases.csv`
6. Environment readiness check
7. Playwright execution (stable and/or generated suites, based on `test-config.json`)
8. Artifact security — redacts and removes raw outputs
9. Defect drafting for any failures
10. Artifact writing to `reports/latest/`
11. History archiving to `reports/history/<runId>/`
12. Slack notification (if configured)

---

## All available commands

```bash
npm run build            # Type-check and compile TypeScript to dist/
npm run lint             # Run ESLint across all .ts files
npm run format           # Run Prettier across the repository
npm run test:smoke       # Single smoke test — fastest Playwright health check
npm run report:open      # Open the HTML Playwright report in a browser
npm run workflow:doctor  # Preflight validation — check config, secrets, integrations
npm run workflow:plan    # Generate cases and specs, write artifacts, no test execution
npm run workflow:generate  # Regenerate specs into tests/generated/, no execution
npm run workflow         # Full pipeline: generate + execute + report + archive + notify
```

---

## Repository layout

```text
agents/                  Role contracts for each orchestration agent
config/
  env.json               Named environments (default, staging)
  test-config.json       Execution flags: threads, retries, artifacts, integrations
  secrets.example.json   Template for secrets.json — never commit the real file
  requirements.sample.json  Sample requirement feed
docs/                    This handbook, architecture, operations, integrations, security
reports/
  latest/                Current-run artifacts (cleared at the start of each execute run)
  history/               Archived snapshots per run ID
scripts/
  bootstrap.sh           First-time setup automation
skills/                  Reusable operating rules: security, retry, data, parallelism
src/
  cli/run-workflow.ts    Orchestration entrypoint — the pipeline spine
  core/                  All pipeline modules
  types/contracts.ts     Canonical TypeScript interfaces
  utils/fs.ts            Filesystem helpers used across the codebase
tests/
  generated/             Machine-generated specs — review before treating as stable
  stable/                Human-reviewed specs — trusted for CI gating
  support/site.ts        Shared Playwright helpers (navigation, assertions)
workflows/main.md        End-to-end orchestration contract
.github/workflows/ci.yml GitHub Actions CI pipeline
playwright.config.ts     Playwright browser and reporter configuration
```

---

## Configuration reference

### `config/env.json`

Defines named environments. The active one is selected by `APERCA_ENVIRONMENT` (defaults to `default`).

```json
{
  "default": {
    "name": "production",
    "baseUrl": "https://apercallc.com",
    "browser": "chromium",
    "headless": true
  },
  "staging": {
    "name": "staging",
    "baseUrl": "https://staging.apercallc.com",
    "browser": "chromium",
    "headless": true
  }
}
```

### `config/test-config.json`

Controls how execution and artifact handling behave.

| Field | Type | What it controls |
|---|---|---|
| `executeStable` | bool | Run `tests/stable/` during execute mode |
| `executeGenerated` | bool | Run `tests/generated/` during execute mode |
| `maxThreads` | number | Playwright parallel worker count |
| `retryCount` | number | Max retries on failure |
| `timeoutMs` | number | Per-test timeout in milliseconds |
| `safeMode` | bool | Reduces Slack payload detail; enforces redaction |
| `redactSensitiveData` | bool | Sanitizes all persisted artifact JSON |
| `persistRawArtifacts` | bool | When `false`, removes `playwright-report/` and `test-results/` after execution |
| `exportCsv` | bool | Export generated cases to `reports/latest/test-cases.csv` |
| `archiveHistory` | bool | Copy run artifacts to `reports/history/<runId>/` |
| `createJiraDefects` | bool | Automatically create Jira issues from failure drafts |
| `syncZephyr` | bool | Currently CSV-export only — API sync not yet implemented |
| `notifyOnSuccess` | bool | Send Slack message on passing runs |
| `notifyOnFailure` | bool | Send Slack message on failing runs |
| `requireEnvironmentReady` | bool | Abort execute mode if base URL is unreachable |
| `flakeDetection` | bool | Flag inconsistent outcomes as potential flakes |

### `config/secrets.json`

This file is **gitignored and must never be committed**. Copy from `secrets.example.json`:

```bash
cp config/secrets.example.json config/secrets.json
```

Fields you may need to populate:

```json
{
  "jira": {
    "baseUrl": "https://your-company.atlassian.net",
    "email": "qa-bot@example.com",
    "apiToken": "...",
    "projectKey": "APR",
    "bugIssueType": "Bug",
    "requirementsJql": "project = APR AND labels = qa-ready ORDER BY priority DESC"
  },
  "github": {
    "token": "...",
    "repository": "apercallc/Aperca-test-automation"
  },
  "notifications": {
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/...",
      "channel": "#qa-automation",
      "username": "Aperca QA Orchestrator"
    }
  },
  "apiKeys": {
    "openai": "...",
    "anthropic": "..."
  }
}
```

Any value left as `replace-me` is treated as unconfigured and will not be used.

---

## Environment variable overrides

All environment variables are optional. They override their `config/` file equivalents.

| Variable | Effect |
|---|---|
| `APERCA_BASE_URL` | Override the base URL from `env.json` |
| `APERCA_ENVIRONMENT` | Select named environment: `default` or `staging` |
| `APERCA_REQUIREMENTS_PATH` | Path to a requirements JSON file |
| `APERCA_REQUIREMENTS_SOURCE` | `file` (default) or `jira` |
| `APERCA_JIRA_REQUIREMENTS_JQL` | JQL query for Jira-backed intake |
| `APERCA_OUTPUT_DIR` | Override the output directory (default: `reports/latest`) |
| `APERCA_SLACK_WEBHOOK_URL` | Override the Slack webhook from secrets |

Example — run against staging:

```bash
APERCA_ENVIRONMENT=staging npm run workflow
```

Example — run against a custom URL:

```bash
APERCA_BASE_URL=https://staging.apercallc.com npm run workflow
```

---

## Requirements format

Requirements are loaded from `config/requirements.sample.json` by default. Each object must include:

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Unique identifier, e.g. `APR-001` |
| `title` | yes | Short description of the requirement |
| `source` | yes | Where the requirement came from, e.g. `manual-seed` or `jira` |
| `priority` | yes | One of `low`, `medium`, `high`, `critical` |
| `acceptanceCriteria` | yes | Array of at least one criterion string |
| `description` | no | Longer narrative |

To use Jira as the source instead:

```bash
APERCA_REQUIREMENTS_SOURCE=jira \
APERCA_JIRA_REQUIREMENTS_JQL="project = APR AND labels = qa-ready ORDER BY priority DESC" \
npm run workflow
```

Jira credentials must be set in `config/secrets.json`.

---

## How tests are generated

When you run `workflow:plan`, `workflow:generate`, or `workflow`, the generator in [src/core/test-generator.ts](../src/core/test-generator.ts) produces three cases per requirement:

| Case type | Intent |
|---|---|
| `positive` | The main happy-path scenario from all acceptance criteria |
| `negative` | An invalid or incomplete user path that should fail safely |
| `edge` | Structural and resilience checks under boundary conditions |

Negative cases are only generated when the requirement has more than one acceptance criterion.

Cases are written as spec files to `tests/generated/` by [src/core/spec-writer.ts](../src/core/spec-writer.ts). Each spec uses Playwright's `{ tag: [...] }` metadata for filtering by priority, type, or `@generated`.

---

## Test suites explained

### `tests/stable/`

These are human-reviewed, production-trusted specs. They test real ApercaLLC.com behavior with actual selectors, page navigation, and assertions against live content. They are always included in CI.

Current stable coverage:
- `smoke.spec.ts` — homepage body is visible
- `homepage-navigation.spec.ts` — homepage content, CTA, and navigation to products
- `products-discovery.spec.ts` — products page search and product detail navigation
- `contact-flow.spec.ts` — contact page form fields and submit-button disabled state

### `tests/generated/`

Machine-generated specs from the current requirement feed. They are intentionally generic and serve as a baseline structure to be reviewed and promoted. They are **off by default** in execute mode (`executeGenerated: false` in `test-config.json`).

### When to enable `executeGenerated`

Only enable `executeGenerated: true` after reviewing the generated specs and confirming the assertions are meaningful for your current test run. Do not enable it for CI until the generated specs have been promoted or manually refined.

---

## Reading run artifacts

After a full workflow run, `reports/latest/` contains:

| Artifact | What it tells you |
|---|---|
| `summary.json` | Pass/fail counts, run ID, config snapshot, defect list, execution command |
| `generated-cases.json` | All test cases that were generated from requirements |
| `requirements.json` | The exact requirements loaded for this run |
| `defects.json` | Draft Jira/GitHub defect payloads for failed tests |
| `playwright-report.json` | Raw Playwright JSON report — source of truth for pass/fail/flaky counts |
| `doctor.json` | Which preflight checks passed or failed |
| `security-posture.json` | Safe mode, redaction, and persistence flag values at run time |
| `test-cases.csv` | Generated test cases in CSV — importable into Zephyr or spreadsheets |
| `archive.json` | Run ID and path of the `reports/history/` snapshot for this run |

Open the HTML report for a visual breakdown:

```bash
npm run report:open
```

---

## Standard operating procedures

### Adding a new requirement

1. Open `config/requirements.sample.json` (or your active requirement source).
2. Add the new requirement object with a unique ID, title, source, priority, and at least one acceptance criterion.
3. Run `npm run workflow:plan` to preview what cases and specs will be generated.
4. Review `reports/latest/generated-cases.json` and `tests/generated/`.
5. Run `npm run workflow` for a full pass.
6. If the generated specs look correct and pass consistently, promote them to `tests/stable/`.

### Investigating a failing test

1. Open `reports/latest/summary.json` — look at `execution.failed` and `defects`.
2. Open `reports/latest/playwright-report.json` or run `npm run report:open` for the HTML view.
3. Check `reports/latest/evidence/` for failure screenshots.
4. Classify the failure:

| Label | When to use it |
|---|---|
| Product defect | Requirement is valid, test is valid, environment is healthy, failure reproduces |
| Flaky test | Outcome varies between runs — timing, selector, or environment sensitivity |
| Requirement drift | Application behavior changed; the test no longer reflects the expected contract |
| Environment issue | Base URL unreachable, browser launch failure, or CI infrastructure instability |
| Bad generated automation | Generated spec has incorrect assertions or brittle selectors |

5. Act on the classification: fix the test, update the requirement, or file a defect.

### Promoting a generated test to stable

Move a spec from `tests/generated/` to `tests/stable/` only after all of the following are true:

1. The requirement it covers is clearly defined.
2. The assertions reflect actual business behavior, not generic placeholders.
3. The selectors are resilient — prefer ARIA roles and labels over CSS chains.
4. The test passes consistently across at least three consecutive runs.
5. The coverage adds signal that does not already exist in the stable suite.

### When the application UI changes

1. Update requirements first if the business behavior changed.
2. Regenerate specs with `npm run workflow:generate` if acceptance criteria changed.
3. Manually refactor stable tests if selectors, headings, or navigation paths changed.
4. Re-run the full workflow and confirm all artifacts are clean.

---

## How to maintain this codebase

### Safe to change frequently

- `config/requirements.sample.json` — add, edit, or remove requirements
- `tests/generated/` — regenerated by the workflow; local edits will be overwritten
- `tests/stable/` — update selectors and assertions as the application evolves
- `agents/*.md` — role contracts for orchestration behaviors
- `skills/*.md` — operating rules for security, setup, teardown, etc.
- `docs/` — keep documentation current with workflow behavior

### Requires extra care

| File | Why |
|---|---|
| [src/types/contracts.ts](../src/types/contracts.ts) | Changes to interfaces affect every pipeline stage that reads or writes them |
| [src/core/executor.ts](../src/core/executor.ts) | Incorrect stat parsing will misreport pass/fail counts |
| [src/core/redaction.ts](../src/core/redaction.ts) | Gaps here can cause sensitive data to land in artifacts |
| [playwright.config.ts](../playwright.config.ts) | Affects all test execution — timeouts, retries, reporters |
| [src/cli/run-workflow.ts](../src/cli/run-workflow.ts) | The orchestration spine; keep it thin and sequential |

### Maintenance rules

1. Keep generated and stable tests conceptually separate. Do not blur the boundary.
2. Never put secrets, tokens, or PII into code, comments, or report data.
3. Prefer ARIA-role selectors over DOM structure in Playwright tests.
4. Treat a flaky test as an automation defect — do not increase retries to mask it.
5. Update docs whenever you change visible workflow behavior.
6. Run `npm run build && npm run lint` before every pull request.

---

## Code structure deep-dive

### `src/cli/run-workflow.ts`

The pipeline entrypoint. Reads the `--mode` argument, loads config, and calls each core module in order. It should remain a thin coordinator — business logic belongs in `src/core/`.

### `src/core/`

| Module | Responsibility |
|---|---|
| `config.ts` | Loads and validates `env.json`, `test-config.json`, and `secrets.json` into a `ResolvedConfig` |
| `preflight.ts` | Runs all doctor checks and returns a `DoctorReport` |
| `requirement-loader.ts` | Loads requirements from a local JSON file |
| `jira.ts` | Loads requirements from Jira search; creates Jira defects |
| `test-generator.ts` | Converts requirements into structured `GeneratedTestCase` objects |
| `spec-writer.ts` | Materializes test cases as Playwright `.spec.ts` files |
| `csv.ts` | Exports generated cases to a CSV file |
| `environment.ts` | HTTP GET to the base URL to confirm environment readiness |
| `executor.ts` | Spawns `npx playwright test`, reads the JSON report, returns pass/fail/flaky counts |
| `artifact-security.ts` | Redacts the Playwright JSON report in-place; copies screenshots to `evidence/`; removes raw outputs |
| `reporter.ts` | Writes `summary.json`, `generated-cases.json`, `requirements.json`, `defects.json`, `security-posture.json` |
| `archive.ts` | Copies all artifacts from `reports/latest/` to `reports/history/<runId>/` |
| `redaction.ts` | Pattern and field-based redaction applied to any string or object before persistence |
| `notifications.ts` | Builds the Slack payload and sends it via the configured webhook |

### `src/types/contracts.ts`

All shared TypeScript interfaces. The key ones to know:

| Interface | Used for |
|---|---|
| `Requirement` | Normalized requirement fed into the generator |
| `GeneratedTestCase` | One test case output from the generator |
| `ResolvedConfig` | Fully resolved config passed through the entire pipeline |
| `WorkflowSummary` | The top-level run result written to `summary.json` |
| `DefectDraft` | A failure payload suitable for Jira or GitHub issue creation |
| `DoctorReport` | Result of the preflight check |

Changing any of these interfaces is an architectural change — review all pipeline stages that read or write the affected type.

### `tests/support/site.ts`

Shared Playwright helpers used across the stable suite:

- `gotoPublicPage(page, path)` — navigates to a path and confirms the body is visible
- `mainNav(page)` — returns the main navigation locator
- `expectMainNavigation(page)` — asserts that Products, Blog, and Contact links are visible

Import these instead of duplicating navigation logic in individual specs.

---

## Troubleshooting

### `npm install` fails

- Confirm `node --version` is 22 or newer.
- Delete `node_modules/` and `package-lock.json`, then retry.
- Check for network or npm registry issues.

### `npx playwright install chromium` fails

- Confirm you have an internet connection.
- If behind a proxy, set `HTTPS_PROXY` before running.
- Check disk space.

### `workflow:doctor` reports the environment as not ready

- The base URL (`https://apercallc.com` by default) was not reachable at check time.
- If you are running locally without internet access or against a dev environment, override:
  ```bash
  APERCA_BASE_URL=http://localhost:3000 npm run workflow
  ```
- Or set `requireEnvironmentReady: false` in `test-config.json` temporarily.

### Playwright fails before tests start

- Run `npx playwright install chromium` to refresh the browser binary.
- Confirm the base URL is reachable.
- Confirm local security tooling (VPN, firewall, endpoint detection) is not blocking Chromium.

### Tests fail unexpectedly

- Open `npm run report:open` and inspect the failure detail and screenshots.
- Check `reports/latest/evidence/` for failure screenshots.
- Confirm the target site has not changed selectors or content.
- Run `npm run test:smoke` to isolate a basic Playwright health issue from a site issue.

### Workflow completes but `summary.json` looks wrong

- Inspect `reports/latest/playwright-report.json` directly — it is the source of truth.
- Confirm the file was written (it will be missing if Playwright exited before writing it).
- Re-run with a fresh `reports/latest/` directory: `npm run workflow` clears it automatically in execute mode.

### Generated tests are low quality

- The generator output quality is bounded by requirement quality. Improve acceptance criteria first.
- Tighten generation logic in [src/core/test-generator.ts](../src/core/test-generator.ts).
- Do not patch individual generated files — they will be overwritten on the next run. Extend the generator instead.

### ESLint or TypeScript errors after pulling changes

```bash
npm install          # pick up any new packages
npm run build        # re-check types
npm run lint         # re-check style
```

---

## Security expectations

Read [security-guardrails.md](../skills/security-guardrails.md) before wiring any external system.

Non-negotiable rules:

1. **Never commit `config/secrets.json`** — it is gitignored; treat any accidental commit as a credentials leak.
2. Never print credentials, tokens, cookies, or PII in logs, comments, code, or test output.
3. Use synthetic test data. Do not use production user records in automation.
4. Keep `safeMode: true` and `redactSensitiveData: true` in `test-config.json` unless you have an explicit operational reason to change them.
5. Run `npm run workflow:doctor` and review `security-posture.json` before any run involving external systems.
6. Clean up any transient test data after execution.

---

## First-week learning path

Follow this in order. Each step builds on the last.

1. Read [README.md](../README.md) for the project overview.
2. Complete the [first-time setup](#first-time-setup) steps above.
3. Run `npm run workflow:plan` and inspect `reports/latest/` and `tests/generated/`.
4. Run `npm run workflow:doctor` and understand the output.
5. Read [workflows/main.md](../workflows/main.md) to understand the full pipeline contract.
6. Read [docs/ARCHITECTURE.md](ARCHITECTURE.md) to understand the component model and data flow.
7. Run `npm run test:smoke` to confirm Playwright is working end to end.
8. Make a small change to `config/requirements.sample.json` — add a new acceptance criterion to an existing requirement — and run `npm run workflow:plan` again. Observe how the generated cases change.
9. Read [docs/OPERATIONS.md](OPERATIONS.md) for the operational discipline expected before making changes.
10. Read [docs/SECURITY.md](SECURITY.md) and [skills/security-guardrails.md](../skills/security-guardrails.md).
