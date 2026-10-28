# Streaming and SwiftUI

## Contents

- [The shape of a stream](#the-shape-of-a-stream)
- [Streaming text](#streaming-text)
- [Streaming a generated type](#streaming-a-generable-type)
- [SwiftUI](#swiftui)
- [Prewarming](#prewarming)
- [One request at a time](#one-request-at-a-time)

On-device generation is slow enough that streaming is the default UX, not an
optimization. Stream unless you have a reason not to.

## The shape of a stream

`streamResponse` returns a `ResponseStream<Content>`, an `AsyncSequence` whose
`Element` is a `Snapshot`:

| `Snapshot` member | Since | Meaning |
|---|---|---|
| `content: Content.PartiallyGenerated` | 26.0 | the value so far |
| `rawContent: GeneratedContent` | 26.0 | untyped tree so far |
| `transcriptEntries: ArraySlice<Transcript.Entry>` | 27.0 | entries produced |
| `usage: LanguageModelSession.Usage` | 27.0 | running token counts |

Each snapshot is **cumulative**, not a delta. Assign it, don't append it — the
single most common streaming bug here is concatenating snapshots and getting
`HelloHello worldHello world today`.

## Streaming text

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func streamText(_ prompt: String) async throws {
    let session = LanguageModelSession()
    for try await snapshot in session.streamResponse(to: prompt) {
        print(snapshot.content)   // full text so far — replaces, never appends
    }
}
```

To get the final value with all the metadata, use `collect()` instead of
tracking the last snapshot yourself:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func streamThenCollect(_ prompt: String) async throws -> String {
    let session = LanguageModelSession()
    let stream = session.streamResponse(to: prompt)
    let response = try await stream.collect()
    return response.content
}
```

## Streaming a `@Generable` type

The payoff: partial structs, so the UI fills in field by field. Every property
of `PartiallyGenerated` is optional until it has been generated.

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Itinerary {
    @Guide(description: "Trip title")
    var title: String
    @Guide(description: "One line per day", .count(1...7))
    var days: [String]
}

@available(iOS 26.0, macOS 26.0, *)
func streamItinerary(_ session: LanguageModelSession) async throws {
    let stream = session.streamResponse(to: "Plan 3 days in Lisbon.",
                                        generating: Itinerary.self)
    for try await snapshot in stream {
        let partial = snapshot.content
        if let title = partial.title {
            print("title:", title)
        }
        if let days = partial.days {
            print("days so far:", days.count)
        }
    }
}
```

Because properties resolve in declaration order, put the field the user sees
first — a title, a headline — at the top of the struct. It makes the UI feel
immediate for free.

## SwiftUI

`LanguageModelSession` and `SystemLanguageModel` are both `@Observable`, so
`isResponding` and `availability` drive UI without any extra plumbing.

```swift
import SwiftUI
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Observable
@MainActor
final class SummaryViewModel {
    private(set) var text = ""
    private(set) var isRunning = false

    private let session = LanguageModelSession(
        instructions: "Summarize in two sentences."
    )

    func summarize(_ article: String) async {
        isRunning = true
        defer { isRunning = false }
        do {
            for try await snapshot in session.streamResponse(to: article) {
                text = snapshot.content        // assign, don't append
            }
        } catch {
            text = "Couldn't summarize: \(error.localizedDescription)"
        }
    }
}

@available(iOS 26.0, macOS 26.0, *)
struct SummaryView: View {
    @State private var model = SummaryViewModel()
    let article: String

    var body: some View {
        ScrollView {
            Text(model.text)
                .textSelection(.enabled)
                .animation(.default, value: model.text)
        }
        .overlay { if model.isRunning { ProgressView() } }
        .task { await model.summarize(article) }
    }
}
```

Notes that matter in practice:

- Drive the view from `@Observable` state on the main actor. Do not mutate
  SwiftUI state from the streaming task on a background executor.
- `.animation(.default, value:)` on streaming text gives a decent typewriter
  feel without hand-rolling one.
- Cancelling the enclosing `Task` cancels generation — `.task {}` already does
  this when the view disappears.

## Prewarming

`prewarm()` loads model assets ahead of the first request. Call it when intent
becomes likely — a sheet opening, a text field gaining focus — not on app
launch, where it competes with everything else.

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func prepare(_ session: LanguageModelSession) {
    session.prewarm()
}
```

If you already know how the prompt starts, pass the prefix so the KV cache is
populated too:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func prepare(_ session: LanguageModelSession, article: String) {
    session.prewarm(promptPrefix: Prompt("Summarize the following article:"))
}
```

## One request at a time

A session serializes requests. Starting a second while the first is in flight
throws `LanguageModelSession.Error.concurrentRequests` (27.0; on 26.x the
equivalent `GenerationError` case). Guard with `isResponding`:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func ask(_ session: LanguageModelSession, _ prompt: String) async throws -> String? {
    guard !session.isResponding else { return nil }
    return try await session.respond(to: prompt).content
}
```

For genuinely concurrent work, create separate sessions — but remember each one
carries its own transcript and its own context budget.
