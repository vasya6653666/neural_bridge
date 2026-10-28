# Foundation Models plugin

Build Apple Intelligence features without guessing which APIs exist in your
version of Xcode.

This [Agent Plugin](https://agent-plugins.org) helps coding agents write,
review, and debug Swift that uses Apple's Foundation Models framework. It checks
the SDK installed on your Mac before suggesting code, then type-checks the
result against your deployment target.

## What it helps with

- Add on-device generation to an iOS, macOS, visionOS, or watchOS app.
- Return typed output with `@Generable` and `@Guide`.
- Stream responses into SwiftUI without duplicating partial text.
- Give the model tools for app data, Spotlight search, OCR, or barcodes.
- Use images, reasoning, Private Cloud Compute, or dynamic agent profiles.
- Handle unavailable devices, guardrails, context limits, and model errors.
- Review existing code and fix APIs that do not match the selected Xcode SDK.
- Migrate Foundation Models code from iOS 26 to iOS 27.

## How it works

When your task involves `FoundationModels`, the agent follows four steps:

1. Detect the selected Xcode and SDK.
2. Look up the exact declaration and availability of every API it needs.
3. Write or review the Swift code, including availability and fallback paths.
4. Type-check the result before presenting it.

SDK inspection and type-checking happen locally. The plugin makes no network
requests and needs no API keys.

## Install

You need macOS with full Xcode 26 or later. Use Xcode 27 for iOS 27 APIs. Your
agent client must support Agent Skills and allow local shell commands.

### VS Code

1. Open the Command Palette.
2. Run **Chat: Install Plugin From Source**.
3. Paste:

```text
https://github.com/artemnovichkov/foundation-models-plugin
```

VS Code clones and enables the plugin. You can manage it later from **Chat:
Open Customizations → Plugins**.

### Cursor

Clone the plugin into Cursor's local plugin directory:

```sh
git clone https://github.com/artemnovichkov/foundation-models-plugin \
  ~/.cursor/plugins/local/foundation-models
```

Restart Cursor or run **Developer: Reload Window**. The `foundation-models`
skill should then appear under **Customize**.

### Other clients

The same package can be loaded by GitHub Copilot, ChatGPT/Codex, NeuralBridge, and
other clients that support the Agent Plugins format. Follow the setup link for
your client on the [compatible clients](https://agent-plugins.org/compatible-clients)
page.

## Start using it

Open your Swift project and describe the feature normally. You do not need to
mention the bundled scripts. Include the deployment target when it matters.
Without one, the plugin checks against iOS 26.0 by default.

If your client does not activate skills automatically, start the prompt with
`Use the foundation-models skill to …`.

### Create a feature

```text
Add an article summarizer using Foundation Models. Return a headline and 2–5
key points with @Generable. Support iOS 26 and show a non-AI fallback when the
model is unavailable. Type-check the final code.
```

```text
Build a SwiftUI chat view that streams a Foundation Models response. Make sure
partial snapshots are handled correctly and prevent concurrent requests.
```

### Review or fix code

```text
Review every file that imports FoundationModels. Check each API against my
installed SDK, fix availability mistakes, and type-check the changed files for
iOS 26.0.
```

```text
This code fails after moving to Xcode 27. Find removed or renamed Foundation
Models APIs, update them, and explain which changes are SDK boundaries versus
deployment-target boundaries.
```

### Check whether an API exists

```text
Can I use SystemLanguageModel.tokenCount(for:) with an iOS 26.0 deployment
target? Verify it against the installed SDK before answering.
```

```text
Which Foundation Models image and OCR APIs are available in my Xcode? Show the
imports required for each one and do not invent APIs that are missing.
```

### Add tools or local search

```text
Give my session a tool that reads calendar events. Use typed arguments, keep
the tool safe to retry, and make the model call it before answering questions
about dates.
```

```text
Add on-device RAG with SpotlightSearchTool on iOS 27. Cite retrieved results,
treat retrieved text as untrusted data, and keep an iOS 26 fallback.
```

### Work with iOS 27 models and agents

```text
Use the on-device model for extraction and Private Cloud Compute only for the
reasoning step. Check availability and quota errors, then type-check for iOS 27.
```

```text
Create a DynamicProfile workflow with separate research and drafting stages.
Keep the transcript valid when switching profiles and explain the cache cost.
```

## Example result

Suppose you ask:

```text
Add receipt scanning with OCR and return merchant, date, and total as a typed
value. Support iOS 27.
```

Before writing the feature, the agent checks whether `OCRTool`, `@Generable`,
and the relevant session overloads exist in the selected SDK. It confirms the
required `Vision` cross-import, adds availability handling, writes the typed
result, and compiles the code against an iOS 27 target. If your installed Xcode
does not contain the requested API, it tells you which toolchain is required
instead of returning code that cannot build.

## Use the checks directly

The bundled commands are also useful outside an agent:

```sh
# Show the selected SDK and supported platforms
skills/foundation-models/scripts/fm-env.sh

# Inspect an API exactly as it appears in the SDK
skills/foundation-models/scripts/fm-api.sh SystemLanguageModel.Availability

# Type-check a Swift file for a deployment target
skills/foundation-models/scripts/fm-check.sh Feature.swift --target ios26.0
```

<details>
<summary>Maintainer checks</summary>

```sh
tools/check-docs.sh
tools/test-scripts.sh
python3 tools/validate-plugin.py
```

The documentation examples are checked with Xcode 26 and the latest Xcode
available on GitHub's hosted runner. Xcode 27 examples are also checked locally.

</details>

## Related

- [`apple/foundation-models-utilities`](https://github.com/apple/foundation-models-utilities)
- [Agent Plugins specification](https://agent-plugins.org/specification)
- [Agent Skills specification](https://agentskills.io/specification)

## License

MIT

## Privacy and support

The plugin runs locally and does not collect or transmit data. See the
[Privacy Policy](PRIVACY.md) for details.

For questions and bug reports, open a
[GitHub issue](https://github.com/artemnovichkov/foundation-models-plugin/issues)
or email [mail@artemnovichkov.com](mailto:mail@artemnovichkov.com).
