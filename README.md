# Aperca Test Automation Orchestrator

Production-grade, AI-assisted QA orchestration framework for `ApercaLLC.com`. Turns requirement input into generated Playwright tests, executes them, captures artifacts, and drafts defect payloads — all in a single composable workflow.

---

## What is included

| Layer | What it does |
|---|---|
| CLI orchestrator | Drives the full pipeline from a single `npm run workflow` command |
| Requirement intake | Loads requirements from a local JSON file or Jira search |
| Test-case generator | Produces positive, negative, and edge cases from acceptance criteria |
| Spec writer | Materializes test cases into Playwright spec files in `tests/generated/` |
| Playwright runner | Executes stable and generated suites with configurable workers and retries |
| Artifact engine | Writes JSON and CSV outputs, redacts sensitive data, archives history |
| Defect drafting | Builds draft defect payloads linked to failures for Jira or GitHub |
| Notifications | Sends Slack summaries on execute-mode completions |
| Doctor command | Validates all configuration, credentials, and integration readiness |

---

## Quick start

```bash
# 1. Install dependencies and Playwright browser
npm install
npx playwright install chromium

# 2. Copy the secrets template and fill in your credentials
cp config/secrets.example.json config/secrets.json

# 3. Validate your configuration
npm run workflow:doctor

# 4. Preview generation without running tests
npm run workflow:plan

# 5. Run the full pipeline
npm run workflow
```

---

## Project structure

