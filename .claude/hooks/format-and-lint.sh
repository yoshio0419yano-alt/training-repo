#!/usr/bin/env bash
# PostToolUse hook for Write|Edit: formats and lints the file Claude just wrote.
set -u

input=$(cat)
file=$(printf '%s' "$input" | python -c "
import json, sys
d = json.load(sys.stdin)
f = d.get('tool_input', {}).get('file_path') or d.get('tool_response', {}).get('filePath') or ''
print(f)
" 2>/dev/null)

if [ -z "$file" ] || [ ! -f "$file" ]; then
  exit 0
fi

case "$file" in
  *.ts|*.tsx|*.js|*.jsx)
    npx prettier --write "$file" >/dev/null 2>&1
    npx eslint --fix "$file" >/dev/null 2>&1
    ;;
esac

exit 0
