#!/usr/bin/env bash
# afterFileEdit: auto-format if a known formatter is available.
# Input JSON: { "file_path": "..." }
# Fails open: missing jq, bad JSON, or no formatter → exit 0 quietly.
set +e

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

input=$(cat || true)
if ! echo "$input" | jq -e . >/dev/null 2>&1; then
  exit 0
fi

file_path=$(echo "$input" | jq -r '.file_path // empty')
if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

ext="${file_path##*.}"
base=$(basename "$file_path")

format_with_prettier() {
  if command -v npx >/dev/null 2>&1; then
    npx --yes prettier --write "$file_path" >/dev/null 2>&1
  elif command -v prettier >/dev/null 2>&1; then
    prettier --write "$file_path" >/dev/null 2>&1
  else
    return 1
  fi
}

case "$ext" in
  js|jsx|ts|tsx|mjs|cjs|json|css|scss|html|md|yml|yaml)
    format_with_prettier || true
    ;;
  py)
    if command -v ruff >/dev/null 2>&1; then
      ruff format "$file_path" >/dev/null 2>&1
    elif command -v black >/dev/null 2>&1; then
      black -q "$file_path" >/dev/null 2>&1
    fi
    ;;
  go)
    if command -v gofmt >/dev/null 2>&1; then
      gofmt -w "$file_path" >/dev/null 2>&1
    fi
    ;;
  *)
    # No formatter for this type
    ;;
esac

# Also try prettier for package/config files without clear extensions
case "$base" in
  package.json|.prettierrc|.eslintrc.json)
    format_with_prettier || true
    ;;
esac

exit 0
