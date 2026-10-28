---
name: "apify-scraping"
displayName: "Scrape websites with Apify"
description: "Run pre-built Apify Actors to scrape websites and extract data for lead generation, competitor monitoring, brand tracking, and data collection. No coding — uses the Apify CLI to invoke Actors and saves results to local files."
keywords: ["apify", "scrape", "scrape website", "extract data", "web scraping", "data extraction", "lead generation", "competitor monitoring", "brand monitoring", "data collection"]
author: "Apify"
---

# Scrape websites with Apify

AI-driven data extraction from 5,000+ ready-made Actors on the [Apify Store](https://apify.com/store), driven entirely through the [Apify CLI](https://docs.apify.com/cli).

**Why CLI, not MCP?** Scraping returns large datasets. Routing them through an MCP server would dump every row into the agent context, blowing through token limits and slowing every response. The CLI writes results straight to local files — the agent only ever sees row counts, sample items, and storage IDs.

**Rules for every `apify` command:**

1. Pass `--json` for machine-readable output (stable across CLI versions)
2. Pass `--user-agent apify-neuralbridge-powers/apify-scraping` for telemetry attribution
3. Redirect stderr with `2>/dev/null` (stderr contains progress messages that break JSON parsers)

## Available Steering Files

Load on-demand based on the user's task:

- **actor-index** — flat lookup table of 200+ Actors by platform (Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Google Maps, etc.). Read this first when picking an Actor.
- **gotchas** — pricing models, cost guardrails, common pitfalls, and platform-specific rate limits. Read before running any pay-per-event Actor.
- **workflows/lead-generation** — leads, contacts, emails, B2B
- **workflows/competitive-intel** — competitor analysis, ads, pricing
- **workflows/influencer-vetting** — influencer and creator research
- **workflows/brand-monitoring** — brand mentions, sentiment
- **workflows/review-analysis** — reviews, ratings, reputation
- **workflows/content-and-seo** — SEO, SERP, crawling, content for RAG
- **workflows/social-media-analytics** — engagement, performance metrics
- **workflows/trend-research** — trends, keywords, hashtags
- **workflows/job-market-and-recruitment** — jobs, recruiting, candidates
- **workflows/real-estate-and-hospitality** — listings, hotels, properties
- **workflows/ecommerce-price-monitoring** — price tracking, e-commerce
- **workflows/contact-enrichment** — email and contact extraction
- **workflows/knowledge-base-and-rag** — building RAG and LLM data feeds
- **workflows/company-research** — due diligence, company intelligence

## Onboarding

### Install Apify CLI

```bash
# Preferred — via npm
npm install -g apify-cli

# Or on macOS
brew install apify-cli
```

Verify:

```bash
apify --help
```

### Authenticate

If a CLI command fails with an auth error, authenticate with one of:

1. **OAuth (recommended):** `apify login` — opens browser
2. **Environment variable:** `export APIFY_TOKEN=your_token_here`
3. **From `.env` file:** `source .env` (file should contain `APIFY_TOKEN=...`)

Generate a token at [console.apify.com/settings/integrations](https://console.apify.com/settings/integrations).

## Workflow

### Step 1 — Understand goal and select Actor

Identify the target platform and use case. Load steering file `actor-index` to find the right Actor.

If the task involves a multi-step pipeline, also load the matching workflow steering file:

| Task involves… | Load steering file |
|---|---|
| leads, contacts, emails, B2B | `workflows/lead-generation` |
| competitor, ads, pricing | `workflows/competitive-intel` |
| influencer, creator | `workflows/influencer-vetting` |
| brand, mentions, sentiment | `workflows/brand-monitoring` |
| reviews, ratings, reputation | `workflows/review-analysis` |
| SEO, SERP, crawl, content, RAG | `workflows/content-and-seo` |
| analytics, engagement, performance | `workflows/social-media-analytics` |
| trends, keywords, hashtags | `workflows/trend-research` |
| jobs, recruiting, candidates | `workflows/job-market-and-recruitment` |
| real estate, listings, hotels | `workflows/real-estate-and-hospitality` |
| price monitoring, e-commerce | `workflows/ecommerce-price-monitoring` |
| contact enrichment, emails | `workflows/contact-enrichment` |
| knowledge base, RAG, LLM data | `workflows/knowledge-base-and-rag` |
| company research, due diligence | `workflows/company-research` |

If no Actor matches in the index, search dynamically:

```bash
apify actors search "KEYWORDS" --user-agent apify-neuralbridge-powers/apify-scraping --json --limit 10 2>/dev/null
```

From results, pick by: `items[].username`/`items[].name` (Actor ID), `items[].title`, `items[].stats.totalUsers30Days`, `items[].currentPricingInfo.pricingModel`.

### Step 2 — Fetch Actor schema and check gotchas

```bash
apify actors info "ACTOR_ID" --user-agent apify-neuralbridge-powers/apify-scraping --input --json 2>/dev/null
```

Then load steering file `gotchas` to check for common pitfalls and pricing guardrails for the selected Actor.

For the Actor's marketplace README:

```bash
apify actors info "ACTOR_ID" --user-agent apify-neuralbridge-powers/apify-scraping --readme
```

### Step 3 — Configure and run

**Skip user preferences** for simple lookups (e.g. "Nike's follower count"). Go straight to the run with quick-answer mode.

For larger tasks, confirm output format (quick answer / CSV / JSON) and result count.

**Standard run (blocking):**

```bash
apify actors call "ACTOR_ID" -i 'JSON_INPUT' --user-agent apify-neuralbridge-powers/apify-scraping --json 2>/dev/null
```

From output: `.id` (run ID), `.status`, `.defaultDatasetId`, `.stats.durationMillis`.

**Fetch results (this is where data lands in a file, not the LLM context):**

```bash
# JSON
apify datasets get-items DATASET_ID --user-agent apify-neuralbridge-powers/apify-scraping --format json

# CSV
apify datasets get-items DATASET_ID --user-agent apify-neuralbridge-powers/apify-scraping --format csv
```

**Output modes:**

- **Quick answer** — fetch results as JSON, pick top 5, present formatted in chat
- **Save to file** — fetch results, save as `YYYY-MM-DD_descriptive-name.csv` or `.json`

**Large or long-running scrapes (fire-and-forget):**

```bash
apify actors start "ACTOR_ID" -i 'JSON_INPUT' --user-agent apify-neuralbridge-powers/apify-scraping --json 2>/dev/null
```

Poll with:

```bash
apify runs info RUN_ID --user-agent apify-neuralbridge-powers/apify-scraping --json 2>/dev/null
```

(Check `.status` for `SUCCEEDED`.)

### Step 4 — Deliver results

Report:

- Result count
- File location (if saved)
- Key data fields
- Links:
  - Dataset: `https://console.apify.com/storage/datasets/DATASET_ID`
  - Run: `https://console.apify.com/actors/runs/RUN_ID`

For multi-step workflows, suggest the next pipeline step from the loaded workflow steering file.

## Pricing awareness

Apify Actors use one of three pricing models:

| Model | How it works | Action before running |
|---|---|---|
| `FREE` | No per-result cost, only platform compute | None needed |
| `PAY_PER_EVENT` (PPE) | Charged per result item | Estimate cost first |
| `FLAT_PRICE_PER_MONTH` | Monthly subscription | Verify user has active subscription |

**Always estimate cost before running PPE Actors.** Load steering file `gotchas` for the cost estimation protocol and warning thresholds.

## Common commands

```bash
apify actors search "KEYWORDS" --user-agent apify-neuralbridge-powers/apify-scraping --json
apify actors info ACTOR_ID --user-agent apify-neuralbridge-powers/apify-scraping --input --json
apify actors info ACTOR_ID --user-agent apify-neuralbridge-powers/apify-scraping --readme
apify actors call ACTOR_ID -i 'INPUT' --user-agent apify-neuralbridge-powers/apify-scraping --json
apify actors start ACTOR_ID -i 'INPUT' --user-agent apify-neuralbridge-powers/apify-scraping --json
apify runs info RUN_ID --user-agent apify-neuralbridge-powers/apify-scraping --json
apify datasets get-items DATASET_ID --user-agent apify-neuralbridge-powers/apify-scraping --format json
apify datasets get-items DATASET_ID --user-agent apify-neuralbridge-powers/apify-scraping --format csv
```

## Troubleshooting

Common errors and pitfalls are documented in steering file `gotchas`. Read it before running any pay-per-event Actor.

## License and support

This power uses the [Apify CLI](https://docs.apify.com/cli) (Apache-2.0) to invoke Actors from the [Apify Store](https://apify.com/store).

- [Privacy Policy](https://apify.com/privacy-policy)
- [Support](https://apify.com/contact)
- [Discord](https://discord.gg/jyEM2PRvMU)
