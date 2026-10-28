---
name: "rawtree"
displayName: "RawTree"
description: "Build analytics workflows with RawTree's dynamic-column database, SQL query engine, ingestion API, observability data, and hosted MCP tools."
keywords:
  - rawtree
  - analytics database
  - database
  - SQL
  - dynamic columns
  - observability
  - logs
  - traces
  - metrics
  - ingest
  - query
  - MCP
author: "RawTree"
---

# RawTree

Use this Power when working with RawTree's analytics database, CLI, API, SQL
queries, dynamic columns, ingestion, observability data, or MCP tools.

The detailed, portable instructions live in
[`skills/rawtree/SKILL.md`](skills/rawtree/SKILL.md). Use those instructions as
the source of truth for authentication, resource discovery, SQL, ingestion,
troubleshooting, and confirmation requirements for mutations.

## MCP

The bundled MCP configuration connects to RawTree's hosted Streamable HTTP
server at `https://mcp.rawtree.com/mcp`. Authenticate through NeuralBridge when
prompted. Do not add API keys or authorization headers to this repository.

NeuralBridge MCP configuration:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "rawtree": {
      "type": "streamable-http",
      "url": "https://mcp.rawtree.com/mcp"
    }
  }
}
```

For local MCP development, follow the setup in the
[`rawtree-mcp` repository](https://github.com/rawtreedb/rawtree-mcp).
