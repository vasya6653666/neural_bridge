# Dynamic Profiles — agentic sessions (iOS 27+)

## Contents

- [Shape](#shape)
- [`DynamicInstructions`](#dynamicinstructions--composable-instruction--tool-bundles)
- [Modifiers](#modifiers)
- [Session properties](#session-properties)
- [Custom modifiers](#custom-modifiers)
- [Orchestration patterns](#orchestration-patterns)
- [Cost of rewriting history](#cost-of-rewriting-history)

Everything here requires the **Xcode 27 SDK** and a 27.0 deployment target.
None of it exists on iOS 26. Check with `scripts/fm-env.sh` before writing it.

The idea: instead of tearing down a session to change instructions, tools, or
even the model, you declare a `DynamicProfile` whose `body` recomputes from
observable state — SwiftUI's model, applied to a conversation. The transcript
survives the switch.

## Shape

```swift ios27.0
import FoundationModels
import Observation

@available(iOS 27.0, macOS 27.0, *)
struct NoteTool: Tool {
    let name = "saveNote"
    let description = "Save a note for the user."
    @Generable struct Arguments {
        @Guide(description: "Note body")
        var text: String
    }
    func call(arguments: Arguments) async throws -> String { "saved" }
}

@available(iOS 27.0, macOS 27.0, *)
@Observable
final class Orchestrator {
    enum Mode { case brainstorm, review }
    var mode: Mode = .brainstorm
}

@available(iOS 27.0, macOS 27.0, *)
struct AssistantProfile: LanguageModelSession.DynamicProfile {
    let orchestrator: Orchestrator

    var body: some LanguageModelSession.DynamicProfile {
        switch orchestrator.mode {
        case .brainstorm:
            Profile {
                Instructions { "You are a warm brainstorm facilitator." }
                NoteTool()
            }
            .temperature(1.0)
            .reasoningLevel(.light)

        case .review:
            Profile {
                Instructions { "You are a blunt, precise reviewer." }
            }
            .toolCallingMode(.disallowed)
            .reasoningLevel(.deep)
        }
    }
}

@available(iOS 27.0, macOS 27.0, *)
func makeSession(_ orchestrator: Orchestrator) -> LanguageModelSession {
    LanguageModelSession(profile: AssistantProfile(orchestrator: orchestrator))
}
```

Mutating `orchestrator.mode` changes which profile is active on the next turn.
No new session, no lost history.

`@Observable` lives in the `Observation` module. `import SwiftUI` re-exports it;
in a plain Swift file you need `import Observation` explicitly.

## `DynamicInstructions` — composable instruction + tool bundles

Group instructions with the tools they need, then reuse the bundle across
profiles:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
struct LookupTool: Tool {
    let name = "lookup"
    let description = "Look up a term in the project glossary."
    @Generable struct Arguments {
        @Guide(description: "Term to look up")
        var term: String
    }
    func call(arguments: Arguments) async throws -> String { "…" }
}

@available(iOS 27.0, macOS 27.0, *)
struct GlossaryExpert: DynamicInstructions {
    var body: some DynamicInstructions {
        Instructions { "Prefer project vocabulary. Look terms up before guessing." }
        LookupTool()
    }
}

@available(iOS 27.0, macOS 27.0, *)
struct WriterProfile: LanguageModelSession.DynamicProfile {
    let useGlossary: Bool

    var body: some LanguageModelSession.DynamicProfile {
        Profile {
            Instructions { "You draft release notes." }
            if useGlossary {
                GlossaryExpert()
            }
        }
    }
}
```

The builder accepts `Instructions`, any `Tool`, any `DynamicInstructions`, and
`if`/`switch` between them.

## Modifiers

Verified against the SDK. All return `some DynamicProfile`, so they chain.

| Modifier | Purpose |
|---|---|
| `.model(_:)` | swap the backing model for this profile |
| `.temperature(_:)` / `.samplingMode(_:)` | sampling |
| `.maximumResponseTokens(_:)` | output cap |
| `.reasoningLevel(_:)` | `.light` / `.moderate` / `.deep` / `.custom(String)` |
| `.toolCallingMode(_:)` | `.allowed` / `.required` / `.disallowed` |
| `.historyTransform(_:)` | stateless per-request rewrite of history |
| `.transcriptErrorHandlingPolicy(_:)` | `.revertTranscript` / `.preserveTranscript` |
| `.onPrompt` / `.onResponse` / `.onReasoning` | lifecycle hooks |
| `.onToolCall` / `.onToolOutput` | tool lifecycle hooks |
| `.onActivate` / `.onDeactivate` | profile switch hooks |
| `.modifier(_:)` | apply a custom `DynamicProfileModifier` |

Mixing models per profile is the point of `.model(_:)` — cheap on-device work
for the common path, PCC for the hard step:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
struct TieredProfile: LanguageModelSession.DynamicProfile {
    let needsDeepThought: Bool

    var body: some LanguageModelSession.DynamicProfile {
        if needsDeepThought {
            Profile { Instructions { "Solve carefully." } }
                .model(PrivateCloudComputeLanguageModel())
                .reasoningLevel(.deep)
        } else {
            Profile { Instructions { "Answer briefly." } }
                .model(SystemLanguageModel.default)
        }
    }
}
```

## Session properties

State that lives with the session rather than your view model:

```swift ios27.0
import FoundationModels

extension SessionPropertyValues {
    @SessionPropertyEntry var summary: String?
}

@available(iOS 27.0, macOS 27.0, *)
struct SummarizingProfile: LanguageModelSession.DynamicProfile {
    @LanguageModelSession.SessionProperty(\.summary) var summary

    var body: some LanguageModelSession.DynamicProfile {
        Profile {
            Instructions { "A helpful assistant." }
        }
        .onResponse {
            // Compact the conversation once it gets long.
        }
    }
}
```

## Custom modifiers

Wrap a recurring combination once:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
struct RollingWindowModifier: LanguageModelSession.DynamicProfileModifier {
    let entries: Int

    func body(content: Content) -> some LanguageModelSession.DynamicProfile {
        content.historyTransform { history in
            Array(history.suffix(entries))
        }
    }
}

@available(iOS 27.0, macOS 27.0, *)
extension LanguageModelSession.DynamicProfile {
    func rollingWindow(entries: Int) -> some LanguageModelSession.DynamicProfile {
        modifier(RollingWindowModifier(entries: entries))
    }
}
```

Before writing your own, check `apple/foundation-models-utilities` — it ships
`rollingWindow(entries:)`, `droppingCompletedToolCalls()`, and
`summarizeHistory(entryThreshold:model:)` already. See `ecosystem.md`.

## Orchestration patterns

### Baton pass — hand off, keep the transcript

Two profiles share one history. A tool flips the mode; the receiving profile
answers.

```swift ios27.0
import FoundationModels
import Observation

@available(iOS 27.0, macOS 27.0, *)
@Observable
final class Flow {
    enum Stage { case gather, draft }
    var stage: Stage = .gather
}

@available(iOS 27.0, macOS 27.0, *)
struct HandoffTool: Tool {
    let name = "startDrafting"
    let description = "Call when you have gathered enough detail to draft."
    @Generable struct Arguments {
        @Guide(description: "What was gathered")
        var notes: String
    }
    func call(arguments: Arguments) async throws -> String { arguments.notes }
}

@available(iOS 27.0, macOS 27.0, *)
struct FlowProfile: LanguageModelSession.DynamicProfile {
    let flow: Flow

    var body: some LanguageModelSession.DynamicProfile {
        switch flow.stage {
        case .gather:
            Profile {
                Instructions { "Ask clarifying questions until the brief is clear." }
                HandoffTool()
            }
            .onToolCall { _ in flow.stage = .draft }
        case .draft:
            Profile {
                Instructions { "Write the final draft from the conversation above." }
            }
        }
    }
}
```

### Phone a friend — consult, discard

A tool spins up a short-lived child session. The child's transcript is thrown
away; only its answer returns to the parent. Use this when the sub-task would
otherwise pollute the main context.

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
struct ConsultTool: Tool {
    let name = "consultSpecialist"
    let description = "Ask a specialist a self-contained question."

    @Generable struct Arguments {
        @Guide(description: "A fully self-contained question")
        var question: String
    }

    func call(arguments: Arguments) async throws -> String {
        let child = LanguageModelSession(model: PrivateCloudComputeLanguageModel()) {
            "You are a domain specialist. Answer precisely and briefly."
        }
        return try await child.respond(
            to: arguments.question,
            contextOptions: ContextOptions(reasoningLevel: .deep)
        ).content
    }
}
```

## Cost of rewriting history

The KV cache is preserved when you **append** and invalidated when you
**rewrite** — and that includes changing instructions or the tool set, which is
exactly what switching profiles does. That is a real latency cost, not a
theoretical one.

- Switch profiles at natural boundaries, not every turn.
- Prefer `historyTransform` that keeps a stable prefix.
- Measure with the **Foundation Models** Instruments template; see
  `testing-and-performance.md`.

Rewriting history also changes accuracy, sometimes badly — a model that can no
longer see why it called a tool may repeat it. Evaluate before shipping a
compaction strategy.
