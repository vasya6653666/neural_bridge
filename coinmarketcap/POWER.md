---
name: "coinmarketcap"
displayName: "CoinMarketCap Crypto Data"
description: "Real-time crypto market data, technical analysis, on-chain metrics, and trending signals from CoinMarketCap via the Model Context Protocol. Covers 10,000+ cryptocurrencies across CEX, derivatives, on-chain, and news. Read-only market data for building crypto, trading, DeFi, and agent applications."
keywords: ["crypto", "cryptocurrency", "coinmarketcap", "cmc", "market data", "price", "bitcoin", "ethereum", "trading", "defi", "technical analysis", "on-chain", "dex"]
author: "CoinMarketCap"
---

# CoinMarketCap Crypto Data

## Overview

This power connects NeuralBridge to CoinMarketCap's hosted MCP server, giving your agent
direct access to real-time and structured crypto market data while you build. It
covers latest prices, market cap and volume for 10,000+ cryptocurrencies,
pre-computed technical indicators (SMA/EMA, MACD, RSI, Fibonacci, pivots),
on-chain holder metrics, global market overview (BTC dominance, Fear & Greed,
ETF flows), trending narratives, macro events, and crypto news.

The server is hosted (streamable HTTP) — there is no package to install or run
locally. Use it when building crypto pricing, trading, DeFi, portfolio, or
market-analysis features and you want authoritative data inside your IDE.

**Read-only:** the CoinMarketCap MCP provides market data only. It does not place
trades, sign transactions, or perform any write operation.

## Onboarding

### Step 1: Choose an authentication mode

This power supports two ways to connect:

1. **API key (default)** — Sign up for a free Basic key at
   https://pro.coinmarketcap.com/signup (30 calls/min, 10,000 monthly credits;
   paid tiers unlock higher limits and more endpoints). Set the key as an
   environment variable named `CMC_MCP_API_KEY` before launching NeuralBridge. The
   bundled `mcp.json` reads `${CMC_MCP_API_KEY}` and sends it in the
   `X-CMC-MCP-API-KEY` header.

2. **x402 pay-per-call (no key)** — Skip sign-up entirely and pay 0.01 USDC per
   tool call via the x402 protocol. To use this mode, change the server `url` in
   `mcp.json` to `https://mcp.coinmarketcap.com/x402/mcp` and remove the
   `headers` block. The agent handles the payment round-trip automatically.

### Step 2: Verify the connection

After installing the power, ask NeuralBridge a simple query such as
"What's the current price of BTC?" and confirm it calls
`get_crypto_quotes_latest` and returns a live price. If the call fails with an
auth error, re-check that `CMC_MCP_API_KEY` is set in your environment.

## Available MCP Server

`coinmarketcap` → `https://mcp.coinmarketcap.com/mcp` (streamable HTTP, hosted).
12 tools, grouped below.

### Market Data & Quotes
- `get_crypto_quotes_latest` — Latest price, market cap, and 24h volume for one or more assets (by id/symbol).
- `search_cryptos` — Search the universe of 10,000+ assets by name or symbol.
- `get_crypto_info` — Metadata for a cryptocurrency (logo, description, links, category).

### Technical Analysis
- `get_crypto_technical_analysis` — SMA/EMA, MACD, RSI, Fibonacci levels, and pivot points for an asset.
- `get_crypto_marketcap_technical_analysis` — The same TA suite applied to market-cap series.

### On-Chain Metrics
- `get_crypto_metrics` — Holder distribution, addresses by holding value/time, circulating-supply breakdown, transaction fees.

### Global Market Overview
- `get_global_metrics_latest` — Total market cap, BTC dominance, Fear & Greed Index, altcoin-season gauge.
- `get_global_crypto_derivatives_metrics` — Derivatives/leverage stats and ETF flow data.

### Trending & Narratives
- `trending_crypto_narratives` — Top trending narratives with market performance.
- `get_upcoming_macro_events` — Upcoming macro events that move crypto markets.

### News & Research
- `get_crypto_latest_news` — Latest crypto news headlines.
- `search_crypto_info` — Semantic search across crypto concepts, whitepapers, and documentation.

## Tool Usage Examples

**Get a price**
> "What's the current price and 24h volume of Ethereum?"
> NeuralBridge → `get_crypto_quotes_latest(symbol: "ETH")`

**Technical read**
> "Give me the RSI and MACD for SOL."
> NeuralBridge → `get_crypto_technical_analysis(symbol: "SOL")`

**Market overview**
> "What's the Fear & Greed Index and BTC dominance right now?"
> NeuralBridge → `get_global_metrics_latest()`

## Best Practices

- Resolve ambiguous tickers with `search_cryptos` first, then pass the returned id to other tools — many symbols collide across assets.
- Outputs are compact, timestamped Markdown/YAML designed to minimize token bloat; pass them through to the model rather than re-parsing.
- Indicators are pre-computed server-side — don't ask the model to recompute MACD/RSI from raw candles.
- Respect your plan's rate limit (Basic = 30 calls/min). Batch symbols into a single `get_crypto_quotes_latest` call where possible.
- This is read-only market data. Never imply it can execute trades.

## Troubleshooting

**401 / auth error** — `CMC_MCP_API_KEY` is missing or invalid. Confirm the env
var is set in the shell that launched NeuralBridge and that the key is active in your
CoinMarketCap developer dashboard.

**429 / rate limited** — You've exceeded your plan's calls/min. Reduce request
frequency or upgrade your plan.

**402 Payment Required** — You're pointed at the x402 endpoint without payment
configured. Either switch back to the API-key endpoint or ensure your agent's
x402 wallet is funded with USDC.

## License and support

This power integrates with the CoinMarketCap MCP server. Use of the MCP server
and data is governed by the CoinMarketCap API Terms of Service.

- License (this power's documentation): MIT
- Terms of Service: https://coinmarketcap.com/api/documentation/v1/#section/Terms-of-Service
- [Privacy Policy](https://coinmarketcap.com/privacy/)
- [Support](https://coinmarketcap.com/api/faq/)
