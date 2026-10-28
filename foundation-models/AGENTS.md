# Repository Guidelines

## Project Structure & Module Organization

`plugin.json` is the Agent Plugins 1.0 manifest. The distributable skill lives
in `skills/foundation-models/`: `SKILL.md` defines the workflow,
`references/` contains topic-specific guidance, and `scripts/` contains SDK
inspection and Swift type-checking utilities. Repository checks are under
`tools/`; `tools/fixtures/FoundationModels.swiftinterface` supports tests that
do not require Xcode. User-facing project information belongs in `README.md`,
`CHANGELOG.md`, and `PRIVACY.md`.

## Build, Test, and Development Commands

There is no application build step. Run these checks from the repository root:

```sh
python3 tools/validate-plugin.py  # validate plugin and skill metadata
tools/test-scripts.sh             # parser tests plus Xcode integration tests
tools/check-docs.sh               # type-check all Swift documentation examples
shellcheck skills/foundation-models/scripts/*.sh tools/*.sh
```

Use `tools/check-docs.sh path/to/file.md` while editing one document. A full
Xcode 26+ installation is required for SDK checks; select another toolchain
with `DEVELOPER_DIR` when testing Xcode 27 APIs.

## Coding Style & Naming Conventions

Keep Markdown concise, wrap prose near 80 columns, and use lowercase kebab-case
for skill names and new reference filenames. Swift examples must be
self-contained and include imports and availability annotations. Tag fences as
`swift`, `swift ios27.0`, `swift ios26.0 sdk27`, or `swift no-check` according
to the checker conventions. Use four-space indentation in Python and existing
shell style: quoted expansions, uppercase environment variables, and
`set -eu`/`set -euo pipefail` where appropriate. Run ShellCheck before pushing.

## Testing Guidelines

Add deterministic parser cases to `tools/test-scripts.sh` and extend the
fixture when supporting new declaration shapes. Documentation examples are
executable tests; do not mark a block `no-check` merely to silence a failure.
Verify APIs with `fm-api.sh` and type-check non-trivial Swift with
`fm-check.sh Feature.swift --target ios26.0`. CI tests plugin conformance,
shell scripts, Xcode 26, and the latest stable Xcode; no numeric coverage target
is used.

## Commit & Pull Request Guidelines

Follow the history's short, imperative, sentence-case subjects, such as
`Fix release validation` or `Add marketplace privacy metadata`. Keep commits
focused. Pull requests should explain the user-visible effect, list commands
run, link related issues, and update `CHANGELOG.md` for notable changes.
Include screenshots only when documentation rendering or marketplace visuals
change. Never commit credentials, generated SDK dumps, or machine-specific
Xcode paths.
