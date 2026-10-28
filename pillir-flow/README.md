<img src="./icon.png" alt="Pillir Flow" width="96" height="96" align="right" />

# Pillir Flow Power for NeuralBridge

Flow is the AI execution engine. It turns AI intent into real work — executed directly against SAP, Oracle, JD Edwards, and your enterprise systems. No APIs. No rewrites. No middleware.

This Power connects NeuralBridge agents to the [Pillir Flow](https://flow.pillir.ai) MCP server so your AI assistant can discover and execute ERP functions without writing custom integration code.

## What this Power does

- Harvesting your Legacy via Flow
- Discovers functions in SAP, Oracle, and JD Edwards directly through Flow (both standard and custom functions)
- Inspects function schemas — import, export, and table parameters, with mandatory fields flagged
- Executes functions against the connected enterprise system and returns the response to NeuralBridge
- Enforces a search-then-execute pattern so the agent doesn't guess function names or parameter shapes
- Keeps your NeuralBridge context focused — steering files load on-demand per workflow

## What this Power does NOT do

Pillir Flow is the execution engine only. This Power covers Flow. It does not cover:

- App generation, wireframes, or UI design (that's **Pillir Studio**)
- Offline runtime, mobile packaging, or multi-target deployment (that's **EdgeReady Cloud**)

Flow can be used independently — you don't need the full Pillir stack to benefit from this Power.

## Installation

1. Install the power from the **Powers** panel in NeuralBridge IDE.
2. Provide your Pillir Flow API key: set it as the `PILLIR_API_KEY` environment variable before starting NeuralBridge IDE.

## Activation

The Power activates automatically when you mention any of these keywords in NeuralBridge chat: `pillir`, `flow`, `pillir flow`, `enterprise app`, `low-code`, `sap integration`, `oracle integration`, `wireframe`, `app generation`, `work unit`.

## Requirements

- A Pillir Flow account
- NeuralBridge IDE
- A valid Pillir Flow API key

## Pricing

Pillir Flow uses an outcome-based pricing model called the **Pillir Work Unit**. You pay for completed business transactions that execute end-to-end workflows and deliver measurable outcomes — not for licenses, API calls, tokens, or developer seats. Value scales with the work delivered; complexity doesn't drive cost.

The lifecycle covered by a Work Unit: **Discover → Build → Run → Execute → Act**.

This Power itself is free and MIT-licensed (see below). Use of Pillir Flow's MCP server consumes Work Units against your Pillir Flow account. See [pillir.ai](https://pillir.ai) for current Work Unit pricing and edition details.

## License

This Power (the `POWER.md`, `mcp.json`, steering files, and accompanying docs) is MIT-licensed. See `LICENSE` for details.

Pillir Flow is a commercial service governed by Pillir's Terms of Service and the Pillir Work Unit pricing model.

## License and support

### The Power itself

- **License:** MIT — see [LICENSE](./LICENSE)
- **Source:** this repo ([github.com/pillir/power-pillir-flow](https://github.com/pillir/power-pillir-flow))
- **Issues:** open a GitHub issue on this repo

### Pillir Flow (the underlying service)

- **License:** Commercial — Pillir Flow is a paid service governed by [Pillir's Terms of Service](https://pillir.ai)
- **Privacy Policy:** [pillir.ai/privacy](https://www.pillir.io/privacy-policy)
- **Pricing:** Pillir Work Unit model 
- **Support:** [support@pillir.ai](mailto:support@pillir.ai)

**Who handles what:**
- Bug in the Power (wrong steering, bad config, docs error) → open a GitHub issue on this repo
- Problem with Flow itself (MCP connection, Work Unit billing, ERP execution) → contact Pillir support directly