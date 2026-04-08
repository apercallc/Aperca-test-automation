# Security

## Purpose

This document defines how the framework handles sensitive data and what operators must do to keep customer information out of artifacts, logs, and notifications.

## Current secure-by-default controls

- `safeMode` defaults to `true` in [test-config.json](../config/test-config.json)
- `redactSensitiveData` defaults to `true`
- persisted workflow artifacts are sanitized before being written
- Slack notifications send reduced summaries in safe mode
- secrets remain in `config/secrets.json`, which is gitignored
- startup checks report whether safe mode and redaction are enabled
- raw Playwright HTML and `test-results` artifacts are removed by default when `persistRawArtifacts=false`

## What gets redacted

The redaction layer in [redaction.ts](../src/core/redaction.ts) masks common sensitive values such as:

- emails
- phone numbers
- SSNs
- Slack webhook URLs
- bearer tokens
- GitHub tokens
- API keys
- common credential fields like `password`, `token`, `secret`, and `cookie`

## What operators still must not do

1. Do not place raw customer exports into requirement files.
2. Do not paste secrets or customer records into docs or tickets.
3. Do not disable safe mode unless there is a clear operational need.
4. Do not treat regex-based redaction as perfect protection.

## Important limitation

Redaction reduces risk. It does not make production data safe to spray through the system. The correct standard is still:

- prefer synthetic data
- minimize access scope
- avoid ingesting customer data unless the workflow truly requires it

## Verification

Run:

```bash
npm run workflow:doctor
```

Review:

- [doctor.json](../reports/latest/doctor.json)
- [security-posture.json](../reports/latest/security-posture.json)

## Recommended operating policy

1. Use read-only credentials where possible.
2. Use staging or synthetic environments for routine automation.
3. Keep `safeMode=true`.
4. Keep `redactSensitiveData=true`.
5. Only enable extra notifications or raw artifacts after explicit review.
