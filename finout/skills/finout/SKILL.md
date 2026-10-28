---
name: finout
description: Query and analyze cloud costs with Finout — spend breakdowns, period comparisons, cost anomalies, waste and rightsizing, budgets and forecasts, unit economics, tag coverage. Use for any question about cloud spend.
---
# Finout

Finout unifies every cloud and SaaS cost source into one queryable model. The tools carry
their own `WORKFLOW:` and `CHAIN:` instructions — follow them. This page covers only what
the tools cannot tell you themselves.

## Two rules that prevent most wrong answers

**Never invent a filter.** Every dimension belongs to a **cost center** — a data source
(`aws`, `azure`, `gcp`, `k8s`, Datadog, Snowflake…). "Service" in AWS is not "service" in
GCP, so a filter is never just a name. Call `search_filters` first and copy the returned
`costCenter`, `key`, `path`, `type` **verbatim**. Never default `type` to `"col"` — a wrong
type returns wrong data silently instead of erroring.

**Use the exact parameter names.** Unknown parameters are **ignored silently**, not
rejected — a hallucinated one returns a confident, wrong-shaped answer with no error.
The ones models get wrong most:

| Wrong | Right |
|---|---|
| `search_filters({keyword: ...})` | `query` |
| `query_costs({limit: 5})` | no such parameter — the call returns *all* groups; take the top N yourself |
| `query_costs({cost_centers: ["aws"]})` | no such parameter — scope via `filters` / `group_by`, whose `costCenter` comes from `search_filters` |

**Never fill a gap with an estimate.** Report what the tool returned. Partial periods
(`this_month`, `today`) are incomplete — comparing one against a full period invents a
decrease. A grouped query returns *every* group, so when you present a top N, say how many
groups the total actually covers.

## Route to the tool that already does the math

| Question | Tool |
|---|---|
| What did X cost? Break it down by Y. | `query_costs` |
| This period vs that one? | `compare_costs` |
| What *drove* the change? | `get_top_movers` |
| Cost per request / GB / instance? | `get_unit_economics` |
| Peak hours, weekday vs weekend? | `get_cost_patterns` |
| Average daily, volatility, priciest day? | `get_cost_statistics` |
| Savings plan / RI coverage? | `get_savings_coverage` |
| How much spend is untagged / tagged by team? | `get_tag_coverage` with `tag_dimension` |
| Where are we wasting money? | `get_waste_recommendations` |
| Why did the bill jump? | `get_anomalies`, then `get_top_movers` |
| Are we on track against budget? | `get_financial_plans` |

Reaching for `query_costs` on everything means hand-rolling analysis a purpose-built tool
already does in one call.

## References — read on demand, not upfront

- `references/cost-analysis.md` — filter discovery in depth, cost types, honest reporting.
- `references/waste-and-anomalies.md` — the waste drill-down funnel, cost vs usage
  anomalies, budgets vs forecasts.
- `references/connecting.md` — first-time OAuth sign-in and auth troubleshooting. Read this
  when a tool call fails with `401 Unauthorized` or the server shows as not connected.
