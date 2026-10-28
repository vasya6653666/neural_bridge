#!/usr/bin/env bash
# fm-api.sh — print the real signature, enclosing top-level declaration, and @available
# attributes for a FoundationModels symbol, read from the SDK installed on
# this machine.
#
#   fm-api.sh contextSize
#   fm-api.sh LanguageModelSession --members
#   fm-api.sh SpotlightSearchTool --platform ios
#
# Never answer an availability question from memory. Ask this instead.

set -u

DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=skills/foundation-models/scripts/fm-env.sh
. "$DIR/fm-env.sh"

SYMBOL=""
MEMBERS=0

while [ $# -gt 0 ]; do
    case "$1" in
        --platform)
            [ $# -ge 2 ] || fm_die "--platform requires a value"
            FM_PLATFORM="$2"
            shift 2
            ;;
        --members)  MEMBERS=1; shift ;;
        -h|--help)
            echo "usage: fm-api.sh <Symbol> [--platform ios|macos|visionos|watchos] [--members]"
            echo
            echo "  --members   also match the symbol anywhere in a declaration,"
            echo "              not just as the declared name."
            exit 0 ;;
        -*) fm_die "unknown option '$1'" ;;
        *)  SYMBOL="$1"; shift ;;
    esac
done

[ -n "$SYMBOL" ] || fm_die "usage: fm-api.sh <Symbol> [--platform ...] [--members]"
SEARCH_SYMBOL="${SYMBOL##*.}"
SEARCH_OWNER=""
if [[ "$SYMBOL" == *.* ]]; then
    qualified_owner="${SYMBOL%.*}"
    SEARCH_OWNER="${qualified_owner##*.}"
    [ "$SEARCH_OWNER" = FoundationModels ] && SEARCH_OWNER=""
fi

fm_env_init

# Search the core interface plus any cross-import overlays, so tools like
# SpotlightSearchTool / OCRTool are found where they actually live.
IFACES=("$FM_IFACE")
for ov in _Vision_FoundationModels _CoreSpotlight_FoundationModels _FoundationModels_UIKit _FoundationModels_SwiftUI; do
    p=$(fm_overlay_iface "$ov" 2>/dev/null) || continue
    [ -n "$p" ] && IFACES+=("$p")
done

TOTAL=0
TMP=$(mktemp "${TMPDIR:-/tmp}/fm-api.XXXXXX") || fm_die "could not create a temporary file"
trap 'rm -f "$TMP"' EXIT

for iface in "${IFACES[@]}"; do
    module=$(basename "$(dirname "$iface")" | sed 's/\.swiftmodule$//')

    awk -v sym="$SEARCH_SYMBOL" -v owner="$SEARCH_OWNER" -v members="$MEMBERS" -v module="$module" \
        -f "$DIR/fm-api.awk" "$iface" > "$TMP" 2>/dev/null

    if [ -s "$TMP" ]; then
        printf '=== %s (%s SDK, generation %s) ===\n\n' "$module" "$FM_PLATFORM" "$FM_GEN"
        fm_demangle < "$TMP"
        TOTAL=$((TOTAL + 1))
    fi
done

if [ "$TOTAL" -eq 0 ]; then
    echo "No match for '$SYMBOL' in the $FM_PLATFORM SDK (generation $FM_GEN)." >&2
    if [ "$FM_GEN" = 26 ]; then
        cat >&2 <<'EOF'

This is an Xcode 26 SDK. Many Foundation Models APIs (DynamicProfile, Profile,
PrivateCloudComputeLanguageModel, Attachment, ContextOptions, LanguageModelError,
SpotlightSearchTool, OCRTool, BarcodeReaderTool, toolCallingMode, Usage) exist
only in iOS/macOS 27. Absence here does NOT mean the API does not exist —
install Xcode 27 to confirm before telling the user it is unavailable.
EOF
    else
        echo "Try --members to match the symbol anywhere in a declaration." >&2
    fi
    exit 1
fi
