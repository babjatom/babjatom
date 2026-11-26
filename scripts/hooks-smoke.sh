#!/usr/bin/env bash
# Fixture tests for project security hooks. Exit non-zero on any failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SHELL_HOOK="$ROOT/.cursor/hooks/guard-shell.sh"
READ_HOOK="$ROOT/.cursor/hooks/guard-reads.sh"
PROMPT_HOOK="$ROOT/.cursor/hooks/scan-prompt.sh"
FORMAT_HOOK="$ROOT/.cursor/hooks/format.sh"

pass=0
fail=0

need_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "FAIL: jq is required" >&2
    exit 1
  fi
}

assert_json_field() {
  local name="$1"
  local json="$2"
  local field="$3"
  local expected="$4"
  local actual
  actual=$(echo "$json" | jq -r "$field")
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS: $name"
    pass=$((pass + 1))
  else
    echo "FAIL: $name (expected $field=$expected, got $actual)" >&2
    echo "  json: $json" >&2
    fail=$((fail + 1))
  fi
}

assert_exit0() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS: $name"
    pass=$((pass + 1))
  else
    echo "FAIL: $name (nonzero exit)" >&2
    fail=$((fail + 1))
  fi
}

need_jq

for f in "$SHELL_HOOK" "$READ_HOOK" "$PROMPT_HOOK" "$FORMAT_HOOK"; do
  if [[ ! -f "$f" ]]; then
    echo "FAIL: missing hook script $f" >&2
    exit 1
  fi
done

out=$(echo '{"command":"echo hello"}' | bash "$SHELL_HOOK")
assert_json_field "shell allow echo" "$out" '.permission' 'allow'

out=$(echo '{"command":"ls myenv"}' | bash "$SHELL_HOOK")
assert_json_field "shell allow ls myenv" "$out" '.permission' 'allow'

out=$(echo '{"command":"git push --force origin main"}' | bash "$SHELL_HOOK")
assert_json_field "shell deny force-push" "$out" '.permission' 'deny'

out=$(echo '{"command":"git push origin +main"}' | bash "$SHELL_HOOK")
assert_json_field "shell deny +refspec" "$out" '.permission' 'deny'

out=$(echo 'not-json' | bash "$SHELL_HOOK")
assert_json_field "shell deny malformed" "$out" '.permission' 'deny'

out=$(echo '{"file_path":".env"}' | bash "$READ_HOOK")
assert_json_field "reads deny .env" "$out" '.permission' 'deny'

out=$(echo '{"file_path":"README.md"}' | bash "$READ_HOOK")
assert_json_field "reads allow README" "$out" '.permission' 'allow'

out=$(echo '{"file_path":".npmrc"}' | bash "$READ_HOOK")
assert_json_field "reads deny .npmrc" "$out" '.permission' 'deny'

out=$(echo '{"prompt":"deploy with AKIAIOSFODNN7EXAMPLE key"}' | bash "$PROMPT_HOOK")
assert_json_field "prompt deny AKIA" "$out" '.continue' 'false'

out=$(echo '{"prompt":"use sk-proj-abcdefghijklmnopqrstuvwxyz012345"}' | bash "$PROMPT_HOOK")
assert_json_field "prompt deny sk-proj" "$out" '.continue' 'false'

out=$(echo '{"prompt":"please fix the flaky test"}' | bash "$PROMPT_HOOK")
assert_json_field "prompt allow clean" "$out" '.continue' 'true'

out=$(echo 'nope' | bash "$PROMPT_HOOK")
assert_json_field "prompt deny malformed" "$out" '.continue' 'false'

assert_exit0 "format fail-open missing file" \
  bash -c "echo '{\"file_path\":\"/tmp/does-not-exist-hooks-smoke\"}' | bash \"$FORMAT_HOOK\""

echo
echo "hooks-smoke: $pass pass, $fail fail"
if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
