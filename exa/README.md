# NeuralBridge Power: Exa Web Search & Research

A power that adds Exa's web search, crawl, and research tools to NeuralBridge agents.

## What it gives you

- **Semantic web search** over the live web, with optional filters by domain, date, and category (company / people)
- **Clean content extraction** from any URL as markdown
- **Code and documentation search** tuned for programming questions
- **Multi-query research** across diverse angles when a single search isn't enough

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

## Setup

1. Get an API key at [dashboard.exa.ai](https://dashboard.exa.ai). New accounts include free credits.
2. Export `EXA_API_KEY` in the shell NeuralBridge launches from, or add it to NeuralBridge's MCP environment config.
3. Mention one of the trigger keywords (`search`, `research`, `find`, `crawl`, etc.) in your prompt. NeuralBridge activates the power automatically.

## What's in this repo

- `POWER.md` — power manifest and onboarding, loaded by NeuralBridge on activation
- `mcp.json` — MCP server config for `mcp.exa.ai`
- `steering/` — task-specific guidance files (query writing, extraction, filtering, synthesis, source quality, and domain patterns for code / companies / people / news / papers / relationships) that NeuralBridge loads on demand

## Links

- [Exa homepage](https://exa.ai)
- [Exa API docs](https://docs.exa.ai)
- [Exa MCP server](https://github.com/exa-labs/exa-mcp-server)
- NeuralBridge powers documentation

## License

[MIT](./LICENSE)
