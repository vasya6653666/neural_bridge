# Waste, anomalies, and budgets

## The waste funnel — each level costs more than the one above

```
list_waste_scans                 catalog of scans (cheap; when the ask names a scan type)
  └─ get_waste_recommendations   scans with savings totals  ← always start here
       └─ get_waste_resources    individual resources in one scan
            └─ get_waste_resource_details   one resource: tags, utilization, SP advice
                 └─ get_resource_metrics    raw utilization time series
```

Skipping levels is the common failure: `get_waste_resources` needs a `scan_id` that only
`get_waste_recommendations` returns — never call it straight after `list_waste_scans`.

Answer at the highest level that satisfies the question. "How much could we save?" is
answered by `get_waste_recommendations` alone. Drill down only when asked which resources,
or why one was flagged. Use `min_monthly_savings` to cut the trivial tail, and `scan_type`
when the user names a category (idle, rightsizing, commitment).

## Anomalies: cost rows and usage rows are not interchangeable

Each row's `type` is `cost` or `usage`. Both carry `expected` and `actual`:

- **cost** — dollars, plus a cost impact.
- **usage** — unit counts. Quote the unit, never a dollar figure. A usage spike with flat
  cost is a real finding (a commitment absorbing it), not an error.

Use `severity` when the user wants the big ones. An anomaly says *that* something moved;
`get_top_movers` over the same window says *which dimension*; `query_costs` filtered to it
confirms. That chain is the answer to "investigate this spike".

## Budgets

Call `get_financial_plans` with no `name` first — plan names are account-specific and a
guess returns nothing. Then call again with the name for budget, actual, run rate, and
forecast. A forecast is a projection, and run rate against a partial month is not
overspend; say which you are quoting.

## Framing recommendations

Waste findings are candidates, not decisions. Idle can be deliberate — DR standby, seasonal
jobs, warm spares. Present savings with what must be true for the cut to be safe. For
Finout objects such as virtual tags or dashboards, `check_delete_safety` and
`get_object_usages` show whether something is still referenced before removal.
