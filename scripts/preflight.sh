#!/usr/bin/env bash
# Checks everything that can be checked without touching Fly. Run before deploying.
set -uo pipefail
pass=0; fail=0
ok()   { printf '  \033[32mok\033[0m   %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
chk()  { if eval "$2" >/dev/null 2>&1; then ok "$1"; else bad "$1"; fi; }

echo "Preflight"
chk "node 22 or newer"          '[ "$(node -p "process.versions.node.split(\".\")[0]")" -ge 22 ]'
chk "dependencies installed"    '[ -d node_modules/fastify ]'
chk "lockfile present"          '[ -f package-lock.json ]'
chk "every source file parses"  'for f in $(find src shared public -name "*.js"); do node --check "$f" || exit 1; done'
chk "instrument builds a plan"  'node -e "import(\"./shared/instrument.js\").then(m=>{const p=m.buildPlan(\"H1\",\"O1\",true); if(m.planItems(p).length<90) process.exit(1)})"'
chk "all 21 cells defined"      'node -e "import(\"./shared/instrument.js\").then(m=>{if(m.allCells().length!==21) process.exit(1)})"'
chk "Dockerfile copies exist"   'for d in src shared public private db; do [ -d "$d" ] || exit 1; done'
chk "fly.toml present"          '[ -f fly.toml ]'
chk "flyctl installed"          'command -v fly'
chk "logged in to Fly"          'fly auth whoami'

echo
echo "Things only you can check:"
echo "  · AV1 options are still placeholders — write them from the real clips"
echo "     grep -n 'correct line from spoken dialogue' shared/instrument.js"
echo "  · the study information page is generic — replace with your approved text"
echo "     grep -n 'renderInfo' public/survey.js"
echo "  · the three YouTube clips must be Unlisted (not Private) and embeddable"
echo
printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
