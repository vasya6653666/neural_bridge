# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] — 2026-08-09

### Added

- Added a public privacy policy and explicit support contacts for marketplace
  publication.
- Added the publisher's public contact email to the plugin manifest.

### Changed

- Clarified which Xcode versions are exercised by hosted and local checks.

## [0.1.2] — 2026-08-09

### Fixed

- Made the regression suite adapt its API checks to the selected Xcode SDK.
- Resolved shellcheck warnings in the bundled scripts and documentation checker.
- Changed the preview SDK CI job to track the latest Xcode available on GitHub's
  hosted macOS runner instead of failing when Xcode 27 is not yet installed.

## [0.1.1] — 2026-08-09

### Fixed

- Corrected tool error handling to use `LanguageModelSession.ToolCallError`.
- Fixed SDK lookup for top-level declarations and declarations with inline
  Swift attributes.
- Made SDK and Swift input paths with spaces safe.

### Changed

- Clarified runtime compatibility, installation, security, and fallback error
  handling.
- Reworked the README around installation, real usage examples, and copyable
  prompts while moving implementation detail out of the main flow.
- Added behavioral script tests and explicit Xcode 26/27 CI coverage.

## [0.1.0] — 2026-08-07

### Added

- Agent Plugins 1.0.0 manifest (`plugin.json`).
- `foundation-models` skill covering the FoundationModels framework for
  iOS/macOS/visionOS 26–27 and watchOS 27.
- `fm-env.sh` — resolves the installed SDK, reports generation (26 or 27) and
  which cross-import overlays are present.
- `fm-api.sh` — prints a symbol's real signature, enclosing declaration, and
  `@available` attributes from the SDK's `.swiftinterface`, including the
  Vision, CoreSpotlight, UIKit, and SwiftUI overlays.
- `fm-check.sh` — type-checks Swift against the real SDK at a chosen deployment
  target; defaults to `ios26.0` so availability mistakes surface by default.
- Eight reference documents: availability matrix, guided generation, tools and
  RAG, streaming and SwiftUI, agentic profiles, errors and limits, testing and
  performance, ecosystem.
- `tools/check-docs.sh` and a CI workflow that type-check every Swift example in
  the documentation against the installed SDK.

[Unreleased]: https://github.com/artemnovichkov/foundation-models-plugin/compare/0.1.3...HEAD
[0.1.3]: https://github.com/artemnovichkov/foundation-models-plugin/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/artemnovichkov/foundation-models-plugin/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/artemnovichkov/foundation-models-plugin/compare/0.1.0...0.1.1
[0.1.0]: https://github.com/artemnovichkov/foundation-models-plugin/releases/tag/0.1.0
