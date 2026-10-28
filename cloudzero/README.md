# CloudZero Cloud Cost Intelligence Power

A NeuralBridge Power that connects your AI coding agent to CloudZero's cloud cost intelligence platform. Query cloud costs, explore cost dimensions, surface optimization recommendations, and access telemetry data — all through natural language.

## What You Can Do

- **Analyze cloud costs** — Query cost data with flexible filters, groupings, date ranges, and granularity. Compare costs across services, accounts, regions, teams, or any custom dimension.
- **Explore cost dimensions** — Discover available cost allocation dimensions and their values to understand how your cloud spend is organized.
- **Get optimization recommendations** — Surface actionable cost-saving opportunities, sorted by estimated savings and effort.
- **Query telemetry data** — Access infrastructure telemetry metrics and correlate them with cost trends.
- **Manage organizations** — Switch between organizations and manage context for multi-org environments.

## Installation

Install the power from the Powers panel of NeuralBridge IDE (search for `cloudzero`).

## Authentication

This power uses browser-based OAuth — no API keys required.

On first use, a browser window will open for you to sign in with your CloudZero account. Your session persists across restarts.

### Permission Requirements

Most tools are available to any authenticated CloudZero user. Some require additional permissions:

| Tool | Required Permission |
|---|---|
| `get_telemetry_data`, `get_telemetry_streams` | Telemetry Stream Settings (View Telemetry Streams) |
| `get_optimize_recs` | Optimize (View Recommendations) |

## Available Tools

### Cost Analysis
| Tool | Description |
|---|---|
| `get_cost_data` | Query cost data with filters, groupings, date ranges, and granularity |
| `get_recent_query_history` | View recent cost queries to avoid redundant work |

### Cost Dimensions
| Tool | Description |
|---|---|
| `get_available_dimensions` | List all dimensions available for filtering and grouping |
| `get_dimension_values` | Get the available values for a specific dimension |

### Organization Context
| Tool | Description |
|---|---|
| `get_org_context` | Retrieve organization configuration and settings |
| `set_org_context` | Configure context for queries |
| `get_org_context_versions` | List available context versions |
| `get_user_organizations` | List organizations accessible to the current user |

### Optimization
| Tool | Description |
|---|---|
| `get_optimize_recs` | Retrieve cost optimization recommendations with filtering and sorting |

### Telemetry
| Tool | Description |
|---|---|
| `get_telemetry_data` | Retrieve telemetry metrics from configured streams |
| `get_telemetry_streams` | List available telemetry streams |

### Reference
| Tool | Description |
|---|---|
| `get_reference_info` | Look up CloudZero documentation and reference information |

## Example Prompts

Once authenticated, try asking things like:

- "What were our top 10 most expensive AWS services last month?"
- "Show me daily cost trends for the past 30 days, grouped by account"
- "Why did our costs spike last Tuesday?"
- "What cost optimization recommendations do we have? Sort by highest savings."
- "What telemetry streams are available and what do they show?"
- "Break down costs by environment for the production team"
- "Compare this month's spend to last month by region"

## Tips

- The power will automatically discover your organization's available dimensions — including any custom dimensions you've configured in CloudZero.
- For investigating cost spikes, the power will drill down across multiple dimensions (service, account, region) to isolate the source.
- Cost types include `real_cost`, `billed_cost`, `on_demand_cost`, `amortized_cost`, `discounted_cost`, and `discounted_amortized_cost` — ask for whichever view you need.

## Supported Models

This power has been tested with:

- **NeuralBridge** with Claude Sonnet 4.6

The power delegates all tool execution to CloudZero's remote MCP server and should work with any AI agent that supports the Model Context Protocol (MCP). The steering documents are model-agnostic.

## Action Scope

This power enables the AI agent to perform the following actions through CloudZero's MCP server:

**Read-only actions (no side effects):**
- Query cost data with filters, groupings, and date ranges
- List available cost dimensions and their values
- View recent query history
- Retrieve optimization recommendations
- Query telemetry streams and metrics
- List accessible organizations
- Look up CloudZero reference documentation

**State-changing actions:**
- `set_org_context` — switches the active organization context, which affects all subsequent queries. The agent will always confirm with the user before switching context.

The agent **cannot** create, modify, or delete any cloud resources, billing configurations, or CloudZero account settings. All actions are scoped to reading cost intelligence data and switching the query context.

### Prompt Injection Considerations

The steering documents in this power instruct the AI agent on how to use CloudZero tools. If an attacker were to modify these files (e.g., via a compromised fork or malicious PR), the agent's behavior could be manipulated to:
- Query data from unintended organizations
- Present misleading cost information
- Exfiltrate data by embedding it in queries

Users should install this power only from the official repository and verify the integrity of steering files after installation.

## Limitations

- **No write access** — This power is read-only for cost data. It cannot create budgets, alerts, or modify CloudZero configurations.
- **Permission-dependent** — Some tools (telemetry, optimization) require specific CloudZero permission sets. Users without these permissions will receive access errors.
- **Single active context** — Only one organization context is active at a time. Multi-org comparisons require switching context between queries.
- **Query latency** — Cost queries against large datasets or many dimensions may take several seconds to return.
- **Data freshness** — Cost data availability depends on CloudZero's ingestion pipeline. Recent costs (last 24-48 hours) may be incomplete.
- **No offline mode** — Requires an active connection to CloudZero's MCP server.

## Security

This power connects to CloudZero's remote MCP server (`czca-server.discovery.cloudzero.com`) over HTTPS. The security of this integration depends on TLS and DNS integrity for the CloudZero domain — no additional endpoint verification (e.g., certificate pinning) is performed beyond standard TLS.

Authentication is handled via browser-based OAuth. No API keys, tokens, or credentials are stored in this repository.

If stronger supply-chain protections become necessary, consider:
- Adding a `CODEOWNERS` file requiring security review for changes to `mcp.json`
- Adding CI validation that checks `mcp.json` URLs against an allowlist of approved CloudZero endpoints

## Learn More

- [CloudZero Documentation](https://docs.cloudzero.com)
- NeuralBridge Powers
