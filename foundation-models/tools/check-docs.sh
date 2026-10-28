#!/bin/sh
# check-docs.sh — type-check every Swift example in the skill docs.
#
#   tools/check-docs.sh                 # all docs
#   tools/check-docs.sh path/to/file.md # one file
#
# Fence conventions inside the docs:
#   ```swift               -> checked at ios26.0 (the default deployment target)
#   ```swift ios27.0       -> checked at that target
#   ```swift ios26.0 sdk27 -> deployment target 26, but needs the Xcode 27 SDK
#                             (e.g. `if #available` fallbacks, or API whose
#                             spelling changed in the newer SDK)
#   ```swift no-check      -> skipped (illustrative fragments, error output)
#
# Anything requiring the Xcode 27 SDK is skipped, not failed, on Xcode 26.
#
# Each block is checked in isolation, so a block must be self-contained:
# include its own `import FoundationModels` and any @available annotation.

set -eu

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
CHECK="$ROOT/skills/foundation-models/scripts/fm-check.sh"

[ -x "$CHECK" ] || { echo "check-docs: $CHECK missing or not executable" >&2; exit 1; }

if [ $# -gt 0 ]; then
    DOCS="$*"
else
    DOCS=$(find "$ROOT/skills" -name "*.md" | sort)
fi

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Blocks tagged for a 27.x target cannot compile against an Xcode 26 SDK.
# Skip them there instead of failing, so CI stays useful on either toolchain.
export FM_PLATFORM=ios
# shellcheck source=skills/foundation-models/scripts/fm-env.sh
. "$ROOT/skills/foundation-models/scripts/fm-env.sh"
fm_env_init
echo "SDK generation: $FM_GEN"

TOTAL=0
FAILED=0
SKIPPED=0

for doc in $DOCS; do
    # Split the file into numbered swift blocks plus a sidecar target file.
    awk -v out="$WORK" -v doc="$doc" '
        /^```swift/ {
            inblock = 1
            n++
            target = $2
            if (target == "") target = "ios26.0"
            needs27 = ($3 == "sdk27") ? 1 : 0
            file = sprintf("%s/block%03d.swift", out, n)
            printf "%s\n", target > sprintf("%s/block%03d.target", out, n)
            printf "%d\n", needs27 > sprintf("%s/block%03d.sdk27", out, n)
            printf "%d\n", NR > sprintf("%s/block%03d.line", out, n)
            next
        }
        /^```/ && inblock { inblock = 0; close(file); next }
        inblock { print > file }
    ' "$doc"

    for blk in "$WORK"/block*.swift; do
        [ -e "$blk" ] || continue
        base="${blk%.swift}"
        target=$(cat "$base.target")
        line=$(cat "$base.line")
        needs27=$(cat "$base.sdk27")
        rel=${doc#"$ROOT"/}

        if [ "$target" = "no-check" ]; then
            SKIPPED=$((SKIPPED + 1))
            rm -f "$blk" "$base.target" "$base.line" "$base.sdk27"
            continue
        fi

        # Examples needing the Xcode 27 SDK are skipped, not failed, on Xcode 26.
        case "$target" in
            *27.*) needs27=1 ;;
        esac
        if [ "$needs27" = "1" ] && [ "$FM_GEN" = 26 ]; then
            echo "SKIP  $rel:$line  (needs the Xcode 27 SDK)"
            SKIPPED=$((SKIPPED + 1))
            rm -f "$blk" "$base.target" "$base.line" "$base.sdk27"
            continue
        fi

        TOTAL=$((TOTAL + 1))
        if "$CHECK" "$blk" --target "$target" -q >/dev/null 2>&1; then
            :
        else
            FAILED=$((FAILED + 1))
            echo "FAIL  $rel:$line  (target $target)"
            "$CHECK" "$blk" --target "$target" 2>&1 | sed 's|^|      |' | head -25
            echo
        fi
        rm -f "$blk" "$base.target" "$base.line" "$base.sdk27"
    done
done

echo "checked $TOTAL block(s), skipped $SKIPPED, failed $FAILED"
[ "$FAILED" -eq 0 ] || exit 1
