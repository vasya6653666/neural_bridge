# Errors, guardrails, and limits

## Contents

- [Availability](#availability-comes-first)
- [Error taxonomy](#error-taxonomy)
- [Guardrails](#guardrails)
- [Context limits](#context-limits)
- [Transcript error policy](#transcript-error-policy-270)
- [Token accounting](#token-accounting-270)

## Availability comes first

Nothing else matters if the model isn't there. `availability` is not a boolean —
handle each reason, because they need different UI.

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
enum AssistantState {
    case ready
    case unsupportedDevice
    case needsAppleIntelligence
    case downloading
}

@available(iOS 26.0, macOS 26.0, *)
func currentState() -> AssistantState {
    switch SystemLanguageModel.default.availability {
    case .available:
        return .ready
    case .unavailable(.deviceNotEligible):
        return .unsupportedDevice
    case .unavailable(.appleIntelligenceNotEnabled):
        return .needsAppleIntelligence
    case .unavailable(.modelNotReady):
        return .downloading
    @unknown default:
        return .unsupportedDevice
    }
}
```

| Reason | What to show |
|---|---|
| `.deviceNotEligible` | hide the feature; ship the non-AI path |
| `.appleIntelligenceNotEnabled` | point the user at Settings |
| `.modelNotReady` | assets are still downloading — retry later, don't error |

`.modelNotReady` is transient and common on a fresh device. Treat it as "not
yet", never as "not supported".

PCC has its own, shorter list — `.deviceNotEligible` and `.systemNotReady`:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func cloudReady() -> Bool {
    PrivateCloudComputeLanguageModel().isAvailable
}
```

## Error taxonomy

This trips people up. The types are split by *what* failed:

| Enum | Since | Cases |
|---|---|---|
| `LanguageModelError` | 27.0 | `contextSizeExceeded`, `rateLimited`, `guardrailViolation`, `refusal`, `unsupportedCapability`, `unsupportedTranscriptContent`, `unsupportedGenerationGuide`, `unsupportedLanguageOrLocale`, `timeout` |
| `LanguageModelSession.Error` | 27.0 | `concurrentRequests`, `transcriptMutationWhileResponding` |
| `SystemLanguageModel.Error` | 27.0 | `assetsUnavailable` |
| `PrivateCloudComputeLanguageModel.Error` | 27.0 | `networkFailure`, `quotaLimitReached`, `serviceUnavailable` |

Do not expect `quotaLimitReached` on `LanguageModelError` — it is PCC-specific.

Tool failures are the important non-enum exception:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func run(_ session: LanguageModelSession) async {
    do {
        _ = try await session.respond(to: "Use the appropriate tool.")
    } catch let error as LanguageModelSession.ToolCallError {
        print("Tool \(error.tool.name) failed: \(error.underlyingError)")
    } catch {
        print("Model request failed: \(error)")
    }
}
```

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func ask(_ session: LanguageModelSession, _ prompt: String) async -> String {
    do {
        return try await session.respond(to: prompt).content
    } catch let error as LanguageModelError {
        switch error {
        case .contextSizeExceeded(let info):
            return "Conversation too long (\(info.tokenCount)/\(info.contextSize) tokens)."
        case .guardrailViolation:
            return "I can't help with that."
        case .refusal(let refusal):
            // `explanation` is generated on demand — it is `get async throws`.
            return (try? await refusal.explanation.content) ?? "I can't help with that."
        case .rateLimited:
            return "Slow down a moment."
        case .timeout:
            return "That took too long."
        default:
            return "Something went wrong."
        }
    } catch let error as PrivateCloudComputeLanguageModel.Error {
        switch error {
        case .quotaLimitReached:
            return "You've hit the free cloud limit for now."
        case .networkFailure, .serviceUnavailable:
            return "Cloud model unreachable — try on-device."
        @unknown default:
            return "Cloud model unavailable."
        }
    } catch {
        return "Something went wrong."
    }
}
```

Each associated value carries `debugDescription` and `metadata` for logging.

`Refusal` is the odd one out: its `explanation` is **not** a stored string. It
is declared `get async throws` and returns a `LanguageModelSession.Response<String>`
— the model writes the explanation when you ask for it. There is also
`explanationStream` if you want to stream it into the UI:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func streamRefusal(_ refusal: LanguageModelError.Refusal) async throws {
    for try await snapshot in refusal.explanationStream {
        print(snapshot.content)
    }
}
```

Prefer the generated explanation over inventing your own copy — it is specific
to what was actually refused.

### On iOS 26

`LanguageModelSession.GenerationError` is the only enum, and every case above
maps onto it. It is deprecated in 27 but still compiles. If your deployment
target is 26, catch that instead — see the mapping table in
`availability-matrix.md`.

## Guardrails

Two presets:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func permissiveModel() -> SystemLanguageModel {
    SystemLanguageModel(guardrails: .permissiveContentTransformations)
}
```

- `.default` — full safety filtering on input and output.
- `.permissiveContentTransformations` — for transforming content the user
  already has (rewriting their own text, summarizing a document they opened).
  It relaxes filtering on *transformation*; it is not a jailbreak switch, and
  refusals still happen.

`guardrailViolation` fires on input **or** output. When it fires mid-stream you
may already have shown partial text — decide up front whether to clear it.

A guardrail violation is not a bug to retry in a loop. Retrying an identical
prompt yields an identical refusal.

## Context limits

The on-device model's window is small. Check before you send:

```swift
import FoundationModels

@available(iOS 26.4, macOS 26.4, *)
func fits(_ prompt: String, in model: SystemLanguageModel) async throws -> Bool {
    let count = try await model.tokenCount(for: Prompt(prompt))
    return count < model.contextSize / 2   // leave room for the response
}
```

`tokenCount(for:)` is 26.4+ and overloads on `Prompt`, `Instructions`,
`[any Tool]`, `GenerationSchema`, and `[Transcript.Entry]` — the tool overload
is the one people forget, and tool schemas are often the biggest fixed cost.

When you exceed it you get `contextSizeExceeded` carrying both numbers. The fix
is compaction, not a bigger prompt — see `agentic-profiles.md`.

## Transcript error policy (27.0)

After a failed turn, the transcript is rolled back by default.

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func preserving(_ session: LanguageModelSession) {
    session.transcriptErrorHandlingPolicy = .preserveTranscript
}
```

| Policy | Behavior |
|---|---|
| `.revertTranscript` | default — the failed turn disappears |
| `.preserveTranscript` | the turn stays; **you** must repair it |

Choose `.preserveTranscript` only if you actually handle the broken state.
Leaving a half-finished tool call in the transcript confuses the next turn.

Mutating the transcript while a response is in flight throws
`transcriptMutationWhileResponding`. Guard on `isResponding`.

## Token accounting (27.0)

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func report(_ response: LanguageModelSession.Response<String>) -> String {
    let usage = response.usage
    return """
    in:  \(usage.input.totalTokenCount) (\(usage.input.cachedTokenCount) cached)
    out: \(usage.output.totalTokenCount) (\(usage.output.reasoningTokenCount) reasoning)
    """
}
```

`cachedTokenCount` is the KV-cache diagnostic: if it collapses between turns,
something invalidated the cache — usually a changed instruction set, tool list,
or rewritten history.
