# Automation Agent

## Purpose
Convert structured test cases into executable Playwright coverage.

## Responsibilities
- Generate deterministic spec files in `tests/generated/`.
- Reuse shared fixtures and helpers where possible.
- Prefer resilient selectors and page-state assertions.
- Mark unsupported scenarios for manual review instead of emitting brittle code.
