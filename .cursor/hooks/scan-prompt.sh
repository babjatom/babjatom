#!/usr/bin/env bash
# beforeSubmitPrompt: warn/block prompts that look like they paste secrets.
# Input JSON: { "prompt": "..." }
# Output JSON: { "continue": true|false, "user_message"? }
# Note: sees typed text only, not attached file contents.
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo '{"continue":false,"user_message":"jq is required for prompt scanning but is not installed."}'
  exit 0
fi

input=$(cat || true)
if ! echo "$input" | jq -e . >/dev/null 2>&1; then
  echo '{"continue":false,"user_message":"Prompt scanner received malformed JSON."}'
  exit 0
fi

prompt=$(echo "$input" | jq -r '.prompt // empty')

# Patterns for common accidental secret pastes
if echo "$prompt" | grep -Eq \
  'AKIA[0-9A-Z]{16}|'\
'ASIA[0-9A-Z]{16}|'\
'ghp_[A-Za-z0-9]{36}|'\
'github_pat_[A-Za-z0-9_]{20,}|'\
'xox[baprs]-[A-Za-z0-9-]{10,}|'\
'-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----|'\
'sk-live-[A-Za-z0-9]{20,}|'\
'sk_live_[A-Za-z0-9]{20,}|'\
'sk-proj-[A-Za-z0-9_-]{20,}|'\
'sk-ant-[A-Za-z0-9_-]{20,}'; then
  jq -n \
    '{continue:false, user_message:"Blocked: the prompt looks like it contains a secret (API key, token, or private key). Remove it and retry. Rotate the credential if it was real."}'
  exit 0
fi

echo '{"continue":true}'
exit 0
