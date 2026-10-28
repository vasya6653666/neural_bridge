# Testing and performance

## Contents

- [Test on a device or Simulator](#test-on-a-device-or-simulator-not-the-host-mac)
- [Make output testable](#make-output-testable)
- [Isolate the model in unit tests](#isolate-the-model-in-unit-tests)
- [Foundation Models Instrument](#the-foundation-models-instrument)
- [Performance costs](#what-actually-costs-time)
- [Evaluations](#evaluations)
- [Sanity-check the code](#sanity-check-the-code-itself)

## Test on a device or Simulator, not the host Mac

Your Mac having a working on-device model says nothing about the iPhone your
feature ships to. Context size, latency, and eligibility all differ. Run the
Simulator or a device.

Nothing in this plugin executes the model — the scripts only read the SDK and
type-check. Behavioral testing is yours to run in the app.

## Make output testable

Model output is nondeterministic, so assert on shape, not on prose. This is
another argument for `@Generable`: a typed result has properties you can check.

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Classification {
    @Guide(description: "One of: bug, feature, question")
    @Guide(.anyOf(["bug", "feature", "question"]))
    var kind: String

    @Guide(.range(1...5))
    var severity: Int
}
```

Now a test asserts `severity` is in range and `kind` is a known value — both
guaranteed by the schema — and you are really testing your prompt, not the
model's vocabulary.

Pin sampling when you need repeatability:

```swift ios26.0 sdk27
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func deterministicOptions() -> GenerationOptions {
    GenerationOptions(samplingMode: .greedy, temperature: 0)
}
```

> **SDK, not deployment target.** The `samplingMode:` label needs the **Xcode 27
> SDK**, even though it back-deploys to iOS 26.0. Building the same line with
> Xcode 26 fails with `incorrect argument label in call (have
> 'samplingMode:temperature:', expected 'sampling:temperature:')`. On Xcode 26,
> write `GenerationOptions(sampling: .greedy, temperature: 0)` — that spelling
> is deprecated but still compiles under Xcode 27.

`.greedy` removes sampling randomness. It does not make output identical across
OS versions or model updates — treat it as "less noisy", not "fixed".

Other sampling modes, from the SDK:

| Mode | Meaning |
|---|---|
| `.greedy` | always take the highest-probability token |
| `.random(top:seed:)` | top-k sampling with an optional seed |
| `.random(probabilityThreshold:seed:)` | nucleus sampling with an optional seed |

## Isolate the model in unit tests

Depend on `LanguageModelSession` behind your own protocol so tests don't need
Apple Intelligence enabled on CI:

```swift
import FoundationModels

protocol Summarizing: Sendable {
    func summarize(_ text: String) async throws -> String
}

@available(iOS 26.0, macOS 26.0, *)
struct ModelSummarizer: Summarizing {
    func summarize(_ text: String) async throws -> String {
        let session = LanguageModelSession(instructions: "Summarize in one line.")
        return try await session.respond(to: text).content
    }
}

struct StubSummarizer: Summarizing {
    let result: String
    func summarize(_ text: String) async throws -> String { result }
}
```

CI machines usually report `.unavailable(.deviceNotEligible)`. Any test that
requires a real generation must be skipped there, not failed.

## The Foundation Models Instrument

Xcode 27 ships a **Foundation Models** trace template
(`Instruments.app/Contents/Resources/templates/Foundation Models.tracetemplate`).
Use it to see:

- time to first token, and where it went
- tool call boundaries and durations
- **KV cache invalidations** — the number that explains mysterious latency

Profile with it before optimizing prompts by feel.

## What actually costs time

In rough order of impact on device:

1. **Cache invalidation.** The KV cache survives *appending* to a transcript.
   It does not survive changing instructions, changing the tool set, or
   rewriting history. Every profile switch does at least one of these.
2. **Prompt size.** Everything is quadratic-ish and the window is small. Tool
   schemas are a fixed cost paid on every turn — audit them with
   `tokenCount(for: tools)`.
3. **Oversized `@Generable` types.** Every property is generated whether or not
   the UI reads it.
4. **Cold start.** First request loads assets. `prewarm()` moves that cost to a
   moment the user isn't waiting.

Watch `usage.input.cachedTokenCount` across turns — a sudden drop to near zero
is a cache invalidation you probably didn't intend:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func cacheHitRate(_ usage: LanguageModelSession.Usage) -> Double {
    guard usage.input.totalTokenCount > 0 else { return 0 }
    return Double(usage.input.cachedTokenCount) / Double(usage.input.totalTokenCount)
}
```

## Evaluations

Apple ships an Evaluations framework for measuring feature quality as prompts
change. The important discipline, whatever you use:

- Fix a dataset of representative inputs before you start tuning.
- Change one thing at a time — instructions, guides, or model — never several.
- Re-measure after any history-compaction change. Dropping tool calls or
  summarizing history often looks free and quietly costs accuracy.

Do not ship a context-engineering strategy that you validated by trying three
prompts by hand.

## Sanity-check the code itself

Before presenting Foundation Models code, type-check it against the real SDK:

```
scripts/fm-check.sh Feature.swift --target ios26.0
```

That catches invented API and availability mistakes in about a second, which is
faster than a build and far faster than a failed review.
