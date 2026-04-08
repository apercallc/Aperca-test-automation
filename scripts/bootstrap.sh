#!/usr/bin/env bash
# bootstrap.sh — First-time setup for the Aperca Test Automation Orchestrator.
# Run this once after cloning the repository.
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> Installing npm dependencies..."
npm install

echo "==> Installing Playwright browser runtime..."
npx playwright install chromium

echo "==> Copying secrets template..."
if [[ ! -f config/secrets.json ]]; then
  cp config/secrets.example.json config/secrets.json
  echo "    Created config/secrets.json — fill in your credentials before running integrations."
else
  echo "    config/secrets.json already exists, skipping."
fi

echo "==> Running doctor check..."
npm run workflow:doctor || true

echo ""
echo "Bootstrap complete. Next steps:"
echo "  1. Edit config/secrets.json with your Jira, Slack, and GitHub credentials."
echo "  2. Run: npm run workflow:plan"
echo "  3. Run: npm run workflow"
