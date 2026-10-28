#!/usr/bin/env bash
# fm-env.sh — resolve the FoundationModels SDK surface on this machine.
#
# Sourced by fm-api.sh and fm-check.sh; also runnable directly to print a report.
#
# Exports:
#   FM_PLATFORM   ios | macos | visionos | watchos
#   FM_SDK        path to the SDK
#   FM_IFACE      path to FoundationModels.swiftinterface
#   FM_GEN        26 | 27   (SDK generation)
#   FM_TRIPLE     target triple prefix, e.g. arm64-apple-ios
#
# Honors DEVELOPER_DIR to select a specific Xcode.

set -u

FM_PLATFORM="${FM_PLATFORM:-ios}"

FM_PROG="${FM_PROG:-${0##*/}}"

fm_die() {
    echo "${FM_PROG}: $*" >&2
    exit 1
}

# Map a platform name to (sdk name, interface arch-triple, target triple prefix).
fm_resolve_platform() {
    case "$1" in
        ios)      FM_SDK_NAME=iphoneos;          FM_IFACE_TRIPLE=apple-ios;      FM_TRIPLE=arm64-apple-ios ;;
        macos)    FM_SDK_NAME=macosx;            FM_IFACE_TRIPLE=apple-macos;    FM_TRIPLE=arm64-apple-macos ;;
        visionos) FM_SDK_NAME=xros;              FM_IFACE_TRIPLE=apple-xros;     FM_TRIPLE=arm64-apple-xros ;;
        watchos)  FM_SDK_NAME=watchos;           FM_IFACE_TRIPLE=apple-watchos;  FM_TRIPLE=arm64_32-apple-watchos ;;
        *) fm_die "unknown platform '$1' (expected ios, macos, visionos, watchos)" ;;
    esac
}

fm_env_init() {
    fm_resolve_platform "$FM_PLATFORM"

    command -v xcrun >/dev/null 2>&1 || fm_die "xcrun not found — install Xcode 26 or later"

    FM_SDK=$(xcrun --sdk "$FM_SDK_NAME" --show-sdk-path 2>/dev/null) \
        || fm_die "no $FM_SDK_NAME SDK — install the platform in Xcode, or set DEVELOPER_DIR"
    [ -n "$FM_SDK" ] || fm_die "no $FM_SDK_NAME SDK path"

    FM_FRAMEWORK="$FM_SDK/System/Library/Frameworks/FoundationModels.framework"
    [ -d "$FM_FRAMEWORK" ] || fm_die "FoundationModels.framework not in $FM_SDK_NAME SDK — requires Xcode 26 or later"

    FM_MODULE_DIR="$FM_FRAMEWORK/Modules/FoundationModels.swiftmodule"

    # Prefer arm64e, fall back to arm64 / arm64_32 / anything matching the platform.
    FM_IFACE=""
    for arch in arm64e arm64 arm64_32; do
        cand="$FM_MODULE_DIR/${arch}-${FM_IFACE_TRIPLE}.swiftinterface"
        if [ -f "$cand" ]; then FM_IFACE="$cand"; break; fi
    done
    if [ -z "$FM_IFACE" ]; then
        FM_IFACE=$(find "$FM_MODULE_DIR" -name "*.swiftinterface" 2>/dev/null | head -1)
    fi
    if [ -z "$FM_IFACE" ] || [ ! -f "$FM_IFACE" ]; then
        fm_die "no .swiftinterface in $FM_MODULE_DIR"
    fi

    # Generation: DynamicProfile is the iOS 27 marker.
    if grep -q "DynamicProfile" "$FM_IFACE" 2>/dev/null; then
        FM_GEN=27
    else
        FM_GEN=26
    fi

    export FM_PLATFORM FM_SDK FM_IFACE FM_GEN FM_TRIPLE
}

# Path to a cross-import overlay interface, or empty when absent.
fm_overlay_iface() {
    _ov="$FM_SDK/System/Library/Frameworks/$1.framework/Modules/$1.swiftmodule"
    [ -d "$_ov" ] || return 1
    find "$_ov" -name "*.swiftinterface" 2>/dev/null | head -1
}

# Strip module qualifiers (Swift::Int -> Int) so signatures are readable.
fm_demangle() {
    sed -e 's/[A-Za-z_][A-Za-z0-9_]*:://g'
}

# Only run the report when executed directly, not when sourced.
case "${0##*/}" in
fm-env.sh)
    while [ $# -gt 0 ]; do
        case "$1" in
            --platform)
                [ $# -ge 2 ] || fm_die "--platform requires a value"
                FM_PLATFORM="$2"
                shift 2
                ;;
            -h|--help)
                echo "usage: fm-env.sh [--platform ios|macos|visionos|watchos]"
                exit 0 ;;
            *) fm_die "unknown argument '$1'" ;;
        esac
    done

    fm_env_init

    echo "Xcode:      $(xcodebuild -version 2>/dev/null | head -1)"
    echo "DEVELOPER_DIR: ${DEVELOPER_DIR:-$(xcode-select -p 2>/dev/null)}"
    echo "Platform:   $FM_PLATFORM"
    echo "SDK:        $FM_SDK"
    echo "Interface:  $FM_IFACE"
    echo "Generation: $FM_GEN  ($([ "$FM_GEN" = 27 ] && echo 'iOS/macOS 27 APIs available' || echo 'iOS/macOS 26 only — no DynamicProfile, PCC, attachments'))"
    echo "Symbols:    $(grep -cE 'public (struct|class|enum|protocol) ' "$FM_IFACE") public types, $(wc -l < "$FM_IFACE" | tr -d ' ') lines"

    echo "Overlays:"
    for ov in _Vision_FoundationModels _CoreSpotlight_FoundationModels _FoundationModels_UIKit _FoundationModels_SwiftUI; do
        if fm_overlay_iface "$ov" >/dev/null 2>&1; then
            echo "  present  $ov"
        else
            echo "  absent   $ov"
        fi
    done
    [ "$FM_GEN" = 26 ] && echo "" && echo "Note: overlays (Vision/CoreSpotlight tools) ship with Xcode 27. Absence here is expected."
    exit 0
    ;;
esac
