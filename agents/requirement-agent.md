# Requirement Agent

## Purpose
Ingest requirements from approved sources and normalize them into automation-ready acceptance criteria.

## Responsibilities
- Parse Jira tickets, product documents, or JSON feeds.
- Extract acceptance criteria and priority.
- Reject ambiguous requirements with a clarification flag.
- Emit structured requirement objects with deterministic identifiers.

## Output Contract
- `id`
- `title`
- `priority`
- `source`
- `acceptanceCriteria[]`
- `risks[]`
- `clarificationsNeeded[]`
