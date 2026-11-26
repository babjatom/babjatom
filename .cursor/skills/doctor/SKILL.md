---
name: doctor
description: Verify agent bootstrap health: jq installed, project hooks load and respond to sample JSON, optional user-layer hooks present. Use when setting up a machine, after updating hooks, or when failClosed hooks seem to block everything.
---

# Doctor

## Checks

Run these in order. Report pass / fail for each.

### 1. jq

```bash
command -v jq && jq --version
```

If missing: **fail**. Security hooks use `failClosed: true`, so missing jq blocks shell and reads. Install jq, then re-run doctor.

### 2. Project hooks present

Confirm these exist and are invokable via `bash`:

- `.cursor/hooks.json`
- `.cursor/hooks/guard-shell.sh`
- `.cursor/hooks/guard-reads.sh`
- `.cursor/hooks/scan-prompt.sh`
- `.cursor/hooks/format.sh` (opt-in; may be unwired from `hooks.json`)

Confirm `hooks.json` wires the three security hooks. Format is optional.

### 3. Hook fire tests (preferred)

From the project root, run the shared fixture harness:

```bash
bash scripts/hooks-smoke.sh
```

This covers allow/deny cases including `ls myenv` (must allow), force-push, `+refspec`, `.env` reads, fake AWS / `sk-proj-` prompts, malformed JSON, and format fail-open.

If the script is missing, fall back to the manual samples in an older doctor run, then restore `scripts/hooks-smoke.sh` from the template.

### 4. User layer (optional)

```bash
test -f ~/.cursor/hooks.json && test -d ~/.cursor/hooks && echo "user layer present" || echo "user layer not installed"
```

If missing, mention `scripts/install-user-layer.sh` (opt-in).

### 5. Cursor UI note

Shell tests cannot prove Cursor loaded the hooks in the IDE. Ask the user to confirm Hooks show as active in Cursor Settings after install.

## Report format

```text
jq: pass|fail
project hooks: pass|fail
hooks-smoke: pass|fail
user layer: present|absent
UI load: needs manual check
```

## Reminder

`failClosed` + missing `jq` blocks agent shell and file reads. Fix jq before debugging anything else.
