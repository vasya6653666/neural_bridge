# LangSmith Trace Analyzer

A NeuralBridge Power for deep analysis of LangSmith traces with systematic node inspection, latency profiling, cost analysis, and optional report generation.

## Install as a NeuralBridge Power

Install the power from the **Powers** panel in NeuralBridge IDE.

Then ask something like:

```
analyze this LangSmith trace: https://smith.langchain.com/public/YOUR_TRACE_ID/r
```

## What It Does

- Navigates LangSmith's web UI via Playwright browser automation
- Systematically inspects every node in the trace tree
- Reads actual payloads and responses (never infers)
- Identifies latency bottlenecks, token waste, and architectural issues
- Generates formal reports in Markdown format (on request)

## Prerequisites

- Node.js (for Playwright MCP server)

## Structure

```
├── POWER.md          # Power documentation and agent instructions
├── mcp.json          # Playwright MCP server configuration
├── TESTING.md        # Regression testing guide (golden fixtures + probes)
├── test-fixtures/    # Deterministic trace fixture generator
└── steering/
    ├── trace-analysis.md      # Deep-dive analysis workflow
    └── report-generation.md   # Report generation workflow (Markdown)
```

## Settings

Once installed, the Playwright MCP server runs automatically. No additional configuration needed.

## License

MIT
