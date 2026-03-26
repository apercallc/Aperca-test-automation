# Main Workflow

## Objective
Operate as an autonomous QA orchestration layer for ApercaLLC.com by converting incoming requirements into maintained, executable Playwright coverage and decision-ready reports.

## Pipeline
1. Load environment, execution settings, and requirements.
2. Normalize requirements into structured acceptance criteria.
3. Generate positive, negative, and edge-case test cases.
4. Materialize executable Playwright tests into `tests/generated/`.
5. Execute stable and generated suites with retries and optional flake detection.
6. Analyze failures and classify as test issue, product defect, or requirement drift.
7. Produce report artifacts and defect payloads.
8. Promote proven generated tests into `tests/stable/` after review.

## Guardrails
- Never log credentials, tokens, or secrets.
- Treat requirement changes as first-class signals, not silent failures.
- Capture screenshots and traces for failures when available.
- Preserve generated artifacts under `reports/latest/` and archive snapshots to `reports/history/`.
- Cleanup generated test data after execution.

## Inputs
- `config/env.json`
- `config/test-config.json`
- `config/secrets.json`
- Requirement sources such as Jira exports or `config/requirements.sample.json`

## Outputs
- Generated tests under `tests/generated/`
- Execution artifacts under `reports/latest/`
- Human-readable summary in `reports/latest/summary.json`
- Defect drafts in `reports/latest/defects.json`
