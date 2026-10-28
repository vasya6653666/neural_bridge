# Mirelo SFX — NeuralBridge Power

Generate and edit sound for video from inside NeuralBridge: sound effects, Foley and
ambience, scored against the footage itself or written from a text prompt, plus extend and inpaint on
audio you already have.

This repository is the NeuralBridge Power for the hosted
[Mirelo MCP server](https://mirelo.ai/mcp). Installing it registers the MCP server and gives the NeuralBridge
agent the context to use it well. It follows the
[Agent Plugins specification](https://agent-plugins.org), the open plugin format NeuralBridge powers are
built on, so the same package also works in other clients that support the format.

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

Then complete **Sign in with Mirelo** in the browser window NeuralBridge opens, and check the connection by
asking the agent to *"check my Mirelo account credits"*.

## What you need

A Mirelo account — free to create at [mirelo.ai](https://mirelo.ai). There is **no API key to
manage**: the power authenticates with OAuth, and generations bill to the credits on the account you
sign in with, the same balance the web app uses.

## Try it

```
Here's my gameplay clip — generate footstep and impact sounds that match the action.
Create a 10-second rainy city street ambience, distant traffic, soft footsteps.
Extend this ambience loop to 45 seconds so it covers the whole scene.
There's a glitch from 0:05 to 0:12 — regenerate just that section, keep the rest as is.
```

## What's in here

| File | Purpose |
| --- | --- |
| `plugin.json` | [Agent Plugins](https://agent-plugins.org) manifest: name, keywords, and metadata |
| `mcp.json` | MCP server registration (`https://mcp.mirelo.ai/mcp`) |
| `skills/mirelo-sfx/SKILL.md` | The skill: tool reference, job model, and the rules the agent follows |
| `skills/mirelo-sfx/references/file-inputs.md` | Staging local video and audio files |
| `skills/mirelo-sfx/references/video-to-sfx.md` | Scoring a clip; choosing the window to score |
| `skills/mirelo-sfx/references/audio-editing.md` | Extend and inpaint |
| `skills/mirelo-sfx/references/api-integration.md` | Calling Mirelo from your own application code |
| `skills/mirelo-sfx/references/troubleshooting.md` | Errors and what they mean |
| `assets/` | Logo marks |

## Not on this surface

Music, audio-to-MIDI and multi-stem generation are not exposed through the MCP server. Mirelo does
generate music — in [Mirelo Studio](https://mirelo.ai) and its editor plugins.

## Links

- Product page and connect guides — <https://mirelo.ai/mcp>
- API reference — <https://mirelo.ai/api-docs>
- Pricing — <https://mirelo.ai/pricing>
- Support — <support@mirelo.ai> · <https://mirelo.ai/support>
- Terms — <https://mirelo.ai/terms> · Privacy — <https://mirelo.ai/privacy>

## License

The documentation in this repository is MIT licensed — see [LICENSE](./LICENSE). Use of the Mirelo
service itself is governed by the [Mirelo Terms of Service](https://mirelo.ai/terms) and
[API Terms](https://mirelo.ai/api-terms).
