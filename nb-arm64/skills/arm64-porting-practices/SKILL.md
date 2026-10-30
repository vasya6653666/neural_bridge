---
name: "arm64-porting-practices"
description: "How to fix x86-only code found on the way to ARM64 (aarch64): multi-arch Dockerfiles with TARGETARCH and BUILDPLATFORM, architecture-dependent downloads, SIMD intrinsics with NEON or translation headers, inline assembly, compiler flags, Rust cfg and Go per-architecture files, CI and scripts. Use when editing code or Dockerfiles after arm_scan_code or arm_check_dockerfile."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# ARM64 porting practices
Change only what the findings point to, keep x86 working, and keep every architecture-specific part behind an explicit
check. After each group of edits, build for both `linux/amd64` and `linux/arm64`.
## Dockerfiles
- Use multi-arch base images. Do not write `FROM --platform=linux/amd64`.
- BuildKit sets `TARGETPLATFORM`, `TARGETOS`, `TARGETARCH`, `TARGETVARIANT` and the `BUILD*` counterparts. Declare them in
  the stage that uses them:
  ```dockerfile
  FROM debian:bookworm-slim
  ARG TARGETARCH
  RUN curl -fsSLo /usr/local/bin/tool "https://example.org/tool-linux-${TARGETARCH}" && chmod +x /usr/local/bin/tool
  ```
- When a vendor names files `x86_64` / `aarch64`, map the value instead of hardcoding it:
  ```sh
  case "$TARGETARCH" in amd64) arch=x86_64 ;; arm64) arch=aarch64 ;; *) echo "unsupported $TARGETARCH" >&2; exit 1 ;; esac
  ```
- Cross-compile instead of emulating where the toolchain allows it: run the compiler stage natively with
  `FROM --platform=$BUILDPLATFORM golang:1.23 AS build` and build for the target with `GOOS=$TARGETOS GOARCH=$TARGETARCH`.
  The same works for Rust with a target triple and for C/C++ with a cross toolchain. Only the final stage uses the target
  platform.
- `uname -m` prints `aarch64` on ARM64 Linux (`arm64` on some other systems). Handle both and fail on unknown values.
## C and C++
- Keep x86 intrinsics (`immintrin.h`, `_mm_*`, `__m128`) under `#if defined(__x86_64__) || defined(_M_X64)` and add an
  `#elif defined(__aarch64__) || defined(_M_ARM64)` branch with NEON from `arm_neon.h`, or SVE where the target servers
  support it. Always keep a plain scalar fallback.
- For large SSE code bases, a translation header such as sse2neon or the SIMDe library gives a working arm64 build first;
  hand-tuned NEON can follow for hot paths.
- Inline assembly with x86 registers or instructions (`rdtsc`, `cpuid`, `pause`) needs an aarch64 variant or a portable
  replacement: compiler builtins, `<stdatomic.h>`, `clock_gettime`.
- Compiler flags: put `-msse*`, `-mavx*`, `-march=<x86 cpu>`, `/arch:AVX*` behind an architecture check
  (`CMAKE_SYSTEM_PROCESSOR`, `$(uname -m)`, `TARGETARCH`). On ARM64 use `-march=armv8-a` or a newer profile that the target
  servers support, or `-mcpu=` for a known CPU; do not copy `-march=native` from one machine into images.
- `char` is unsigned by default on aarch64 Linux. Code that relies on signed `char` needs `signed char` or `-fsigned-char`.
## Rust
- Next to every `#[cfg(target_arch = "x86_64")]` provide `#[cfg(target_arch = "aarch64")]` or a
  `#[cfg(not(target_arch = "x86_64"))]` fallback. `std::arch::aarch64` has the NEON intrinsics; runtime detection is
  `std::arch::is_aarch64_feature_detected!`.
- Remove x86 `target-cpu` / `target-feature` values from `.cargo/config.toml` or scope them with `[target.x86_64-…]`.
## Go
- A `name_amd64.go` / `name_amd64.s` file needs a `name_arm64` counterpart or a generic file with `//go:build !amd64`.
  Without either, the package does not build for `GOARCH=arm64`.
- Do not hardcode `GOARCH=amd64` in Makefiles and scripts; take it from the target (`$TARGETARCH` in Dockerfiles).
## Scripts and CI
- Build multi-arch images with `--platform linux/amd64,linux/arm64`, and test on arm64 before switching production.
- Download tools by detected architecture, not by a fixed `amd64` / `x86_64` name.
- Pin per-architecture checksums when downloads are verified: each architecture has its own file and hash.
## What the scan cannot see
Native modules of language packages (Node addons, Python wheels, JNI libraries), bundled binaries, JIT engines and
memory-ordering assumptions (ARM64 has a weaker memory model than x86) only show up when the image is built and run on
arm64. Run the test suite inside the arm64 image, not only `--version`.
