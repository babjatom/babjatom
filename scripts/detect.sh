#!/usr/bin/env bash
# Read-only detection of stack signals and generated/migration paths.
# Prints findings only. Does not write rules or edit AGENTS.md.
set -euo pipefail

ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"

echo "detect root: $ROOT"
echo

echo "== stack signals =="
stacks=()
if [[ -f "$ROOT/package.json" ]]; then
  stacks+=("javascript/typescript (package.json)")
  if grep -Eq '"next"|"react"' "$ROOT/package.json" 2>/dev/null; then
    stacks+=("notes: Next.js/React markers in package.json")
  fi
fi
if [[ -f "$ROOT/go.mod" ]]; then
  stacks+=("go (go.mod)")
fi
if [[ -f "$ROOT/pyproject.toml" || -f "$ROOT/requirements.txt" || -f "$ROOT/Pipfile" ]]; then
  stacks+=("python (pyproject/requirements/Pipfile)")
fi
if ((${#stacks[@]})); then
  printf '  - %s\n' "${stacks[@]}"
else
  echo "  - none detected"
fi

echo
echo "== generated code =="
gen=()
for d in gen generated __generated__; do
  if [[ -d "$ROOT/$d" ]]; then
    gen+=("$d/")
  fi
done
while IFS= read -r -d '' f; do
  rel="${f#$ROOT/}"
  gen+=("$rel")
done < <(find "$ROOT" \( -name '*.pb.go' -o -name '*_pb2.py' -o -name '*.generated.*' \) -print0 2>/dev/null)

if ((${#gen[@]})); then
  printf '  - %s\n' "${gen[@]}"
  echo "  → bootstrap would propose a generated-code rule (ask first)"
else
  echo "  - none detected → no generated-code rule; GENERATED_PATHS=none detected"
fi

echo
echo "== migrations =="
mig=()
for d in migrations alembic prisma/migrations db/migrate; do
  if [[ -e "$ROOT/$d" ]]; then
    mig+=("$d/")
  fi
done

if ((${#mig[@]})); then
  printf '  - %s\n' "${mig[@]}"
  echo "  → bootstrap would propose a db-migrations rule (ask first)"
else
  echo "  - none detected → no migrations rule"
fi
