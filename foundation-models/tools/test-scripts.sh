#!/usr/bin/env bash
# Regression tests for the deterministic script behavior. Parser tests run on
# every host; SDK integration tests run when full Xcode is available.

set -euo pipefail

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
PARSER="$ROOT/skills/foundation-models/scripts/fm-api.awk"
FIXTURE="$ROOT/tools/fixtures/FoundationModels.swiftinterface"
API="$ROOT/skills/foundation-models/scripts/fm-api.sh"
CHECK="$ROOT/skills/foundation-models/scripts/fm-check.sh"

fail() {
    echo "test-scripts: $*" >&2
    exit 1
}

assert_contains() {
    case "$1" in
        *"$2"*) ;;
        *) fail "expected output to contain: $2" ;;
    esac
}

assert_not_contains() {
    case "$1" in
        *"$2"*) fail "expected output not to contain: $2" ;;
        *) ;;
    esac
}

top=$(awk -v sym=TopLevel -v members=0 -v module=FoundationModels -f "$PARSER" "$FIXTURE")
assert_contains "$top" "public struct TopLevel"
assert_not_contains "$top" "PreviousScope"

nested=$(awk -v sym=Nested -v members=0 -v module=FoundationModels -f "$PARSER" "$FIXTURE")
assert_contains "$nested" "extension Container"
assert_contains "$nested" "public struct Nested"
assert_contains "$nested" "@available(iOS 27.0"

inline=$(awk -v sym=Availability -v members=0 -v module=FoundationModels -f "$PARSER" "$FIXTURE")
assert_contains "$inline" "@frozen public enum Availability"

protocol=$(awk -v sym=DynamicInstructions -v members=0 -v module=FoundationModels -f "$PARSER" "$FIXTURE")
assert_contains "$protocol" "public protocol DynamicInstructions"

initializer=$(awk -v sym=init -v members=0 -v module=FoundationModels -f "$PARSER" "$FIXTURE")
assert_contains "$initializer" "public init(value:"

if command -v xcrun >/dev/null 2>&1 && "$ROOT/skills/foundation-models/scripts/fm-env.sh" >/dev/null 2>&1; then
    generation=$("$ROOT/skills/foundation-models/scripts/fm-env.sh" | awk '/Generation:/ { print $2 }')
    api_output=$("$API" LanguageModelSession)
    assert_contains "$api_output" "class LanguageModelSession"
    assert_not_contains "$api_output" "extension LanguageModelExecutor"
    "$API" Availability >/dev/null
    if [ "$generation" = 27 ]; then
        "$API" DynamicInstructions >/dev/null
    fi
    qualified=$("$API" SystemLanguageModel.Availability)
    assert_contains "$qualified" "SystemLanguageModel"
    assert_not_contains "$qualified" "extension PrivateCloudComputeLanguageModel"

    work=$(mktemp -d "${TMPDIR:-/tmp}/fm-script-tests.XXXXXX")
    trap 'rm -rf "$work"' EXIT
    mkdir -p "$work/Temp With Spaces"
    printf '%s\n' 'import FoundationModels' 'let model = SystemLanguageModel.default' > "$work/Feature With Spaces.swift"
    TMPDIR="$work/Temp With Spaces" \
        "$CHECK" "$work/Feature With Spaces.swift" --target ios26.0 -q >/dev/null
    TMPDIR="$work/Temp With Spaces" "$API" Availability >/dev/null

    if [ "$generation" = 26 ]; then
        printf '%s\n' \
            'import FoundationModels' \
            'let options = GenerationOptions(sampling: .greedy, temperature: 0)' \
            > "$work/Xcode 26 Sampling.swift"
        "$CHECK" "$work/Xcode 26 Sampling.swift" --target ios26.0 -q >/dev/null
    fi

    if "$API" Availability --platform >/dev/null 2>&1; then
        fail "fm-api.sh accepted --platform without a value"
    fi
    echo "SDK integration tests: PASS"
else
    echo "SDK integration tests: SKIP (full Xcode not available)"
fi

echo "script regression tests: PASS"
