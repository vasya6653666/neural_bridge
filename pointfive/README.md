---
name: "pointfive"
displayName: "PointFive"
description: "AI-powered cloud cost and efficiency optimization across AWS, Azure, and GCP. Query opportunities, resources, anomalies, and commitment recommendations from the PointFive platform using natural language. Built on PointFive's production MCP server with OAuth and API token authentication."
keywords: ["pointfive", "cloud cost", "cloud efficiency", "optimization", "savings", "aws", "azure", "gcp", "finops", "anomaly detection", "commitments", "reserved instances"]
author: "PointFive"
---

# PointFive

## Listing Information

- **License:** Apache-2.0
- **Privacy Policy:** https://www.pointfive.co/privacy
- **Support:** support@pointfive.co · [help.pointfive.co](https://help.pointfive.co)
- **MCP server status:** Production (generally available)
- **Vendor:** PointFive — https://www.pointfive.co

## Overview

PointFive is a PointFive AI Efficiency OS that helps engineering and finance teams continuously identify, prioritize, and remediate waste across AWS, Azure, GCP, and Kubernetes. This Power connects NeuralBridge to PointFive's production MCP server, exposing live cost-optimization opportunities, resource intelligence, anomaly signals, and commitment (Savings Plan / Reserved Instance) recommendations through natural-language conversation in your IDE.

Use it to answer questions like:

- *"What are my top cost-optimization opportunities in AWS this month?"*
- *"Show me cost anomalies from the last 7 days, grouped by service."*
- *"Which Kubernetes workloads have the largest savings potential?"*
- *"Recommend a Savings Plan strategy for my current EC2 usage."*

Permissions mirror your existing PointFive RBAC exactly — the Power can only see data your platform user is already authorized to access.

## Access Requirements

Before installing this Power, confirm the following:

- **Active PointFive platform account.** All authentication (OAuth and API token) links to a real PointFive user. If you cannot sign in at `app.pointfive.co`, this Power will not connect.
- **Required role / permissions.** `ADMIN` and `MEMBER` roles can read all MCP-exposed data. Restricted roles see a filtered view scoped to the resources they are authorized for.
- **Network access.** Outbound HTTPS (TCP 443) from the NeuralBridge host to `mcp.pointfive.co`. No inbound connection from PointFive is required.
- **API token (recommended for NeuralBridge):** Generated from the PointFive Profile page under **API Token**.

## Setup

### 1. Generate a PointFive API token

1. Sign in to PointFive at `https://app.pointfive.co`.
2. Open your **Profile** page → **API Token** section.
3. Click **Generate token**, give it a descriptive label (e.g. `neuralbridge-laptop`), and select an expiry that matches your organization's security policy.
4. **Copy the token immediately** — it is shown once and cannot be retrieved again.

Tokens inherit the role and permissions of the user who created them. All MCP activity is attributed to that user in PointFive's audit logs.

### 2. Set the token as an environment variable

Set `POINTFIVE_API_TOKEN` in the environment NeuralBridge launches with:

```bash
export POINTFIVE_API_TOKEN="<paste-token-here>"
```

Storing the token as an environment variable (rather than inlining it into `mcp.json`) keeps it out of process listings, shell history, and committed config files.

### 3. Install the Power

The Power's `mcp.json` is preconfigured to use the HTTP transport with the API token from the environment:

```json
{
  "mcpServers": {
    "pointfive": {
      "url": "https://mcp.pointfive.co/mcp",
      "headers": {
        "Authorization": "Bearer ${POINTFIVE_API_TOKEN}"
      }
    }
  }
}
```

Once installed, start a new NeuralBridge chat and ask a question about your cloud spend to confirm the connection.

## Available Tools

The PointFive MCP server exposes 14 tools across four domains. All tool access is governed by your PointFive RBAC.

### Cost Optimization

| Tool | Purpose |
|---|---|
| `get_opportunities` | Search and filter cost-optimization opportunities with advanced filtering and pagination |
| `get_opportunity` | Detailed information about a specific opportunity by ID |
| `get_opportunities_aggregate` | Aggregated savings data grouped by project, service, type, status, or time period |
| `get_opportunity_groups` | Opportunity groups by type, including remediation scripts |

### Cloud Resources

| Tool | Purpose |
|---|---|
| `get_resources` | Search and filter cloud resources with cost, savings, and metadata filtering |
| `get_resource_aggregations` | Aggregated resource data grouped by service, project, or time interval |
| `get_resource` | Detailed information about a specific resource (attributes, costs, savings) |
| `get_resource_connections` | Connections and relationships for a specific resource |
| `get_resource_opportunities` | Cost-optimization opportunities for a specific resource, with priority and effort levels |

### Anomaly Detection

| Tool | Purpose |
|---|---|
| `list_anomalies` | Search and filter cost anomalies |
| `get_anomaly` | Detailed anomaly information (cost impact, datapoints, rule details) |
| `get_anomaly_contributors` | Root-cause analysis and contributing factors for an anomaly |

### Commitment Management

| Tool | Purpose |
|---|---|
| `get_commitment_recommendations` | Search Savings Plan / Reserved Instance recommendations |
| `get_commitment_recommendation` | Detailed commitment information (hourly usage data, payment options) |

## Example Workflows

### Find this month's largest optimization wins

> *"List my top 10 PointFive opportunities by potential savings, grouped by service category."*

NeuralBridge will call `get_opportunities_aggregate` with the appropriate filters and return a ranked summary with remediation difficulty per group.

### Investigate a spike in cloud spend

> *"Show me cost anomalies from the last 14 days for our production AWS account, and identify the top contributors for the biggest one."*

NeuralBridge will call `list_anomalies` to surface the spike, then `get_anomaly_contributors` to perform root-cause analysis.

### Plan commitment purchases

> *"Recommend a Savings Plan strategy for our EC2 footprint. Show me hourly usage and payment options for the top recommendation."*

NeuralBridge will call `get_commitment_recommendations` and drill into the details with `get_commitment_recommendation`.

### Triage a specific resource

> *"What are the optimization opportunities for resource `i-0abc1234def567890`, and how is it connected to other resources?"*

NeuralBridge will call `get_resource`, `get_resource_opportunities`, and `get_resource_connections` to give a complete picture.

## Privacy and Security

- Conversations with NeuralBridge remain private to you. PointFive can see which API endpoints are accessed by your MCP session but has no visibility into your prompts or chat history.
- Authentication uses standard Bearer tokens scoped to your PointFive user. Revoking a token from the **API Tokens** page in PointFive takes effect immediately.
- The MCP server enforces the same role-based access controls as the PointFive platform — no additional data exposure beyond your existing access rights.
- Network direction is outbound only: NeuralBridge → `mcp.pointfive.co`. PointFive never initiates a connection to your environment.

## Troubleshooting

**`401 Unauthorized` on the first call**

- Confirm the token is pasted without surrounding quotes or whitespace.
- Verify the token has not been revoked or expired on the **API Tokens** page in PointFive.
- The header must be exactly `Authorization: Bearer <token>` — the `Bearer` prefix is required.
- Confirm that `POINTFIVE_API_TOKEN` is set in the process that launches NeuralBridge, not just your interactive shell.

**Empty results when querying opportunities or resources**

- Verify that your PointFive account has data integrated for the cloud account in question.
- Check role-based access — restricted roles may have a filtered view that excludes the data you are asking about.
- Confirm the date range and filters in your query.

**Connection timeout / no response**

- Verify outbound HTTPS access from the NeuralBridge host to `mcp.pointfive.co`.
- If you are behind a corporate proxy, ensure HTTPS traffic to `*.pointfive.co` is allowed.

For anything not resolved by the above, contact `support@pointfive.co` or open a ticket via the [PointFive Help Center](https://help.pointfive.co).

## Related Resources

- **PointFive MCP Server overview:** https://help.pointfive.co/en/articles/12344259-pointfive-mcp-server
- **MCP Setup guide (all clients):** https://help.pointfive.co/en/articles/12344264-mcp-setup
- **PointFive platform:** https://www.pointfive.co
- **Help Center:** https://help.pointfive.co
