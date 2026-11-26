#!/usr/bin/env bash
# beforeReadFile: deny reads of secret-looking files.
# Input JSON: { "file_path": "..." }
# Output JSON: { "permission": "allow"|"deny" }
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo '{"permission":"deny"}'
  exit 0
fi

input=$(cat || true)
if ! echo "$input" | jq -e . >/dev/null 2>&1; then
  echo '{"permission":"deny"}'
  exit 0
fi

file_path=$(echo "$input" | jq -r '.file_path // empty')
if [[ -z "$file_path" ]]; then
  echo '{"permission":"deny"}'
  exit 0
fi

base=$(basename "$file_path")
lower=$(echo "$file_path" | tr '[:upper:]' '[:lower:]')

deny=0

# Dotenv and common secret filenames (allow .env.example / *.example)
if [[ "$base" == ".env" || "$base" == .env.* ]]; then
  if [[ "$base" != ".env.example" && "$base" != *.example ]]; then
    deny=1
  fi
fi

case "$base" in
  .npmrc|.netrc|id_rsa|id_ed25519|id_ecdsa|*.pem|*.p12|*.pfx|*.key|credentials.json|service-account*.json|*.keystore)
    deny=1
    ;;
esac

# Paths that often hold secrets
if echo "$lower" | grep -Eq '/(\.ssh|secrets?|credentials?)/'; then
  if [[ "$base" != *.example && "$base" != *.md && "$base" != *.mdc ]]; then
    deny=1
  fi
fi

if [[ "$deny" -eq 1 ]]; then
  echo '{"permission":"deny"}'
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
