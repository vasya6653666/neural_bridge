# Cost Optimization Workflow

Use this workflow when the user wants to find cost savings opportunities or review optimization recommendations.

## Steps

1. **Fetch recommendations** - Call `get_optimize_recs` to retrieve current optimization recommendations.
2. **Filter by status** - Narrow results to actionable items based on their status.
3. **Present findings** - Summarize recommendations with estimated savings and effort.

## Using get_optimize_recs

The tool accepts these parameters:

- **status** - Filter by recommendation status:
  - `not_started` - New recommendations not yet acted on
  - `in_progress` - Recommendations currently being implemented
  - `addressed` - Completed recommendations
  - `ignored` - Recommendations dismissed by the user
- **limit** - Number of results per page
- **offset** - Pagination offset
- **sort_key** - Field to sort by
- **sort_order** - `asc` or `desc`

## Best Practices

- Default to `not_started` status to show actionable recommendations first.
- Sort by estimated savings (descending) to prioritize high-impact items.
- When presenting recommendations, include the estimated savings amount and the effort required.
- Group recommendations by category or service when there are many results.
- This tool requires the **Optimize (View Recommendations)** permission set. If the user gets an access error, inform them about this requirement.
