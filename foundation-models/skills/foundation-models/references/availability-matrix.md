# Availability matrix

## Contents

- [Core since 26.0](#core-available-since-260)
- [Added in 26.4](#added-in-264)
- [Added in 27.0](#added-in-270)
- [Removed in 27.0](#removed-in-270)
- [Deprecated in 27.0](#deprecated-in-270)
- [Code spanning both generations](#writing-code-that-spans-both)

The version boundaries in this framework are not guessable. Verify before you
claim, with:

```
scripts/fm-api.sh <Symbol>
```

That prints the enclosing top-level declaration, the real `@available`
attributes, and the file:line in the SDK's `.swiftinterface`. The installed SDK
is the source of truth; this table is a curated navigation aid and can lag a
new seed. Verify individual symbols before answering.

Throughout: **tvOS is unavailable** for the entire framework. **watchOS starts
at 27.0** — there is no watchOS 26 Foundation Models.

## Core, available since 26.0

| Symbol | Notes |
|---|---|
| `SystemLanguageModel`, `.default`, `.availability`, `.isAvailable` | on-device model |
| `SystemLanguageModel.UseCase` — `.general`, `.contentTagging` | |
| `SystemLanguageModel.Guardrails` — `.default`, `.permissiveContentTransformations` | |
| `LanguageModelSession`, `respond(to:)`, `streamResponse(to:)`, `prewarm()` | |
| `@Generable`, `@Guide`, `GenerationSchema`, `GenerationGuide` | guided generation |
| `DynamicGenerationSchema`, `GeneratedContent`, `GenerationID` | runtime schemas |
| `Tool`, `Instructions`, `Prompt`, `InstructionsBuilder`, `PromptBuilder` | |
| `Transcript` and its `Entry`/`Segment` types | read-only in 26 |
| `GenerationOptions` — `temperature`, `maximumResponseTokens`, `samplingMode` | |
| `LanguageModelSession.ResponseStream`, `PartiallyGenerated` | streaming |
| `LanguageModelSession.GenerationError` | **deprecated in 27** — see below |

## Added in 26.4

| Symbol | Notes |
|---|---|
| `SystemLanguageModel.tokenCount(for:)` | overloads for `Prompt`, `Instructions`, `[any Tool]`, `GenerationSchema`, `[Transcript.Entry]` |
| `DynamicGenerationSchema.null` | |
| `@Generable(description:representNilExplicitlyInGeneratedContent:)` | |

`SystemLanguageModel.contextSize` is declared `@available(iOS 26.0, …)` with
`@backDeployed(before: iOS 26.4, …)` — usable from **26.0**. Do not repeat the
common claim that it is 27.0-only; that version belongs to the *separate*
`PrivateCloudComputeLanguageModel.contextSize`. Confirm with
`fm-api.sh contextSize`, which prints both.

## Added in 27.0

Everything below **requires the Xcode 27 SDK to compile at all**. Under Xcode 26
these symbols do not exist and `fm-api.sh` will say so explicitly.

| Area | Symbols |
|---|---|
| Pluggable models | `LanguageModel`, `LanguageModelExecutor`, `LanguageModelCapabilities` (`.vision`, `.reasoning`, `.toolCalling`, `.guidedGeneration`) |
| Private Cloud Compute | `PrivateCloudComputeLanguageModel`, `.availability`, `.quotaUsage`, `QuotaUsage.LimitIncreaseSuggestion` |
| Reasoning | `ContextOptions`, `ContextOptions.ReasoningLevel` (`.light`, `.moderate`, `.deep`, `.custom`) |
| Agentic DSL | `LanguageModelSession.DynamicProfile`, `Profile`, `DynamicInstructions`, `DynamicProfileModifier`, `DynamicInstructionsForEach` |
| Session state | `@SessionProperty`, `@SessionPropertyEntry`, `SessionPropertyValues` |
| Vision input | `Attachment`, `ImageAttachmentContent`, `Transcript.ImageAttachment`, `Transcript.AttachmentSegment` |
| Tool control | `GenerationOptions.ToolCallingMode` (`.allowed`, `.required`, `.disallowed`) |
| Accounting | `LanguageModelSession.Usage`, `.input.cachedTokenCount`, `.output.reasoningTokenCount` |
| Errors | `LanguageModelError` (all cases), `LanguageModelSession.Error`, `TranscriptErrorHandlingPolicy` |
| Transcript | `Transcript: MutableCollection`, `Transcript.Reasoning`, mutable `session.transcript` |
| System tools | `SpotlightSearchTool` (CoreSpotlight overlay), `OCRTool` / `BarcodeReaderTool` (Vision overlay) |
| Feedback | `LanguageModelFeedback`, `session.logFeedbackAttachment(...)` |

### Cross-import overlays

`SpotlightSearchTool`, `OCRTool`, `BarcodeReaderTool` and the
`Attachment(UIImage:)` initializer do not live in `FoundationModels` itself.
They ship in cross-import overlay frameworks that activate only when you import
**both** modules:

| Overlay | Requires |
|---|---|
| `_CoreSpotlight_FoundationModels` | `import CoreSpotlight` + `import FoundationModels` |
| `_Vision_FoundationModels` | `import Vision` + `import FoundationModels` |
| `_FoundationModels_UIKit` | `import UIKit` + `import FoundationModels` |
| `_FoundationModels_SwiftUI` | `import SwiftUI` + `import FoundationModels` |

Never write `import _Vision_FoundationModels`. Run `scripts/fm-env.sh` to see
which overlays the selected SDK actually has.

## Removed in 27.0

`SystemLanguageModel.Adapter` is **`obsoleted: 27.0`** (and was
`deprecated: 26.4`). Code that compiled against 26.x stops compiling when the
deployment target moves to 27:

- `SystemLanguageModel(adapter:guardrails:)`
- `Adapter(fileURL:)`, `Adapter(name:)`, `Adapter.compile()`
- `Adapter.compatibleAdapterIdentifiers(name:)`, `Adapter.removeObsoleteAdapters()`

If a project still loads a custom LoRA adapter, flag this before the migration
rather than after the build breaks.

## Deprecated in 27.0

`LanguageModelSession.GenerationError` cases each map to a `LanguageModelError`
case. Keep handling the old ones while the deployment target is < 27, but write
new code against `LanguageModelError`.

| Deprecated `GenerationError` case | Replacement |
|---|---|
| `.exceededContextWindowSize` | `LanguageModelError.contextSizeExceeded` |
| `.assetsUnavailable` | `SystemLanguageModel.Error.assetsUnavailable` |
| `.guardrailViolation` | `LanguageModelError.guardrailViolation` |
| `.unsupportedGuide` | `LanguageModelError.unsupportedGenerationGuide` |
| `.unsupportedLanguageOrLocale` | `LanguageModelError.unsupportedLanguageOrLocale` |
| `.decodingFailure` | `GeneratedContent.ParsingError` |
| `.rateLimited` | `LanguageModelError.rateLimited` |
| `.concurrentRequests` | `LanguageModelSession.Error.concurrentRequests` |

`GenerationOptions.sampling` is renamed to `.samplingMode` (the old name still
works, `@backDeployed` before 27).

**This one is an SDK boundary, not a deployment-target boundary.** The
`samplingMode:` initializer label requires the **Xcode 27 SDK** even at an iOS
26.0 deployment target. Under Xcode 26 the compiler insists on `sampling:`:

```
error: incorrect argument label in call
       (have 'samplingMode:temperature:', expected 'sampling:temperature:')
```

If a project must build on both toolchains, use `sampling:`.

## Writing code that spans both

Gate at the narrowest scope that works. Prefer annotating the declaration:

```swift ios26.0 sdk27
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func deepAnswer(to question: String) async throws -> String {
    let session = LanguageModelSession(model: PrivateCloudComputeLanguageModel())
    return try await session.respond(
        to: question,
        contextOptions: ContextOptions(reasoningLevel: .deep)
    ).content
}
```

…and fall back at the call site:

```swift ios26.0 sdk27
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func answer(to question: String) async throws -> String {
    if #available(iOS 27.0, macOS 27.0, *) {
        return try await deepAnswer(to: question)
    }
    let session = LanguageModelSession()
    return try await session.respond(to: question).content
}

@available(iOS 27.0, macOS 27.0, *)
private func deepAnswer(to question: String) async throws -> String {
    let session = LanguageModelSession(model: PrivateCloudComputeLanguageModel())
    return try await session.respond(
        to: question,
        contextOptions: ContextOptions(reasoningLevel: .deep)
    ).content
}
```

Verify the whole file compiles at the *lowest* target you support:

```
scripts/fm-check.sh Feature.swift --target ios26.0
```
