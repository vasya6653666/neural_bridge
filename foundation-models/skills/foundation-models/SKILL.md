---
name: foundation-models
description: Use when writing, reviewing, or debugging Swift that imports FoundationModels or uses Apple Intelligence, on-device LLMs, LanguageModelSession, @Generable/@Guide, Tool calling, streaming, DynamicProfile agents, PrivateCloudComputeLanguageModel, reasoning, image attachments, Spotlight/OCR tools, availability gates, guardrails, or context limits.
license: MIT
---

# Apple Foundation Models

The API surface more than doubled between iOS 26 and iOS 27. Model training
data does not cover it, and published summaries get version boundaries wrong.
**Do not write this framework from memory.**

Three commands make that unnecessary. Use them.

Run the verification scripts on macOS with Bash, local shell execution, and
full Xcode 26+; use Xcode 27 for iOS 27 APIs. The framework targets
iOS/macOS/visionOS 26–27 and watchOS 27. tvOS is unsupported.

## Step 1 — find out what SDK is installed

```
scripts/fm-env.sh
```

Reports the SDK path, the generation (**26** or **27**), and which cross-import
overlays exist. If it reports generation 26, then `DynamicProfile`, `Profile`,
`PrivateCloudComputeLanguageModel`, `ContextOptions`, `Attachment`,
`LanguageModelError`, `toolCallingMode`, `Usage`, `SpotlightSearchTool`,
`OCRTool` and `BarcodeReaderTool` **do not exist yet**. Say so instead of
writing code the user cannot build.

## Step 2 — verify every API before you use it

```
scripts/fm-api.sh <Symbol>
```

Prints the enclosing top-level declaration when applicable, the real
`@available` attributes, and the SDK file:line. Never state an introducing
version you have not checked here — the
boundaries are genuinely counterintuitive (`tokenCount` is 26.4;
`SystemLanguageModel.Adapter` is *removed* in 27).

## Step 3 — type-check before you present code

```
scripts/fm-check.sh Feature.swift --target ios26.0
```

Defaults to `ios26.0`, the strictest realistic deployment target, so
availability mistakes surface immediately. Use `--target ios27.0` for code that
intentionally requires iOS 27. It accepts stdin (`-`) for quick snippets.

This catches invented parameters *and* missing `@available` gates in about a
second. Run it on any non-trivial Foundation Models code before showing it.

## Which model

| Model | Since | Use when |
|---|---|---|
| `SystemLanguageModel.default` | 26.0 | default choice — free, offline, private, small context |
| `SystemLanguageModel(useCase: .contentTagging)` | 26.0 | tagging, classification, extraction |
| `PrivateCloudComputeLanguageModel()` | 27.0 | needs a big context or real reasoning; no API key, still private, subject to quota |
| any `LanguageModel` conformer | 27.0 | third-party/frontier or self-hosted models |

Start on-device. Escalate to PCC only for the step that needs it — see
`references/agentic-profiles.md` for mixing both in one session.

## Minimum correct shape

Availability gate, session, typed output, and an explicit fallback:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Summary {
    @Guide(description: "One-sentence headline")
    var headline: String
    @Guide(description: "Key points", .count(2...5))
    var points: [String]
}

@available(iOS 26.0, macOS 26.0, *)
enum SummaryResult {
    case generated(Summary)
    case unavailable
    case failed(any Error)
}

@available(iOS 26.0, macOS 26.0, *)
func summarize(_ article: String) async -> SummaryResult {
    guard case .available = SystemLanguageModel.default.availability else {
        return .unavailable // caller presents its non-AI path
    }
    let session = LanguageModelSession {
        "Summarize articles for a busy reader. Be concrete."
    }
    do {
        let summary = try await session.respond(
            to: "Summarize:\n\(article)",
            generating: Summary.self
        ).content
        return .generated(summary)
    } catch {
        return .failed(error)
    }
}
```

## References

Load only what the task needs.

| File | Read it when |
|---|---|
| `references/availability-matrix.md` | any "which iOS version" question; migrating 26 → 27 |
| `references/guided-generation.md` | `@Generable`, `@Guide`, runtime/recursive schemas, `GeneratedContent` |
| `references/tools-and-rag.md` | `Tool` conformance, tool-calling modes, Spotlight RAG, OCR/barcode, image input |
| `references/streaming-and-ui.md` | `streamResponse`, partial snapshots, SwiftUI wiring, `prewarm` |
| `references/agentic-profiles.md` | `DynamicProfile`, multi-agent orchestration, history compaction (27.0) |
| `references/errors-and-limits.md` | availability reasons, error taxonomy, guardrails, context limits, token usage |
| `references/testing-and-performance.md` | testability, determinism, the Instruments template, what actually costs time |
| `references/ecosystem.md` | `foundation-models-utilities`, custom `LanguageModel` adapters, `fm` CLI |

## Non-negotiables

**Availability**
- Branch on `SystemLanguageModel.availability`, never assume. Handle
  `.deviceNotEligible`, `.appleIntelligenceNotEnabled`, and `.modelNotReady`
  separately — the last is transient, not a failure.
- Always ship a working non-AI path. This feature is unavailable on a large
  share of installed devices.

**Correctness**
- Facts come from `Tool` calls, not from the model. Dates, totals, inventory,
  and user records must be retrieved, never recalled.
- Prefer `@Generable` over parsing strings. String parsing is where these
  features rot.
- Tool `Arguments` must be `@Generable`. `String` and `Bool` as `Arguments` are
  explicitly unavailable in the SDK.
- A guardrail violation is not retryable. The same prompt refuses again.

**Sessions**
- One request at a time. Concurrent `respond` throws `concurrentRequests`;
  guard with `isResponding`.
- Streaming snapshots are cumulative. Assign them; never append.
- Mutate `session.transcript` only when `isResponding == false` (27.0).

**Performance**
- Appending to a transcript preserves the KV cache. Changing instructions, the
  tool set, or history invalidates it — that includes switching profiles.
- Every property of a `@Generable` type is generated whether the UI reads it or
  not. Model only what you consume.
- Tool schemas are a fixed per-turn cost. Audit with `tokenCount(for: tools)`.

**Security**
- Keep service credentials on a backend. Store only user-owned credentials in
  Keychain, preferably obtained through OAuth.
- Treat retrieved text as untrusted data, not instructions. Require explicit
  confirmation before a tool performs an irreversible or externally visible action.

## Gotchas that cost real time

- `@Observable` needs `import Observation` — `import SwiftUI` re-exports it, a
  plain Swift file does not.
- `SpotlightSearchTool`, `OCRTool`, `BarcodeReaderTool` and
  `Attachment(UIImage:)` live in cross-import overlays. Import `CoreSpotlight`,
  `Vision`, or `UIKit` **alongside** `FoundationModels`. Never
  `import _Vision_FoundationModels`.
- `LanguageModelError.Refusal.explanation` is `get async throws` and returns a
  generated `Response<String>`, not a stored string.
- There are four error enums plus `LanguageModelSession.ToolCallError` — see
  `references/errors-and-limits.md`. `quotaLimitReached` is on
  `PrivateCloudComputeLanguageModel.Error`.
- `SystemLanguageModel.Adapter` is obsoleted in 27.0. Custom LoRA adapter code
  stops compiling when the deployment target moves.
- Some boundaries are the **SDK**, not the deployment target:
  `GenerationOptions(samplingMode:)` needs the Xcode 27 SDK even at an iOS 26
  target. Xcode 26 requires `sampling:`. `fm-check.sh` catches this; guessing
  does not.
