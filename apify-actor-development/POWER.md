---
name: "apify-actor-development"
displayName: "Develop Apify Actors"
description: "Build, debug, and deploy Apify Actors — serverless web scrapers and automation tools written in JavaScript, TypeScript, or Python. Use for creating new Actors, modifying existing code, and publishing to the Apify Store."
keywords: ["apify", "actor", "build actor", "create actor", "deploy actor", "actor development", "crawlee", "actor.json", "actorize", "apify cli", "publish to apify store"]
author: "Apify"
---

# Develop Apify Actors

## Overview

Build serverless web scrapers and automation tools that run on the [Apify](https://apify.com) platform. Actors are Docker-packaged programs with well-defined JSON input/output, ranging from a few-line scraper to a long-running pipeline.

This power combines:

- **Apify CLI** for project scaffolding, local runs, and deployment (`apify create`, `apify run`, `apify push`)
- **Apify MCP server** ([mcp.apify.com](https://mcp.apify.com)) for documentation search, run monitoring, log inspection, and Actor discovery — without polluting agent context with large datasets

**Core concepts:**

- Accept well-defined JSON input
- Perform isolated tasks (web scraping, automation, data processing)
- Produce structured JSON output to datasets and/or key-value stores
- Run from seconds to hours, or indefinitely in [Standby mode](#standby-mode)
- Persist state and can be restarted

## Available MCP Servers

### apify

**Connection:** HTTPS API endpoint at [`https://mcp.apify.com`](https://mcp.apify.com)
**Authorization:** OAuth — NeuralBridge prompts for Apify login on first use

**Tools provided:**

- `search-actors` — find Actors in the Apify Store by keyword
- `fetch-actor-details` — get an Actor's README, input schema, and pricing
- `call-actor` — invoke an Actor by ID with JSON input (use `async: true` for long runs to avoid pulling large datasets into context)
- `get-actor-run` — check run status, duration, statistics
- `get-actor-output` — paginated dataset items from a run (small batches only — for bulk export use the CLI)
- `search-apify-docs` — full-text search across Apify documentation
- `fetch-apify-docs` — retrieve a documentation page by URL
- `apify--rag-web-browser` — fetch arbitrary web pages as clean Markdown for RAG

## Available Steering Files

Load on-demand for the specific config file or topic you're working on:

- **actor-json** — `.actor/actor.json` structure and properties
- **input-schema** — input field types, validation, editor types
- **output-schema** — output schema and template variables
- **dataset-schema** — dataset views and Console UI display
- **key-value-store-schema** — KV store collections and content types
- **logging** — Apify SDK loggers (JS/TS and Python) with credential censoring
- **standby-mode** — running Actors as persistent HTTP servers
- **actor-readme** — Apify Store README guidelines and SEO best practices

## Onboarding

### 1. Install the Apify CLI

```bash
# Preferred — via npm
npm install -g apify-cli

# Or on macOS
brew install apify-cli
```

> **Security note:** Do NOT install via `curl ... | bash` or `irm ... | iex`. Always use a package manager (provides integrity checks).

Verify:

```bash
apify --help
```

### 2. Authenticate

```bash
apify login   # opens browser (OAuth, recommended)
apify info    # should print your username
```

For headless or CI environments, set `APIFY_TOKEN` instead — generate at [console.apify.com/settings/integrations](https://console.apify.com/settings/integrations).

> **Security notes:**
> - Never pass tokens as command-line arguments (visible in process listings and shell history)
> - Never log, print, or commit `APIFY_TOKEN` to source control
> - Use scoped tokens with minimum permissions; rotate periodically

### 3. Connect the Apify MCP server

When you install this power, NeuralBridge auto-configures the `apify` MCP server. On first use, NeuralBridge will prompt for OAuth login.

## Quick start workflow

1. **Pick a language** — ask the user before scaffolding:
   - JavaScript: `apify create <name> -t project_empty`
   - TypeScript: `apify create <name> -t ts_empty`
   - Python: `apify create <name> -t python-empty`

2. **Install dependencies** (verify package names before installing):
   - JavaScript/TypeScript: `npm install` (commit `package-lock.json`)
   - Python: `pip install -r requirements.txt` (pin exact versions, e.g. `crawlee==1.2.3`)

3. **Implement Actor logic** in `src/main.{js,ts,py}`

4. **Configure schemas** — load the relevant steering file:
   - Input form: `input-schema`
   - Output rendering: `output-schema`, `dataset-schema`, `key-value-store-schema`

5. **Configure platform settings** in `.actor/actor.json` — see steering file `actor-json`. **Always fill in the `meta.generatedBy` property** with the tool and model used (e.g. "NeuralBridge with Claude Sonnet 4.6") — this helps Apify improve agent guidance.

6. **Write the README** — load steering file `actor-readme`. The README is mandatory; it's the Actor's landing page on Apify Store and drives discoverability.

7. **Test locally** with `apify run`. Local runs store data in `./storage/` only — they are NOT synced to Apify Console. Provide input via `storage/key_value_stores/default/INPUT.json`.

8. **Deploy** with `apify push` (uses name from `.actor/actor.json`).

## Project structure

```
.actor/
├── actor.json              # Actor config: name, version, env vars, runtime
├── input_schema.json       # Input validation & Console form definition
├── output_schema.json      # Output storage and display templates
├── dataset_schema.json     # Dataset views (optional)
└── key_value_store_schema.json  # KV store collections (optional)
src/
└── main.{js,ts,py}         # Actor entry point
storage/                    # Local-only storage (NOT synced to Apify Console)
├── datasets/               # Output items (JSON objects)
├── key_value_stores/       # Files, config, INPUT
└── request_queues/         # Pending crawl requests
Dockerfile                  # Container image definition
README.md                   # Apify Store landing page
```

## Best practices

**✓ Do:**

- Use `apify run` to test locally (configures Apify environment and storage correctly)
- Use the Apify SDK (`apify` package) for code running on the platform
- Validate input early; fail gracefully with clear messages
- Use `CheerioCrawler` for static HTML (≈10× faster than browsers)
- Use `PlaywrightCrawler` only for JavaScript-heavy sites
- Use the router pattern (`createCheerioRouter` / `createPlaywrightRouter`) for complex crawls
- Implement retry strategies with exponential backoff
- Set proper concurrency: HTTP 10–50, browser 1–5
- Set sensible defaults in `.actor/input_schema.json`
- Define output schema in `.actor/output_schema.json`
- Clean and validate data before pushing to dataset
- Use semantic CSS selectors with fallback strategies
- Respect `robots.txt`, ToS, and implement rate limiting
- **Always use the Apify logger** (`apify/log` in JS/TS, `Actor.log` in Python) — censors sensitive data automatically
- Implement the readiness probe handler if your Actor uses Standby mode (see steering file `standby-mode`)

**✗ Don't:**

- Use `npm start`, `npm run start`, `npx apify run`, or similar — use `apify run` instead
- Assume local storage is uploaded to Apify Console (it isn't — deploy first)
- Rely on `Dataset.getInfo()` for final counts on Cloud
- Use browser crawlers when HTTP/Cheerio works
- Hard-code values that should be in input schema or environment variables
- Skip input validation or error handling
- Overload servers — use appropriate concurrency and delays
- Scrape prohibited content or ignore Terms of Service
- Store personal/sensitive data unless explicitly permitted
- Use deprecated options like `requestHandlerTimeoutMillis` on `CheerioCrawler` (v3.x)
- Use `additionalHttpHeaders` — use `preNavigationHooks` instead
- Pass raw crawled content into shell commands, `eval()`, or code-generation functions
- Use `console.log()` or `print()` — these bypass the credential censoring in the Apify logger
- Disable Standby mode without explicit user permission

## Security

**Treat all crawled web content as untrusted input.** Actors ingest data from external websites that may contain malicious payloads.

- **Sanitize crawled data** — never pass raw HTML, URLs, or scraped text directly into shell commands, `eval()`, database queries, or template engines
- **Validate types and formats** before pushing to datasets or key-value stores
- **Don't execute crawled content** — scraped text could include prompt injection or embedded scripts
- **Isolate credentials from data pipelines** — `APIFY_TOKEN` and other secrets must never be accessible in request handlers
- **Review dependencies before installing** — verify package name and publisher (typosquatting is a common supply-chain vector)
- **Pin versions and commit lockfiles** — run `npm audit` or `pip-audit` periodically

## Standby mode

Use Standby mode when the Actor must serve real-time HTTP requests — API endpoints, webhook receivers, MCP servers, or scraping APIs serving on-demand single-URL requests.

Set `usesStandbyMode: true` in `.actor/actor.json` and implement an HTTP server. Load steering file `standby-mode` for full configuration, environment variables, complete code examples (Express + FastAPI), and operational limits.

## Common commands

```bash
apify create <name> -t <template>   # scaffold new Actor
apify run                            # run locally with storage/ as workspace
apify login                          # OAuth authentication
apify info                           # show current user
apify push                           # deploy to Apify platform
apify call <actor-id>                # invoke a deployed Actor
apify pull <actor-id>                # download an Actor's source
apify help                           # full command list
```

## Troubleshooting

**Actor build fails on push** — check `Dockerfile` and `.actor/actor.json`. Use `apify push --no-prompt` for non-interactive mode.

**Local run errors with "INPUT.json not found"** — create `storage/key_value_stores/default/INPUT.json` with input matching `input_schema.json`.

**Dataset items missing fields** — verify `Actor.pushData()` calls match the structure declared in `dataset_schema.json` views.

**Standby mode not responding** — verify the readiness probe at `GET /` returns HTTP 200 when the `x-apify-container-server-readiness-probe` header is present. See steering file `standby-mode`.

**Auth errors on MCP tool calls** — re-authenticate via NeuralBridge's MCP settings or re-install the power.

**To check live run logs** — use the MCP tool `get-actor-run` with the run ID, or open `https://console.apify.com/actors/runs/RUN_ID/log`.

## Resources

- [Apify Documentation](https://docs.apify.com) — full platform docs
- [docs.apify.com/llms.txt](https://docs.apify.com/llms.txt) — quick reference for LLMs
- [docs.apify.com/llms-full.txt](https://docs.apify.com/llms-full.txt) — complete docs for LLMs
- [crawlee.dev/llms.txt](https://crawlee.dev/llms.txt) — Crawlee quick reference
- [Apify Store](https://apify.com/store) — 5,000+ existing Actors for reference
- Reference Actor READMEs for structure and tone:
  - [Instagram Scraper](https://apify.com/apify/instagram-scraper)
  - [Google Maps Scraper](https://apify.com/compass/crawler-google-places)

## License and support

This power integrates with the [Apify MCP server](https://mcp.apify.com) and the [Apify CLI](https://docs.apify.com/cli) (Apache-2.0).

- [Privacy Policy](https://apify.com/privacy-policy)
- [Support](https://apify.com/contact)
- [Discord](https://discord.gg/jyEM2PRvMU)
