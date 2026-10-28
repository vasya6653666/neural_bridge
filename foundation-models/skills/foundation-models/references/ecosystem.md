# Ecosystem — and what this skill deliberately leaves out

## Contents

- [`foundation-models-utilities`](#applefoundation-models-utilities)
- [Third-party and custom models](#third-party-and-custom-models-270)
- [`fm` CLI and Python SDK](#fm-cli-and-python-sdk--macos-27-only)
- [Open source](#open-source)
- [Community](#community)

This skill covers the **`FoundationModels` framework itself**. Adjacent things
have their own, better sources. Point at them instead of paraphrasing.

## `apple/foundation-models-utilities`

<https://github.com/apple/foundation-models-utilities> — Apache-2.0, Apple's own
Swift package of "emerging and experimental patterns". Requires **27.0+**, and
supports Apple platforms plus some Linux distributions.

Add it via SwiftPM:

```
https://github.com/apple/foundation-models-utilities
```

Three feature areas, each behind a SwiftPM trait (all on by default):

| Trait | Provides |
|---|---|
| `ChatCompletions` | `ChatCompletionsLanguageModel` — drives any OpenAI-compatible `/chat/completions` endpoint through `LanguageModelSession` |
| `Skills` | `Skill`, `Skills`, `SkillActivations`, `SkillsBuilder` — instructions the model activates on demand via a tool call |
| `History` | `summarizeHistory(entryThreshold:model:)`, `rollingWindow(entries:)`, `droppingCompletedToolCalls()` |

**Check here before hand-rolling history compaction.** The modifiers in
`agentic-profiles.md` are worth understanding, but this package already ships
tested versions, and they compose outside-in:

```
Profile { … }
  .summarizeHistory(entryThreshold: 10, model: summarizer)
  .rollingWindow(entries: 10)
  .droppingCompletedToolCalls()
```

Its `Skills` type is worth knowing about because the naming collides with this
plugin's. They are unrelated: `FoundationModelsUtilities.Skill` is runtime
context injected into a *model's* transcript; an Agent Skill is a directory of
Markdown that configures a *coding agent*.

The one design detail that matters when choosing between its two initializers:

- `Skill(name:description:prompt:)` — content lands in a tool output, so the
  KV cache survives.
- `Skill(name:description:instructions:)` — content is spliced into the first
  instructions entry, which models weight more heavily but **invalidates the
  cache**.

### It ships its own agent skills

The repo has a `skills/` directory with two skills. If the user is working with
that package, install those rather than asking this skill to reconstruct them:

| Skill | Scope |
|---|---|
| `foundation-models-utilities` | using the package — chat completions client, `Skills`, history modifiers |
| `foundation-models-language-model-protocol` | writing a `LanguageModel` / `LanguageModelExecutor` adapter for a server model |

This plugin does not duplicate either.

## Third-party and custom models (27.0)

The `LanguageModel` protocol makes the session model-agnostic. Anthropic and
Google publish Swift packages so a frontier model backs the same
`LanguageModelSession` API, and community packages exist for local runtimes.

To write your own adapter, use Apple's
`foundation-models-language-model-protocol` skill above. In outline you provide:

```swift ios27.0
import Foundation
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
struct MyExecutor: LanguageModelExecutor {
    typealias Model = MyModel
    struct Configuration: Hashable, Sendable { var endpoint: URL }
    let configuration: Configuration

    init(configuration: Configuration) { self.configuration = configuration }

    func respond(
        to request: LanguageModelExecutorGenerationRequest,
        model: MyModel,
        streamingInto channel: LanguageModelExecutorGenerationChannel
    ) async throws {
        // Translate the request, call your API, stream events into `channel`.
    }
}

@available(iOS 27.0, macOS 27.0, *)
struct MyModel: LanguageModel {
    typealias Executor = MyExecutor
    var capabilities: LanguageModelCapabilities { .init([.toolCalling]) }
    var executorConfiguration: MyExecutor.Configuration {
        .init(endpoint: URL(string: "https://api.example.com")!)
    }
}
```

Declare capabilities honestly. If you omit `.vision` and a caller attaches an
image, the framework throws `unsupportedCapability` for you — you don't write
that check.

**Credentials:** never ship an API key in the app binary. Use OAuth, store
tokens in the Keychain, and track `response.usage` if the provider bills by
token.

## `fm` CLI and Python SDK — macOS 27 only

macOS 27 adds an `fm` command-line tool (`fm chat`, `fm "prompt" file.jpg`) and
a Python SDK for scripting and research.

Neither is relevant to building an iOS app, and neither exists on macOS 26.
Mention them if the user asks about shell scripting or data work; never make a
workflow depend on them. This plugin's scripts deliberately do not.

## Open source

Apple has said the framework is going open source, runnable wherever Swift runs
(including Linux servers), with integrations for Anthropic, Google, Core AI, and
MLX. Treat specifics as moving — check the repo rather than quoting a version.

## Community

Useful, but verify anything version-specific against `scripts/fm-api.sh` before
repeating it. Most community material dates from the iOS 26 cycle and predates
`DynamicProfile`, PCC, attachments, and the `LanguageModelError` split. A post
that says "Foundation Models has no reasoning" was true when written.