```text
Aperca-test-automation/
├── agents/                  # Markdown role contracts for each orchestration agent
├── config/
│   ├── env.json             # Environment targets and browser defaults
│   ├── test-config.json     # Parallelization, retries, timeouts, artifact flags
│   ├── secrets.example.json # Template — copy to secrets.json and fill in values
│   └── requirements.sample.json  # Sample requirement feed
├── docs/                    # Architecture, operations, integrations, and security docs
├── reports/
│   ├── latest/              # Current run artifacts (gitignored except .gitkeep)
│   └── history/             # Archived run snapshots
├── scripts/
│   └── bootstrap.sh         # First-time setup script
├── skills/                  # Reusable operating rules (security, retry, data, etc.)
├── src/
│   ├── cli/run-workflow.ts  # Orchestration entrypoint
│   ├── core/                # Pipeline modules (generator, executor, reporter, etc.)
│   ├── types/contracts.ts   # Shared TypeScript interfaces
│   └── utils/fs.ts          # File system helpers
├── tests/
│   ├── generated/           # Machine-generated specs — review before promoting
│   ├── stable/              # Human-reviewed, production-trusted specs
│   └── support/site.ts      # Shared Playwright helpers
├── workflows/main.md        # End-to-end orchestration contract
├── .github/workflows/ci.yml # GitHub Actions CI pipeline
├── eslint.config.mjs
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Workflow modes

| Command | What it does |
|---|---|
| `npm run workflow:doctor` | Validates config, secrets, and integration readiness |
| `npm run workflow:plan` | Loads requirements and generates cases and specs — no test execution |
| `npm run workflow:generate` | Same as plan; explicitly writes fresh specs to `tests/generated/` |
| `npm run workflow` | Full pipeline: generate + execute + report + archive + notify |

---

## All available commands

```bash
npm run build            # Type-check and compile to dist/
npm run lint             # Run ESLint across all TypeScript files
npm run format           # Run Prettier across the repository
npm run test:smoke       # Fast smoke test — validates local Playwright health
npm run report:open      # Open the HTML Playwright report in a browser
npm run workflow:doctor  # Preflight validation
npm run workflow:plan    # Generate only, no execution
npm run workflow:generate  # Regenerate specs, no execution
npm run workflow         # Full pipeline (alias for --mode=execute)
```

---

## Configuration

### `config/env.json`

Defines named environments. The active environment is selected by the `APERCA_ENVIRONMENT` variable (defaults to `default`).

```json
{
  "default": { "name": "production", "baseUrl": "https://apercallc.com", ... },
  "staging": { "name": "staging",    "baseUrl": "https://staging.apercallc.com", ... }
}
```

### `config/test-config.json`

Controls execution behavior. Key flags:

| Field | Effect |
|---|---|
| `executeStable` | Include `tests/stable/` in execution |
| `executeGenerated` | Include `tests/generated/` in execution |
| `maxThreads` | Playwright worker count |
| `retryCount` | Max retries per failing test |
| `safeMode` | Reduces Slack payload detail and enforces redaction |
| `redactSensitiveData` | Sanitizes artifacts before writing |
| `persistRawArtifacts` | When `false`, removes `playwright-report/` and `test-results/` after execution |
| `createJiraDefects` | Automatically create Jira issues from failure drafts |
| `exportCsv` | Export generated test cases to `reports/latest/test-cases.csv` |
| `archiveHistory` | Copy run artifacts to `reports/history/<runId>/` |

### `config/secrets.json`

Local-only file (gitignored). Copy from `secrets.example.json` and populate:

- `jira.baseUrl`, `jira.email`, `jira.apiToken`, `jira.projectKey`
- `github.token`, `github.repository`
- `notifications.slack.webhookUrl`
- `apiKeys.openai` or `apiKeys.anthropic`

### Environment variable overrides

| Variable | Overrides |
|---|---|
| `APERCA_BASE_URL` | `env.json` base URL |
| `APERCA_ENVIRONMENT` | Active environment name (`default` or `staging`) |
| `APERCA_REQUIREMENTS_PATH` | Path to requirements JSON file |
| `APERCA_REQUIREMENTS_SOURCE` | `file` (default) or `jira` |
| `APERCA_JIRA_REQUIREMENTS_JQL` | JQL query used when source is `jira` |
| `APERCA_OUTPUT_DIR` | Output directory (defaults to `reports/latest`) |
| `APERCA_SLACK_WEBHOOK_URL` | Slack webhook (overrides secrets file) |

---

## Requirements format

Requirements are loaded from `config/requirements.sample.json` by default. Each entry must include:

```json
{
  "id": "APR-001",
  "title": "...",
  "source": "manual-seed",
  "priority": "high",
  "acceptanceCriteria": ["...", "..."]
}
```

Valid priorities: `low`, `medium`, `high`, `critical`.

To use Jira as the source:

```bash
APERCA_REQUIREMENTS_SOURCE=jira \
APERCA_JIRA_REQUIREMENTS_JQL="project = APR AND labels = qa-ready" \
npm run workflow
```

---

## Reporting artifacts

All artifacts land in `reports/latest/` after each run:

| File | Contents |
|---|---|
| `summary.json` | Top-level run result, execution counts, config snapshot |
| `generated-cases.json` | Structured test cases produced from requirements |
| `requirements.json` | Requirements snapshot used for this run |
| `defects.json` | Draft defect payloads for any failures |
| `playwright-report.json` | Machine-readable Playwright execution data |
| `doctor.json` | Preflight check results |
| `security-posture.json` | Active security flag snapshot |
| `test-cases.csv` | Generated cases in CSV format for Zephyr or similar tools |
| `archive.json` | Run ID and path of the archived history snapshot |

```bash
npm run report:open   # Open HTML report
```

When `archiveHistory` is enabled, a complete copy is written to `reports/history/<runId>/`.

---

## Documentation

| Document | Use it for |
|---|---|
| [New Hire Handbook](docs/new-hire-handbook.md) | Complete setup, daily operation, troubleshooting, and maintenance guide |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, trust boundaries, extension points |
| [Operations Runbook](docs/OPERATIONS.md) | Execution standards, CI discipline, incident response, release rules |
| [Integrations](docs/INTEGRATIONS.md) | Slack, Jira, GitHub, and LLM API key configuration |
| [Security](docs/SECURITY.md) | Data handling controls, redaction scope, operator rules |
| [Main Workflow](workflows/main.md) | End-to-end orchestration contract and pipeline stages |

---

## Security

- **Never** commit `config/secrets.json`.
- Keep `safeMode: true` and `redactSensitiveData: true` in `test-config.json`.
- Use synthetic test data. Do not place customer records in requirement files.
- Review [skills/security-guardrails.md](skills/security-guardrails.md) before wiring any external system.
- Run `npm run workflow:doctor` to verify your security posture before each non-trivial run.

---

## Recommended next extensions

1. Replace `config/requirements.sample.json` with live Jira ingestion via `APERCA_REQUIREMENTS_SOURCE=jira`.
2. Add page objects or domain-specific helpers in `tests/support/` for ApercaLLC.com flows.
3. Promote reviewed generated specs from `tests/generated/` to `tests/stable/` after validation.
4. Enable `createJiraDefects: true` in `test-config.json` once Jira credentials are configured.
5. Implement historical trend analysis over `reports/history/` snapshots.
