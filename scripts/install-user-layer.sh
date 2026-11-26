#!/usr/bin/env bash
# Opt-in: install project guard hooks into ~/.cursor so they apply outside a single repo.
# User hooks run with cwd ~/.cursor, so script paths are ./hooks/...
# Does not overwrite silently: prints a plan / diff and asks before writing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_HOOKS="$ROOT/.cursor/hooks"
DEST_DIR="${HOME}/.cursor"
DEST_HOOKS="$DEST_DIR/hooks"
DEST_JSON="$DEST_DIR/hooks.json"

SCRIPTS=(guard-shell.sh guard-reads.sh scan-prompt.sh)

need_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "error: jq is required. Install jq, then re-run." >&2
    exit 1
  fi
}

build_desired_fragment() {
  jq -n '{
    version: 1,
    hooks: {
      beforeShellExecution: [
        { command: "./hooks/guard-shell.sh", failClosed: true }
      ],
      beforeReadFile: [
        { command: "./hooks/guard-reads.sh", failClosed: true }
      ],
      beforeSubmitPrompt: [
        { command: "./hooks/scan-prompt.sh", failClosed: true }
      ]
    }
  }'
}

merge_hooks() {
  local existing="$1"
  local fragment="$2"
  # Merge by event: append our commands if the exact command string is not already present.
  jq -n --argjson existing "$existing" --argjson frag "$fragment" '
    def ensure_array: if . == null then [] else . end;
    def merge_event($key):
      (($existing.hooks[$key] | ensure_array) + ($frag.hooks[$key] | ensure_array))
      | unique_by(.command);
    {
      version: ($existing.version // $frag.version // 1),
      hooks: (
        ($existing.hooks // {})
        + {
            beforeShellExecution: merge_event("beforeShellExecution"),
            beforeReadFile: merge_event("beforeReadFile"),
            beforeSubmitPrompt: merge_event("beforeSubmitPrompt")
          }
        + (
            # Keep any other events from existing (e.g. afterFileEdit) untouched
            ($existing.hooks // {})
            | with_entries(select(.key != "beforeShellExecution"
                and .key != "beforeReadFile"
                and .key != "beforeSubmitPrompt"))
          )
      )
    }
  '
}

main() {
  need_jq

  for s in "${SCRIPTS[@]}"; do
    if [[ ! -f "$SRC_HOOKS/$s" ]]; then
      echo "error: missing source hook: $SRC_HOOKS/$s" >&2
      exit 1
    fi
  done

  mkdir -p "$DEST_HOOKS"

  echo "== User layer install (opt-in) =="
  echo "Source: $SRC_HOOKS"
  echo "Dest:   $DEST_DIR"
  echo
  echo "Will copy:"
  for s in "${SCRIPTS[@]}"; do
    echo "  $s -> $DEST_HOOKS/$s"
  done
  echo
  echo "Note: format.sh stays project-only (not installed at user level)."
  echo

  fragment="$(build_desired_fragment)"
  if [[ -f "$DEST_JSON" ]]; then
    existing="$(cat "$DEST_JSON")"
    if ! echo "$existing" | jq -e . >/dev/null 2>&1; then
      echo "error: $DEST_JSON is not valid JSON. Fix or move it, then re-run." >&2
      exit 1
    fi
    merged="$(merge_hooks "$existing" "$fragment")"
    echo "Existing $DEST_JSON will be merged (not replaced)."
    echo "---- diff (existing vs proposed) ----"
    if command -v diff >/dev/null 2>&1; then
      diff -u <(echo "$existing" | jq .) <(echo "$merged" | jq .) || true
    else
      echo "existing:"; echo "$existing" | jq .
      echo "proposed:"; echo "$merged" | jq .
    fi
  else
    merged="$fragment"
    echo "No existing hooks.json; will create:"
    echo "$merged" | jq .
  fi

  echo
  read -r -p "Apply these changes to ~/.cursor? [y/N] " ans
  case "$ans" in
    y|Y|yes|YES) ;;
    *)
      echo "Aborted. No files changed."
      exit 0
      ;;
  esac

  for s in "${SCRIPTS[@]}"; do
    cp "$SRC_HOOKS/$s" "$DEST_HOOKS/$s"
    chmod +x "$DEST_HOOKS/$s"
  done

  umask 077
  echo "$merged" | jq . > "$DEST_JSON"
  echo "Installed. Restart Cursor or reload hooks if they do not show as active."
  echo "Reminder: failClosed + missing jq blocks shell and reads."
}

main "$@"
