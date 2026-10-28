# Guided generation

## Contents

- [`@Generable`](#generable)
- [`@Guide`](#guide)
- [Calling it](#calling-it)
- [Runtime schemas](#runtime-schemas--dynamicgenerationschema)
- [Reading `GeneratedContent`](#reading-generatedcontent)
- [Verify](#verify)

Guided generation constrains decoding to a schema, so the model returns a typed
Swift value instead of a string you have to parse. Reach for it by default —
string parsing is where these features rot.

## `@Generable`

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "A single cooking recipe")
struct Recipe {
    @Guide(description: "Dish name, title case")
    var title: String

    @Guide(description: "Ordered preparation steps", .count(3...8))
    var steps: [String]

    @Guide(description: "Total minutes", .range(5...240))
    var minutes: Int
}
```

Macro overloads:

| Form | Use |
|---|---|
| `@Generable(description:)` | the common case |
| `@Generable(name:description:representNilExplicitlyInGeneratedContent:)` | rename the schema type, or emit `nil` explicitly |
| `@Generable(description:representNilExplicitlyInGeneratedContent:)` | 26.4+ |

`@Generable` also works on enums, which is the right tool for classification:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
enum Priority {
    case low
    case medium
    case urgent
}
```

## `@Guide`

Three forms:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Ticket {
    @Guide(description: "One-line summary")        // description only
    var summary: String

    @Guide(description: "Severity", .range(1...5)) // description + guides
    var severity: Int

    @Guide(.anyOf(["bug", "feature", "question"])) // guides only
    var kind: String
}
```

Full `GenerationGuide` catalog, straight from the SDK:

| Type | Guides |
|---|---|
| `String` | `.constant(_:)`, `.anyOf([String])`, `.pattern(Regex)` |
| `Int`, `Float`, `Double`, `Decimal` | `.minimum(_:)`, `.maximum(_:)`, `.range(_:)` |
| `[Element]` | `.count(_:)` (exact or `ClosedRange`), `.minimumCount(_:)`, `.maximumCount(_:)`, `.element(GenerationGuide<Element>)` |

`.pattern` takes a real Swift `Regex`, not a string:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Item {
    @Guide(description: "SKU like AB-1234", .pattern(/[A-Z]{2}-\d{4}/))
    var sku: String
}
```

### Guide pitfalls

- Guides constrain **decoding**, so an over-tight guide produces mangled output
  rather than an error. Prefer a description plus a loose guide.
- `.constant` pins a value — useful for a discriminator field, useless elsewhere.
- Every property is generated, including ones your UI never reads. Each costs
  tokens and latency. Model only what you consume.
- Recursive types need `DynamicGenerationSchema` (below); `@Generable` cannot
  express a type that contains itself.

## Calling it

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Summary {
    var headline: String
    var bullets: [String]
}

@available(iOS 26.0, macOS 26.0, *)
func summarize(_ article: String) async throws -> Summary {
    let session = LanguageModelSession(
        instructions: "Summarize articles for a busy reader."
    )
    let response = try await session.respond(
        to: "Summarize:\n\(article)",
        generating: Summary.self
    )
    return response.content
}
```

`response.content` is your type; `response.rawContent` is the underlying
`GeneratedContent` if you need the untyped tree.

### `includeSchemaInPrompt`

Defaults to `true`, which prepends a textual description of the schema to the
prompt. Set it to `false` when the session's instructions already describe the
output shape, or when you are re-using one session for many identical
generations and want to save the tokens:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
@Generable
struct Tag { var name: String }

@available(iOS 26.0, macOS 26.0, *)
func tag(_ text: String, in session: LanguageModelSession) async throws -> Tag {
    try await session.respond(
        to: text,
        generating: Tag.self,
        includeSchemaInPrompt: false
    ).content
}
```

On iOS 27 this moved into `ContextOptions(includeSchemaInPrompt:)`; the standalone
parameter still exists.

## Runtime schemas — `DynamicGenerationSchema`

When the shape is only known at runtime (user-defined fields, a server-driven
form), build the schema by hand and generate `GeneratedContent`:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func askDynamically(_ session: LanguageModelSession) async throws -> GeneratedContent {
    let dynamic = DynamicGenerationSchema(
        name: "Person",
        description: "A person mentioned in the text",
        properties: [
            .init(name: "name", schema: DynamicGenerationSchema(type: String.self)),
            .init(
                name: "age",
                schema: DynamicGenerationSchema(type: Int.self),
                isOptional: true
            )
        ]
    )
    let schema = try GenerationSchema(root: dynamic, dependencies: [])
    return try await session.respond(to: "Who is mentioned?", schema: schema).content
}
```

Other `DynamicGenerationSchema` initializers:

| Initializer | Produces |
|---|---|
| `init(name:description:properties:)` | an object |
| `init(name:description:anyOf: [DynamicGenerationSchema])` | a union |
| `init(name:description:anyOf: [String])` | a string enum |
| `init(arrayOf:minimumElements:maximumElements:)` | an array |
| `init(type:guides:)` | wraps an existing `Generable` |
| `init(referenceTo:)` | a named reference — **this is how you get recursion** |

Recursive shapes reference a name declared elsewhere in `dependencies`:

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func treeSchema() throws -> GenerationSchema {
    let node = DynamicGenerationSchema(
        name: "Node",
        properties: [
            .init(name: "label", schema: DynamicGenerationSchema(type: String.self)),
            .init(
                name: "children",
                schema: DynamicGenerationSchema(
                    arrayOf: DynamicGenerationSchema(referenceTo: "Node")
                ),
                isOptional: true
            )
        ]
    )
    return try GenerationSchema(root: node, dependencies: [node])
}
```

## Reading `GeneratedContent`

```swift
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
func readFields(_ content: GeneratedContent) throws -> String {
    let name: String = try content.value(String.self, forProperty: "name")
    return name
}
```

`GeneratedContent` also round-trips: `GeneratedContent(properties:)` builds one,
and any `Generable` type can be reconstructed with `init(_ content:)`.

## Verify

Every example above compiles. When you write a new `@Generable` type, check it
before showing it — macro expansion errors are easy to produce and cryptic:

```
scripts/fm-check.sh MyTypes.swift --target ios26.0
```
