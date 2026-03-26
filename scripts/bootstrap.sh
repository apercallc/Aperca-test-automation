#!/usr/bin/env bash
set -euo pipefail

npm install
npx playwright install chromium
npm run workflow:plan
