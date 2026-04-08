# Operations Runbook

## Purpose

This document is the operational standard for running and maintaining the Aperca Test Automation Orchestrator in a disciplined way. Use it when you are preparing changes, executing runs, handling failures, or supporting CI.

This file is stricter than the handbook. The handbook teaches the system. This runbook governs how to operate it safely.

## Operating principles

1. Test evidence is more important than assumptions.
2. Generated automation is provisional until reviewed.
3. Flaky tests are operational defects, not background noise.
4. Requirement drift must be surfaced, not silently patched around.
5. A passing pipeline with bad reporting is not acceptable.

## Ownership model

- QA automation owners
  Maintain workflow logic, generated coverage quality, Playwright reliability, and reporting integrity.
- Product or feature owners
  Clarify expected behavior, acceptance criteria, and requirement changes.
- Platform or DevOps owners
  Maintain CI runtime health, secrets distribution, and browser execution stability.

## Required local checks before merge

Run these from the project root:

```bash
npm install
npm run build
npm run lint
npx playwright install chromium
npm run workflow:plan
npm run workflow
```

Do not merge workflow, generator, execution, or reporting changes without running the full workflow locally unless the environment is unavailable and that exception is documented in the pull request.

## Required checks for specific change types

### If you changed `src/core/` or `src/cli/`

You must run:

```bash
npm run build
npm run lint
npm run workflow
```

### If you changed Playwright config or tests

You must run:

```bash
npm run test:smoke
npm run workflow
```

### If you changed requirements or generation rules

You must review:

- [generated-cases.json](../reports/latest/generated-cases.json)
- generated specs under `tests/generated/`
- [summary.json](../reports/latest/summary.json)

## Normal run procedure

### Local operator run

1. Pull the latest branch state.
2. Verify secrets are present in `config/secrets.json`.
3. Confirm the target environment and base URL.
4. Run `npm run workflow:plan` for requirement and generation review when inputs changed.
5. Run `npm run workflow`.
6. Review artifacts before declaring success.

### CI run expectation

The GitHub Actions workflow at [ci.yml](../.github/workflows/ci.yml) should:

1. Install dependencies.
2. Install Playwright browser runtime.
3. Run the orchestrator in execute mode.
4. Upload HTML and JSON artifacts even on failure.

If CI does not upload artifacts on failure, treat that as an operational defect.

## Release and rollout rules

### Before changing execution behavior

Examples:

- worker counts
- retry logic
- timeouts
- artifact locations
- report parsing

Required actions:

1. Explain the change in the pull request.
2. Run a full local workflow.
3. Verify [playwright-report.json](../reports/latest/playwright-report.json) and [summary.json](../reports/latest/summary.json) still agree.
4. Check that HTML report generation still works with `npm run report:open`.

### Before adding a new external integration

Examples:

- Jira ingestion
- defect filing
- Slack notifications
- data factory services

Required actions:

1. Document required secrets in `config/secrets.example.json`.
2. Update [security-guardrails.md](../skills/security-guardrails.md) if data handling changes.
3. Add failure behavior documentation to this file.
4. Ensure failures degrade safely and do not block artifact writing.

## Incident response

### Severity guide

- Sev 1
  The framework produces materially false results, blocks all execution, or leaks sensitive data.
- Sev 2
  The framework runs but key outputs are incomplete, misleading, or highly unstable.
- Sev 3
  Non-critical workflow features fail, but core test execution and reporting still function.

### First response checklist

1. Freeze further assumptions.
2. Identify the exact failing layer:
   - environment
   - requirement input
   - generation
   - spec writing
   - Playwright execution
   - report parsing
   - artifact persistence
3. Preserve evidence from `reports/latest/`.
4. Determine whether results are trustworthy enough to act on.
5. If trust is compromised, mark the run invalid.

### Evidence to capture

- [summary.json](../reports/latest/summary.json)
- [playwright-report.json](../reports/latest/playwright-report.json)
- HTML report output
- CLI stderr and stdout from the failing run
- changed requirement input
- changed config values

## Failure classification rules

### Product defect

Use this label only when:

1. The requirement is still valid.
2. The test is valid.
3. The environment is healthy.
4. The failure reproduces with credible evidence.

### Flaky test

Use this label when:

1. Outcomes vary across retries or repeated runs.
2. There is timing, selector, or environment sensitivity.
3. The product behavior cannot be shown as consistently broken.

### Requirement drift

Use this label when:

1. The application behavior changed intentionally or ambiguously.
2. The existing test no longer reflects the expected contract.
3. Product or feature ownership must clarify the new expectation.

### Environment issue

Use this label when:

1. Browser launch fails.
2. Base URL is unavailable.
3. Authentication or dependency setup is broken.
4. Local or CI infrastructure is unstable.

## Rollback posture

Rollback is preferred when:

1. Reporting accuracy is in doubt.
2. CI is failing due to orchestration changes rather than product regressions.
3. Sensitive data handling is uncertain.

Do not keep a “temporary” broken reporting path in `main`. If the orchestrator cannot be trusted, revert or disable the risky change quickly.

## Routine maintenance checklist

### Daily or per active work session

1. Check whether target environment URLs changed.
2. Review recent failures for repeat flake patterns.
3. Confirm `reports/latest/` is being refreshed correctly.

### Weekly

1. Review stable tests for obsolete selectors or duplicated intent.
2. Review generated tests for promotion candidates.
3. Review retry and timeout values in [test-config.json](../config/test-config.json).
4. Review CI artifact health.

### Monthly

1. Review dependency freshness.
2. Reassess Playwright version compatibility.
3. Review documentation for drift against actual workflow behavior.
4. Review external integrations for secret hygiene and failure handling.

## Merge review checklist

Before approving changes, confirm:

1. The change has a clear reason.
2. Docs were updated if operator behavior changed.
3. Local verification was run or a clear reason was given.
4. Report outputs remain machine-readable and accurate.
5. New tests add coverage instead of noise.

## Dangerous patterns

Do not allow these without challenge:

1. Retrying failures more times to hide instability.
2. Editing stable tests to match unclear product behavior without requirement updates.
3. Parsing console text when a structured report exists.
4. Logging credentials, session tokens, or private user data.
5. Accepting generated tests without review.

## Escalation rules

Escalate to product ownership when:

1. Expected behavior is unclear.
2. Acceptance criteria conflict with observed behavior.
3. The automation team cannot determine whether a failure is a product bug or requirement drift.

Escalate to platform or DevOps when:

1. CI environment is unstable.
2. Browser runtime setup breaks repeatedly.
3. Artifact retention or upload fails.

Escalate to security when:

1. Sensitive data may have been logged or stored.
2. A new integration expands the trust boundary.

## Command reference

```bash
npm run build
npm run lint
npm run workflow:plan
npm run workflow:generate
npm run workflow
npm run test:smoke
npm run report:open
```

## Final rule

If the framework gives a clean green signal, an operator should be able to explain why it is green and point to the artifacts that support that claim. If they cannot, the job is not actually done.
