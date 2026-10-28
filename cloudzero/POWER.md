---
name: "cloudzero"
displayName: "CloudZero Cloud Cost Intelligence"
description: "Analyze cloud costs, explore cost dimensions, get optimization recommendations, and query telemetry data with CloudZero"
version: "1.0.0"
license: "Apache-2.0"
author: "CloudZero, Inc."
repository: "https://github.com/vasya6653666/neural_bridge"
keywords: ["cloudzero", "cloud cost", "cost optimization", "finops", "cost analysis", "cost allocation", "cloud spend", "cost intelligence", "telemetry", "cost data", "cost dimensions"]
---

# Onboarding

When you first use this power, follow these steps:

1. The CloudZero MCP server uses browser-based authentication. On first use, a browser window will open for you to sign in with your CloudZero account.
2. Once authenticated, your session persists across restarts.
3. Verify the connection by calling `get_user_organizations` to list your accessible organizations.
4. Call `get_org_context` to understand the current organization context and available cost dimensions.

**Note:** No API keys are required. Authentication is handled through your CloudZero account via OAuth.

## Permission Requirements

Some tools require specific permission sets in your CloudZero account:

- `get_telemetry_data` and `get_telemetry_streams` require **Telemetry Stream Settings (View Telemetry Streams)**
- `get_optimize_recs` requires **Optimize (View Recommendations)**

All other tools are available to any authenticated user, subject to role-based data access filters.

# Steering

This power provides access to CloudZero's cloud cost intelligence platform through the following workflows:

- Querying and analyzing cloud cost data -> `steering/cost-analysis.md`
- Exploring cost dimensions and allocation -> `steering/cost-dimensions.md`
- Getting cost optimization recommendations -> `steering/optimization.md`
- Working with telemetry streams and metrics -> `steering/telemetry.md`
- Managing organization context -> `steering/org-context.md`

## Available Tools

The CloudZero MCP server provides these tools:

### Cost Analysis
- **get_cost_data** - Query cost data with filters, groupings, date ranges, and granularity
- **get_recent_query_history** - View recent cost queries to avoid redundant queries

### Cost Dimensions
- **get_available_dimensions** - List all dimensions available for filtering and grouping
- **get_dimension_values** - Get the available values for a specific dimension

### Organization Context
- **get_org_context** - Retrieve organization-specific configuration and settings
- **set_org_context** - Configure context for queries
- **get_org_context_versions** - List available context versions
- **get_user_organizations** - List organizations accessible to the current user

### Optimization
- **get_optimize_recs** - Retrieve cost optimization recommendations with filtering and sorting

### Telemetry
- **get_telemetry_data** - Retrieve telemetry metrics from configured telemetry streams
- **get_telemetry_streams** - List available telemetry streams

### Reference
- **get_reference_info** - Retrieve CloudZero documentation and reference information

## General Guidelines

1. Always start by understanding the organization context with `get_org_context` before making cost queries.
2. Use `get_available_dimensions` to discover what dimensions are available before trying to filter or group cost data.
3. Use `get_dimension_values` to discover valid values for a dimension before filtering.
4. Check `get_recent_query_history` before running a new query to avoid duplicating recent work.
5. When presenting cost data, always include the date range, granularity, and any filters applied.
6. Use `get_reference_info` to look up CloudZero-specific terminology or concepts when needed.

## Data Sensitivity

- Cost data, organization details, and telemetry metrics are business-confidential. Exercise caution when presenting this information.
- Before displaying detailed cost breakdowns, account identifiers, or infrastructure telemetry, consider whether the output context is appropriate (e.g., shared screens, exported conversations, logged sessions).
- Avoid including raw account IDs or specific dollar amounts in summaries that may be shared externally unless the user explicitly requests it.
- When in doubt, present aggregated or anonymized views and offer to provide full detail on request.

## License and support

This power integrates with the CloudZero MCP Server (Apache-2.0).

- [CloudZero Documentation](https://docs.cloudzero.com)
- Security contact: security@cloudzero.com
