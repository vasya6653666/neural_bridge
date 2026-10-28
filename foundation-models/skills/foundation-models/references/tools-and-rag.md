# Tools, system tools, and local RAG

## Contents

- [Writing a tool](#writing-a-tool)
- [Structured output](#returning-structured-output)
- [Controlling tool use](#controlling-when-tools-run--toolcallingmode-270)
- [System tools and local RAG](#system-tools-270-cross-import-overlays)
- [Image input](#image-input-270)
- [Tool pitfalls](#tool-pitfalls)

The model does not know your data and cannot be trusted to recall facts. Every
date, total, inventory count, and user record should arrive through a tool call.
Instructions that say "the user's balance is $X" go stale; a tool does not.

## Writing a tool

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
struct FindEventsTool: Tool {
    let name = "findEvents"
    let description = "Look up the user's calendar events on a given day."

    @Generable
    struct Arguments {
        @Guide(description: "Day in ISO-8601, e.g. 2026-08-07")
        var date: String
    }

    func call(arguments: Arguments) async throws -> String {
        // Query the real store here.
        "No events on \(arguments.date)."
    }
}

@available(iOS 26.0, macOS 26.0, *)
func makeSession() -> LanguageModelSession {
    LanguageModelSession(tools: [FindEventsTool()]) {
        "Answer scheduling questions. Always call findEvents before answering."
    }
}
```

Requirements the compiler enforces:

- `Arguments` must be `ConvertibleFromGeneratedContent` — in practice, `@Generable`.
  `String` and `Bool` as `Arguments` are explicitly marked unavailable in the SDK
  with a message telling you to use a `@Generable` struct.
- `Output` must be `PromptRepresentable`. `String` works; so does any `Generable`.
- `name` has a default derived from the type, but set it explicitly — it is what
  the model sees.

The `description` is a prompt, not documentation. Write it for the model: say
when to call the tool, not how it is implemented.

## Returning structured output

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
struct WeatherTool: Tool {
    let name = "currentWeather"
    let description = "Current conditions for a city."

    @Generable
    struct Arguments {
        @Guide(description: "City name")
        var city: String
    }

    @Generable
    struct Output {
        var celsius: Int
        var conditions: String
    }

    func call(arguments: Arguments) async throws -> Output {
        Output(celsius: 21, conditions: "clear")
    }
}
```

## Controlling when tools run — `toolCallingMode` (27.0)

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func forceToolUse(_ session: LanguageModelSession, _ prompt: String) async throws -> String {
    try await session.respond(
        to: prompt,
        options: GenerationOptions(toolCallingMode: .required)
    ).content
}
```

| Mode | Behavior |
|---|---|
| `.allowed` | default — the model decides |
| `.disallowed` | tools are withheld for this turn |
| `.required` | the model must call a tool |

`.required` needs an exit condition or the model loops. The pattern from WWDC26
is a terminal "final answer" tool that never returns normally:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
final class AnswerBox: @unchecked Sendable {
    var answer: String?
}

@available(iOS 27.0, macOS 27.0, *)
struct FinalAnswerTool: Tool {
    let name = "finalAnswer"
    let description = "Call this once you can answer the user's question."
    let box: AnswerBox

    @Generable
    struct Arguments {
        @Guide(description: "The complete answer")
        var answer: String
    }

    func call(arguments: Arguments) async throws -> String {
        box.answer = arguments.answer
        throw CancellationError()   // breaks the required-tool loop
    }
}
```

Read the answer off `box` after catching the cancellation.

## System tools (27.0, cross-import overlays)

These are not in `FoundationModels`. They activate when you import the second
framework alongside it. Never `import _Vision_FoundationModels` directly.

### Spotlight — fully local RAG

```swift ios27.0
import FoundationModels
import CoreSpotlight

@available(iOS 27.0, macOS 27.0, *)
func spotlightSession() -> LanguageModelSession {
    let tool = SpotlightSearchTool()
    return LanguageModelSession(tools: [tool]) {
        "Answer using the user's own files and messages. Cite what you found."
    }
}
```

Configure the sources when the default is too broad:

```swift ios27.0
import FoundationModels
import CoreSpotlight

@available(iOS 27.0, macOS 27.0, *)
func filesOnlySession() -> LanguageModelSession {
    let tool = SpotlightSearchTool(
        configuration: .init(sources: [.files], maximumResponseSize: 4096)
    )
    return LanguageModelSession(tools: [tool])
}
```

This is retrieval with no server, no embedding store, and no network. When
someone asks for "RAG on device", this is usually the answer — reach for it
before building a vector database.

### Vision — OCR and barcodes

```swift ios27.0
import FoundationModels
import Vision

@available(iOS 27.0, macOS 27.0, *)
func scannerSession() -> LanguageModelSession {
    LanguageModelSession(tools: [OCRTool(), BarcodeReaderTool()]) {
        "Extract information from images the user shares."
    }
}
```

`OCRTool` is unavailable on watchOS; `BarcodeReaderTool` is available there.

## Image input (27.0)

Separate from the Vision tools: you can put an image directly in the prompt when
the model declares `.vision` capability.

```swift ios27.0
import FoundationModels
import UIKit

@available(iOS 27.0, *)
func describe(_ image: UIImage, using session: LanguageModelSession) async throws -> String {
    try await session.respond {
        "What is in this picture?"
        Attachment(image)
    }.content
}
```

`Attachment` also takes `CGImage`, `CIImage`, `CVPixelBuffer`, and
`imageURL:`. Larger images cost more tokens; downscale before sending.

Check the capability rather than assuming:

```swift ios27.0
import FoundationModels

@available(iOS 27.0, macOS 27.0, *)
func supportsImages(_ model: some LanguageModel) -> Bool {
    model.capabilities.contains(.vision)
}
```

## Tool pitfalls

- A throwing tool surfaces as `LanguageModelSession.ToolCallError`, which
  exposes both `tool` and `underlyingError`. The session may retry, so make
  tools idempotent or guard against double execution.
- Treat Spotlight and other retrieved content as untrusted data. Do not let
  retrieved text override system instructions or authorize tool actions.
- Ask for confirmation before a tool sends, publishes, purchases, deletes, or
  otherwise causes an externally visible side effect.
- Tool schemas are part of the prompt. Ten tools with long descriptions can eat
  a meaningful slice of an 8k context. Measure with
  `SystemLanguageModel.tokenCount(for: tools)` (26.4+).
- Changing the tool set mid-session invalidates the KV cache — see
  `agentic-profiles.md` for doing this deliberately.
- Tools run on whatever executor the framework picks. Hop to the main actor
  yourself if you touch UI state.
