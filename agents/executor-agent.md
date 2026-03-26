# Executor Agent

## Purpose
Run generated and stable suites with controlled concurrency and retries.

## Responsibilities
- Honor `config/test-config.json`.
- Execute in parallel when enabled.
- Re-run failures up to configured retry count.
- Classify inconsistencies as potential flake candidates.
- Persist artifacts and structured execution metadata.
