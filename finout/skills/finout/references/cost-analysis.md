# Cost analysis in depth

## Discovering filters

`search_filters` → `get_filter_values` → `query_costs`. When `search_filters` returns
nothing after one or two attempts, fall back to `list_available_filters` scoped to a cost
center rather than guessing harder.

Filter **values** are time-scoped: discover them with the *same* `time_period` you intend
to query. A service that existed last quarter may be absent from last week's values.

Filter types beyond `col`: `tag` (custom tags), `finrichment` (enriched dimensions such as
product name), `namespace_object` (Kubernetes resources). Copy the type from
`search_filters`; never assume it.

## Cost types

The default is the account's configured metric, usually `netAmortizedCost`, which spreads
commitment (RI/SP) cost across usage. `unblendedCost` is on-demand rates; `blendedCost` is
org-averaged; `listCost` is pre-discount. Switching metrics changes the number
legitimately — name the metric whenever it could be questioned.

## Parameters that do not exist

`query_costs` has no `limit` and no `cost_centers`. Unknown parameters are ignored silently
rather than rejected, so a hallucinated one produces a plausible-looking call that did
something different from what was asked:

- **Limiting** — there is no `limit`. The call returns every group; take the top N yourself
  and say how many groups the total covers.
- **Scoping to a cloud** — there is no `cost_centers`. Scope through `filters` and
  `group_by`, whose `costCenter` field comes from `search_filters`.

## Grouping and sorting

`group_by` needs the same full filter metadata as `filters`. A grouped query returns every
group — `row_count` tells you how many — so a "top 5" is your own slice of the full result,
and the total is the total of everything unless you say otherwise. `sort_order` defaults to
`desc`; use `asc` when the user asks for the
*cheapest* or *least expensive* — otherwise you return the most expensive and answer the
opposite question.

## Reporting honestly

- Name the period, and say when it is partial.
- Say when a total covers only the returned groups rather than all spend.
- A tool returning no rows means no data for those filters — not zero spend. Say which.
