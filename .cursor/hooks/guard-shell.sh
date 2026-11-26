#!/usr/bin/env bash
# beforeShellExecution: deny high-risk shell commands.
# Input JSON: { "command": "..." }
# Output JSON: { "permission": "allow"|"deny", "user_message"?, "agent_message"? }
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo '{"permission":"deny","user_message":"jq is required for shell guards but is not installed.","agent_message":"Install jq, then retry. Run the doctor skill to verify."}'
  exit 0
fi

input=$(cat || true)
if ! echo "$input" | jq -e . >/dev/null 2>&1; then
  echo '{"permission":"deny","user_message":"Shell guard received malformed JSON.","agent_message":"Hook input was not valid JSON. Do not retry the same command; ask the user."}'
  exit 0
fi

command=$(echo "$input" | jq -r '.command // empty')
if [[ -z "$command" ]]; then
  echo '{"permission":"deny","user_message":"Shell guard: missing command field.","agent_message":"beforeShellExecution input lacked command."}'
  exit 0
fi

deny_reason=""

# Force push (--force / -f)
if echo "$command" | grep -Eiq '(^|[[:space:];|&])git[[:space:]]+push[[:space:]].*(--force|-f)([[:space:]|&;]|$)'; then
  deny_reason="Blocked force-push. Use a normal push, or ask the user to force-push themselves."
fi

# Force push via +refspec (git push origin +main)
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq '(^|[[:space:];|&])git[[:space:]]+push[[:space:]].*\+[A-Za-z0-9._/-]+'; then
  deny_reason="Blocked force-push (+refspec). Use a normal push, or ask the user to force-push themselves."
fi

# Hard reset / destructive git
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq '(^|[[:space:];|&])git[[:space:]]+reset[[:space:]]+--hard'; then
  deny_reason="Blocked git reset --hard. Prefer a soft/mixed reset or ask the user."
fi
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq '(^|[[:space:];|&])git[[:space:]]+clean[[:space:]]+.*-[a-zA-Z]*f'; then
  deny_reason="Blocked git clean -f. Ask the user before deleting untracked files."
fi

# Skip hooks / skip GPG
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq '(^|[[:space:];|&])git[[:space:]]+commit[[:space:]].*(--no-verify|--no-gpg-sign)'; then
  deny_reason="Blocked commit that skips hooks or GPG signing."
fi

# Explicit secret-dump forms only (no bare trailing "env")
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq \
  'aws[[:space:]]+configure[[:space:]]+get|'\
'(^|[[:space:];|&])cat[[:space:]]+[^|;]*\.env($|[[:space:]])|'\
'(^|[[:space:];|&])cat[[:space:]]+[^|;]*\.env\.[^|;[:space:]]+|'\
'curl[[:space:]].*hooks\.slack'; then
  # Allow .env.example
  if ! echo "$command" | grep -Eiq '\.env\.example'; then
    deny_reason="Blocked command that may expose secrets or credentials."
  fi
fi

# Dangerous rm of home/root (allow /tmp and other absolute project paths)
if [[ -z "$deny_reason" ]] && echo "$command" | grep -Eiq \
  '(^|[[:space:];|&])rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-rf|-fr)[[:space:]]+(/($|[[:space:];|&])|/\*|~(/|$)|\$HOME(/|$)|/home/|/Users/)'; then
  deny_reason="Blocked recursive delete of a home or root path."
fi

if [[ -n "$deny_reason" ]]; then
  jq -n \
    --arg um "$deny_reason" \
    --arg am "$deny_reason" \
    '{permission:"deny", user_message:$um, agent_message:$am}'
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
