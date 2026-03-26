# CLI Runner Skill

## Purpose
Execute local automation commands and return structured results.

## Input
- Command
- Environment name
- Timeout

## Output
- Exit code
- Standard output
- Standard error
- Execution duration

## Rules
- Fail on non-zero exit unless explicitly in diagnostic mode.
- Capture both stdout and stderr.
- Redact secrets before persistence.
