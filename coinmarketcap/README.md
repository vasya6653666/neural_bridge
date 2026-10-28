# CoinMarketCap Crypto Data — NeuralBridge Power

A NeuralBridge power that connects your agent to CoinMarketCap's
hosted MCP server for real-time crypto market data, technical analysis,
on-chain metrics, trending signals, and news across 10,000+ cryptocurrencies.

## Contents
- `POWER.md` — power metadata, onboarding, tool docs, and best practices
- `mcp.json` — MCP server configuration (hosted, streamable HTTP)
- `LICENSE` — MIT

## Install in NeuralBridge

1. Install the power from the **Powers** panel in NeuralBridge IDE.
2. Set the `CMC_MCP_API_KEY` environment variable (get a free key at
   https://pro.coinmarketcap.com/signup), or switch `mcp.json` to the x402
   endpoint for keyless pay-per-call access

## Authentication
- **API key:** `https://mcp.coinmarketcap.com/mcp` with header `X-CMC-MCP-API-KEY`
- **x402 (no key):** `https://mcp.coinmarketcap.com/x402/mcp`, 0.01 USDC per call

Read-only market data. No trading or write operations.

## Links
- CMC for Agent: https://coinmarketcap.com/api/agent/
- CMC MCP: https://coinmarketcap.com/api/mcp/
- Privacy Policy: https://coinmarketcap.com/privacy/
- Support: https://coinmarketcap.com/api/faq/
