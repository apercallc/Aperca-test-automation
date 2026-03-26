# Retry Strategy Skill

## Purpose
Detect flakes without masking real regressions.

## Rules
- Retry only after capturing first-failure artifacts.
- Mark tests flaky when outcomes differ between attempts.
- Keep original failure context in the final report.
