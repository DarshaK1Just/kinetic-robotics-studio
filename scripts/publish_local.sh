#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 build.py --output dist/index.html
python3 scripts/check_site.py dist
printf 'Built dist/index.html for publishing\n'
