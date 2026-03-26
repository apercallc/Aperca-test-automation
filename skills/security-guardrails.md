# Security Guardrails Skill

## Purpose
Protect sensitive data during automated QA execution.

## Rules
- Never store secrets in source control.
- Mask access tokens, passwords, cookies, and PII in logs.
- Prefer environment-specific configuration files and runtime injection.
- Delete transient data after execution.
- Default to safe mode and sanitized reporting.
- Send only minimal summaries to external systems such as Slack.
- Do not place raw customer records in requirements, reports, or defect drafts.
