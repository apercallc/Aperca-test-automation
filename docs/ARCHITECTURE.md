# Architecture

## Purpose

This document explains how the Aperca Test Automation Orchestrator is designed, how data moves through it, where the boundaries are, and where future engineers should extend it.

Use this document when you need to make structural changes, add integrations, or reason about the consequences of modifying the workflow.

## System summary

The orchestrator is a TypeScript-based QA pipeline that turns requirement inputs into generated Playwright tests, executes those tests, and emits artifacts for reporting and defect triage.

At a high level, the system is built around four layers:

1. Input and configuration
2. Generation pipeline
3. Test execution
4. Reporting and operational outputs

## Design goals

The current architecture is built around these goals:

1. Keep the workflow understandable end to end.
2. Separate requirement interpretation from test execution.
3. Keep generated outputs inspectable on disk.
4. Prefer structured machine-readable artifacts over console parsing.
5. Leave clear extension points for external systems.

## Current component model

### 1. CLI orchestration layer

The entrypoint is [run-workflow.ts](../src/cli/run-workflow.ts).

Responsibilities:

- determine workflow mode
- resolve project root
- load requirements
- generate test cases
- write generated specs
- execute Playwright when requested
- write final artifacts

This file is the orchestration spine. It should remain thin. Business logic belongs in `src/core/`.

### 2. Requirement ingestion layer

The current loader is [requirement-loader.ts](../src/core/requirement-loader.ts).

Responsibilities:

- load requirement input from a configured file path
- deserialize JSON into the internal requirement contract

Current state:

- local JSON input only
- no validation beyond TypeScript assumptions at runtime
- no external connectors yet

Expected future extensions:

- Jira ingestion
- ticket or document parsing
- schema validation
- change tracking between requirement versions

### 3. Test case generation layer

The current generator is [test-generator.ts](../src/core/test-generator.ts).

Responsibilities:

- transform requirements into structured positive, negative, and edge test cases
- attach requirement IDs and metadata
- maintain deterministic output contracts

Current behavior:

- generates generic coverage templates from requirement acceptance criteria
- favors predictable output over sophisticated domain intelligence

Architectural note:

This layer is where most future product intelligence should live. If the team wants better business-aware coverage, this is the first place to invest.

### 4. Spec materialization layer

The current writer is [spec-writer.ts](../src/core/spec-writer.ts).

Responsibilities:

- convert structured test cases into Playwright spec files
- write them into `tests/generated/`

Current behavior:

- emits simple, generic Playwright specs
- uses homepage navigation as the default path
- keeps generation deterministic and reviewable

Architectural limitation:

This is not yet a page-object or domain-specific automation generator. It is a safe baseline, not a mature autonomous authoring engine.

### 5. Execution layer

The runner is [executor.ts](../src/core/executor.ts).

Responsibilities:

- invoke Playwright CLI
- collect stdout and stderr
- read Playwright JSON output
- calculate pass, fail, and flaky counts

Important design choice:

Execution summary is derived from Playwright’s JSON report, not inferred from console text. This makes reporting more reliable and reduces false interpretation.

### 6. Reporting layer

The current reporting logic is [reporter.ts](../src/core/reporter.ts).

Responsibilities:

- write summary artifacts
- persist requirement and generated case snapshots
- draft defect payloads when failures exist

Current outputs:

- `reports/latest/summary.json`
- `reports/latest/generated-cases.json`
- `reports/latest/requirements.json`
- `reports/latest/defects.json`
- `reports/latest/playwright-report.json`

## Data flow

The current pipeline is linear and disk-backed.

```text
Requirement Input
  -> Requirement Loader
  -> Test Case Generator
  -> Spec Writer
  -> Playwright Execution
  -> Report Reader
  -> Summary + Defect Drafts
```

### Step-by-step flow

1. Requirement input is read from `config/requirements.sample.json` or the path defined by `APERCA_REQUIREMENTS_PATH`.
2. Requirements are converted into the internal `Requirement` contract defined in [contracts.ts](../src/types/contracts.ts).
3. Test cases are created in memory.
4. Generated specs are written to `tests/generated/`.
5. If the mode is `execute`, Playwright runs against all tests in `tests/`.
6. Playwright writes machine-readable report data.
7. The orchestrator reads those results and writes orchestration artifacts into `reports/latest/`.

## Workflow modes and control flow

Supported modes are implemented in [run-workflow.ts](../src/cli/run-workflow.ts):

- `plan`
  Generate cases and specs, but do not execute Playwright.
- `generate`
  Same current data path as plan, intended as an explicit spec-generation mode.
- `execute`
  Run the full pipeline including Playwright execution.

