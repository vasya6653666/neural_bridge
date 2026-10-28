# Cost Analysis Workflow

Use this workflow when the user wants to query, analyze, or understand their cloud costs.

## Steps

1. **Establish context** - Call `get_org_context` to understand the current organization and its configuration.
2. **Discover dimensions** - Call `get_available_dimensions` to know what groupings and filters are available.
3. **Check history** - Call `get_recent_query_history` to see if a similar query was recently run.
4. **Query cost data** - Use `get_cost_data` with appropriate parameters.

## Using get_cost_data

The `get_cost_data` tool accepts these key parameters:

- **group_by** - Dimensions to group results by (e.g., service, account, region)
- **filters** - Dimension filters to narrow results
- **date_range** - Time period for the query
- **granularity** - Time resolution: `hourly`, `daily`, `weekly`, or `monthly`
- **cost_type** - Type of cost metric:
  - `real_cost` - Actual cost after all discounts
  - `billed_cost` - Amount on the bill
  - `on_demand_cost` - On-demand equivalent pricing
  - `amortized_cost` - Upfront costs spread over commitment term
  - `discounted_cost` - Cost reflecting applied discounts
  - `discounted_amortized_cost` - Combined discounted and amortized
- **limit** - Maximum number of results to return

## Best Practices

- Default to `daily` granularity unless the user specifies otherwise.
- Default to `real_cost` unless a specific cost type is requested.
- When comparing costs, use the same cost type and granularity for consistency.
- For trend analysis, use `monthly` granularity over longer date ranges.
- For investigating a specific spike, use `hourly` or `daily` granularity.
- Always present results with clear context: what filters were applied, what time range, and what cost type.
- If the user asks a vague question like "why did costs go up?", group by multiple dimensions (service, then account, then region) to identify the source.

## Query Guardrails

- Always check `get_recent_query_history` before issuing a new query to avoid redundant API calls.
- Use appropriate `limit` values to avoid retrieving unnecessarily large result sets. Default to a reasonable limit (e.g., 10–25) unless the user explicitly requests more.
- For broad analyses spanning many dimensions, break the work into focused queries rather than issuing many calls in rapid succession.
- If a query returns a rate-limiting or throttling error, do not retry immediately. Inform the user and wait before retrying.
- When the user asks for an open-ended exploration (e.g., "analyze all our costs"), confirm scope before querying across every available dimension.
