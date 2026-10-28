#!/usr/bin/env bash
# fm-check.sh — type-check Swift against the real FoundationModels SDK.
#
#   fm-check.sh Feature.swift
#   fm-check.sh Feature.swift --target ios27.0
#   cat snippet.swift | fm-check.sh -
#
# Catches both invented API and availability mistakes:
#   error: extra argument 'topP' in call
#   error: 'PrivateCloudComputeLanguageModel' is only available in iOS 27.0 or newer
#
# Run this on generated Foundation Models code BEFORE showing it to the user.

set -u

DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
# shellcheck source=skills/foundation-models/scripts/fm-env.sh
. "$DIR/fm-env.sh"

TARGET="ios26.0"
FILES=()
QUIET=0
STDIN_SEEN=0

while [ $# -gt 0 ]; do
    case "$1" in
        --target)
            [ $# -ge 2 ] || fm_die "--target requires a value"
            TARGET="$2"
            shift 2
            ;;
        -q|--quiet) QUIET=1; shift ;;
        -)
            [ "$STDIN_SEEN" -eq 0 ] || fm_die "stdin ('-') may be specified only once"
            STDIN_SEEN=1
            FILES+=("-")
            shift
            ;;
        -h|--help)
            cat <<'EOF'
usage: fm-check.sh <file.swift|-> [file2.swift ...] [--target ios26.0]

  --target    deployment target: ios26.0 (default), ios26.4, ios27.0,
              macos26.0, macos27.0, visionos27.0, watchos27.0
  -q          only report pass/fail

Default is ios26.0 — the strictest realistic deployment target, so
availability mistakes surface by default. Use --target ios27.0 for code
that intentionally requires iOS 27.
EOF
            exit 0 ;;
        -*) fm_die "unknown option '$1'" ;;
        *)  FILES+=("$1"); shift ;;
    esac
done

[ "${#FILES[@]}" -gt 0 ] || fm_die "usage: fm-check.sh <file.swift|-> [--target ios26.0]"

# Derive the platform from the target so --target macos27.0 just works.
case "$TARGET" in
    ios*)      FM_PLATFORM=ios;      VERSION=${TARGET#ios} ;;
    macos*)    FM_PLATFORM=macos;    VERSION=${TARGET#macos} ;;
    visionos*) FM_PLATFORM=visionos; VERSION=${TARGET#visionos} ;;
    watchos*)  FM_PLATFORM=watchos;  VERSION=${TARGET#watchos} ;;
    *) fm_die "unrecognized target '$TARGET' (expected e.g. ios26.0, ios27.0, macos27.0)" ;;
esac
export FM_PLATFORM
fm_env_init

# Refuse a 27 target on a 26 SDK — the compiler error would be confusing.
case "$VERSION" in
    27*)
        if [ "$FM_GEN" = 26 ]; then
            fm_die "target $TARGET needs the Xcode 27 SDK, but the selected SDK is generation 26.
       Install Xcode 27, or set DEVELOPER_DIR to an Xcode 27 install, or use --target ios26.0."
        fi
        ;;
esac

# Normalize: $TMPDIR usually carries a trailing slash, which would break the
# path rewriting below.
_tmpbase="${TMPDIR:-/tmp}"
while [ "${_tmpbase%/}" != "$_tmpbase" ]; do _tmpbase="${_tmpbase%/}"; done
TMPDIR_RUN=$(mktemp -d "$_tmpbase/fm-check.XXXXXX") \
    || fm_die "could not create a temporary directory"
trap 'rm -rf "$TMPDIR_RUN"' EXIT
mkdir -p "$TMPDIR_RUN/module-cache"

# Resolve stdin and copy inputs so we never touch the user's files.
INPUTS=()
i=0
for f in "${FILES[@]}"; do
    i=$((i + 1))
    dest="$TMPDIR_RUN/snippet$i.swift"
    if [ "$f" = "-" ]; then
        cat > "$dest"
    else
        [ -f "$f" ] || fm_die "no such file: $f"
        cp "$f" "$dest"
    fi
    INPUTS+=("$dest")
done

TRIPLE="${FM_TRIPLE}${VERSION}"

# -enable-bare-slash-regex: `@Guide(.pattern(/[A-Z]{2}/))` is ordinary usage and
# is on by default in Swift 6 language mode; enable it so Swift 5 mode agrees.
OUT=$(xcrun swiftc -typecheck -enable-bare-slash-regex \
        -module-cache-path "$TMPDIR_RUN/module-cache" \
        -target "$TRIPLE" -sdk "$FM_SDK" "${INPUTS[@]}" 2>&1)
STATUS=$?

# Map temp paths back to the original filenames.
i=0
for f in "${FILES[@]}"; do
    i=$((i + 1))
    old=$(printf '%s' "$TMPDIR_RUN/snippet$i.swift" | sed 's/[][\\.^$*|]/\\&/g')
    replacement=$(printf '%s' "$f" | sed 's/[\\&|]/\\&/g')
    OUT=$(printf '%s\n' "$OUT" | sed "s|$old|$replacement|g")
done

if [ "$STATUS" -eq 0 ]; then
    if [ "$QUIET" -eq 1 ]; then
        echo "PASS"
    else
        echo "PASS — type-checks against $TRIPLE (SDK generation $FM_GEN)"
        # Warnings still matter; surface them.
        printf '%s\n' "$OUT" | grep -q "warning:" && printf '%s\n' "$OUT"
    fi
    exit 0
fi

echo "FAIL — $TRIPLE (SDK generation $FM_GEN)"
[ "$QUIET" -eq 1 ] || printf '%s\n' "$OUT"

# The single most common cause: 27-only API compiled at a 26 target.
if printf '%s\n' "$OUT" | grep -q "is only available in"; then
    cat <<EOF

Availability failure. Either:
  - wrap the code in 'if #available(iOS 27.0, *)' / mark it '@available(iOS 27.0, *)', or
  - re-run with --target ios27.0 if the feature genuinely requires iOS 27.
Confirm the real introducing version with: fm-api.sh <Symbol>
EOF
fi

exit 1
