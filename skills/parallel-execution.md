# Parallel Execution Skill

## Purpose
Accelerate feedback while maintaining isolation.

## Rules
- Respect configured worker count.
- Avoid shared mutable state between tests.
- Segment data by worker or run identifier.
