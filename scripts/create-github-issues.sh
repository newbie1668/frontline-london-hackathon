#!/usr/bin/env bash
set -euo pipefail

# Run from repo root after `gh repo create` / remote is set.
# Creates label `agent` and opens issues 1–7 from docs/issues/.

cd "$(dirname "$0")/.."

gh label create agent --description "Saturday execution" --color "C45C26" 2>/dev/null || true

for f in docs/issues/*.md; do
  title="$(sed -n 's/^# //p' "$f" | head -n 1)"
  gh issue create --title "$title" --label agent --body-file "$f"
done