Architectural note:

Today, both `plan` and `generate` write generated specs. That is acceptable for the current baseline, but future refinement may separate planning from file materialization if the team needs a true dry-run mode.

## Contracts and schemas

The internal contracts live in [contracts.ts](../src/types/contracts.ts).

Key contracts:

- `Requirement`
- `GeneratedTestCase`
- `WorkflowSummary`
- `DefectDraft`

Design rule:

When changing these contracts, review every pipeline stage that reads or writes them. Contract changes are architectural changes, not local edits.

## Storage model

The system currently uses the local filesystem as its shared state layer.

### Source-of-truth directories

- `config/`
  Configuration and seed inputs
- `tests/generated/`
  generated automation output
- `tests/stable/`
  reviewed automation assets
- `reports/latest/`
  current run state
- `reports/history/`
  intended archival location

### Why local disk is used

1. Easy inspection
2. Low operational complexity
3. Good fit for CI artifact upload
4. Easy debugging during early platform maturity

### Limitation

This approach is simple, but not ideal for concurrent distributed orchestration. If the system evolves into a multi-runner service, artifact and state storage should move to a more explicit persistence layer.

## Trust boundaries

### Boundary 1: requirement input

Requirement data may come from humans or external systems and must not be assumed to be complete or unambiguous.

### Boundary 2: generated automation

Generated tests are output of logic, not automatically trusted truth. They require review before being treated as stable assets.

### Boundary 3: target environment

The application under test may be unstable, unavailable, or behave differently across environments.

### Boundary 4: artifact interpretation

Operational decisions depend on report accuracy. Incorrect parsing or stale artifacts can lead to false conclusions.

## Extension points

These are the main places to extend the system safely.

### External requirement sources

Extend [requirement-loader.ts](../src/core/requirement-loader.ts) to support:

- Jira
- product specs
- CSV feeds
- internal APIs

Add schema validation before those sources are trusted.

### Smarter test generation

Extend [test-generator.ts](../src/core/test-generator.ts) to:

- use richer requirement semantics
- infer business flows
- generate higher quality preconditions and assertions
- reduce duplicate case intent

### Domain-aware automation generation

Extend [spec-writer.ts](../src/core/spec-writer.ts) or replace it with a layered generator that understands:

- shared fixtures
- page models
- reusable selectors
- authenticated workflows
- test data setup hooks

### Failure classification and defect creation

Extend [reporter.ts](../src/core/reporter.ts) to:

- classify likely root cause
- enrich defect payloads
- integrate with Jira or GitHub
- attach screenshots and traces

### Historical reporting

Extend artifact persistence so each run is archived into `reports/history/` with stable run IDs and trend-friendly metadata.

## Non-goals of the current version

The current baseline does not yet provide:

1. real Jira ingestion
2. automatic stable-test promotion
3. advanced self-healing selectors
4. visual regression testing
5. authenticated multi-role workflows
6. distributed execution across remote agents

These are reasonable future features, but they should not be assumed to exist.

## Key architectural risks

### Risk 1: weak requirement quality

Bad inputs produce weak generated coverage. This is a structural limitation, not just a tuning issue.

### Risk 2: generated spec simplicity

The current generator writes generic tests. Without domain logic, it cannot produce deep product coverage.

### Risk 3: local filesystem coupling

A disk-backed workflow is easy to inspect, but it is not ideal for more advanced orchestration or high concurrency.

### Risk 4: artifact freshness

If old artifacts are mistaken for new ones, reporting can be misleading. Operational discipline matters here.

## Recommended future evolution

### Near term

1. Add schema validation for requirement inputs.
2. Add archiving into `reports/history/`.
3. Add better summary fields such as skipped counts and environment metadata.
4. Add domain-aware generated assertions for ApercaLLC.com pages.

### Medium term

1. Add Jira requirement ingestion.
2. Add defect filing integration.
3. Add page-object or fixture abstraction for stable suites.
4. Add true flake detection with repeated runs.

### Longer term

1. Add historical trend analysis.
2. Add selector resilience and self-healing strategies.
3. Add service-mode orchestration for multiple targets or schedules.

## Reading order for engineers making major changes

1. Read [README.md](../README.md).
2. Read [new-hire-handbook.md](new-hire-handbook.md).
3. Read [OPERATIONS.md](OPERATIONS.md).
4. Read [main.md](../workflows/main.md).
5. Read [run-workflow.ts](../src/cli/run-workflow.ts).
6. Read the files in `src/core/`.

## Final architectural rule

Keep the workflow explicit. If a future change makes the system harder to inspect, harder to trust, or harder to recover during failures, it needs stronger justification than “it is more automated.”
