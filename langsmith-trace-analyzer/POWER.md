---
name: "langsmith-trace-analyzer"
displayName: "Analyze LangSmith Traces"
description: "Deep analysis of LangSmith traces with systematic node inspection, payload/response verification, latency profiling, cost analysis, and optional report generation."
keywords: ["langsmith", "trace", "langchain", "llm-observability", "agent-debugging", "observability", "tracing", "debugging", "performance"]
author: "Arnab Ghosh"
license: MIT
---

# Onboarding

## Prerequisites

1. **Node.js installed** — Required for the Playwright MCP server

## Quick Test

After installing this power, verify it works:

1. Ask: *"Navigate to https://smith.langchain.com and take a screenshot"*
2. If Playwright opens the page and captures a screenshot, the power is working
3. If you get a browser error, run: `npx -y @playwright/mcp@latest` to verify the Playwright MCP server installs correctly

---

# Analyze LangSmith Traces

## Overview

This power provides a rigorous, evidence-based methodology for analyzing LangSmith traces. It navigates the LangSmith SPA via Playwright, systematically inspects every node in the trace tree, reads actual payloads and responses (never infers), and produces a structured analysis of the entire execution flow.

Two primary capabilities:

1. **Trace Analysis** — Systematically inspect every node in the trace. Read actual payloads and responses, build a complete picture of latency, token usage, cost, errors, data flow, and architecture. Present findings with direct evidence.

2. **Report Generation (on request only)** — After completing the analysis, ask the user if they would like a formal report. If yes, generate a Markdown (.md) report. Only generate the report when the user explicitly requests it.

**Important:** This power uses Playwright browser automation to navigate LangSmith's web UI. Since LangSmith is a client-side SPA with no public MCP server, browser automation is the only way to read trace data interactively. This approach depends on LangSmith's current UI structure and may need updates if the UI changes significantly.

## LangSmith Trace Concepts

Understanding these concepts is essential before analyzing any trace.

### Traces, Runs, and the Run Tree

A **trace** records the full sequence of steps an application takes from input to output. Each step within a trace is a **run** (equivalent to a "span" in OpenTelemetry). Runs form a tree hierarchy via parent-child relationships, where the root run represents the top-level invocation and child runs represent nested operations.

Every run has a unique `id`, belongs to a `trace_id`, and optionally references a `parent_run_id`. The hierarchical position is encoded in the `dotted_order` field — a sortable key formatted as `<start_time>Z<run_uuid>.<child_start_time>Z<child_uuid>...`. The `trace_id` is always the first UUID in the dotted order.

### Run Types

LangSmith classifies runs into seven types. Each type appears differently in the UI and carries different metadata:

| Run Type | Description | Key Metadata |
|----------|-------------|--------------|
| `chain` | Generic orchestration or function call (default type) | Input/output messages, child run count |
| `llm` | Language model generation | Model ID, prompt/completion tokens, cost, first_token_time |
| `tool` | Tool or function execution | Tool name, parameters, return value, error |
| `retriever` | Document retrieval (RAG) | Query, retrieved documents, relevance scores |
| `embedding` | Text embedding generation | Input text, vector dimensions |
| `prompt` | Prompt formatting/template rendering | Template variables, rendered prompt |
| `parser` | Output parsing | Raw input, parsed output |

### Key Run Data Fields

| Field | Description |
|-------|-------------|
| `name` | Run name (function/chain/model name) |
| `run_type` | One of the seven types above |
| `start_time` / `end_time` | Execution timestamps |
| `status` | `success`, `error`, or `pending` |
| `inputs` / `outputs` | Serialized input/output data |
| `error` | Error message and stack trace (if failed) |
| `prompt_tokens` / `completion_tokens` / `total_tokens` | Token counts (LLM runs) |
| `prompt_cost` / `completion_cost` / `total_cost` | Cost in USD (LLM runs) |
| `first_token_time` | Time when first output token was generated (streaming LLM runs) |
| `tags` | User-defined labels for filtering |
| `extra` | Additional metadata (includes `ls_method` indicating instrumentation type) |
| `events` | List of events — streaming LLM runs log each token as a `new_token` event |
| `feedback_stats` | Aggregated feedback scores |

### Threads and Sessions

LangSmith groups multi-turn conversations into **threads** using special metadata keys (`session_id`, `thread_id`, or `conversation_id`). Traces are organized into **projects** (also called sessions) — a container for related traces from a single application or service.

### Instrumentation Methods

Runs can be created via different instrumentation methods, visible in the `extra.ls_method` field:

- **`traceable`** — Function decorated with `@traceable` (LangSmith SDK)
- **LangChain auto-instrumentation** — Automatic tracing via LangChain's callback system
- **REST API** — Manual trace submission via the LangSmith API

### PII Redaction

LangSmith can mask sensitive data in traces. When enabled, values are replaced with type tokens: numbers become `<NUMBER>`, dates become `<DATE_TIME>`, names become `<NAME>`, emails become `<EMAIL>`. You cannot read exact values but can count structural elements (JSON objects, field names, array items).

## Available Steering Files

- **trace-analysis** — The complete deep-analysis workflow. Covers trace loading, systematic node inspection, payload/response reading, analysis framework, and findings synthesis. Read this before starting any analysis.
- **report-generation** — Report generation workflow in Markdown format. Only read this when the user explicitly requests a report after analysis is complete.

## Available MCP Servers

### playwright
Browser automation for navigating LangSmith's SPA. Used to load traces, click into nodes, read payloads/responses, expand truncated data, take screenshots.

Key tools used in this power:
- `browser_navigate` — Load the LangSmith trace URL
- `browser_snapshot` — Capture accessibility tree for reading node data
- `browser_find` — Search the current page snapshot for a node by name (cheaper than a full snapshot)
- `browser_click` — Click into nodes, expand sections, click RAW view
- `browser_tabs` — Switch to/close the new tab that the RAW view opens
- `browser_take_screenshot` — Capture visual evidence of each node
- `browser_wait_for` — Wait for SPA rendering
- `browser_evaluate` — Execute JS on the page (used to scroll the virtualized tree)
- `browser_press_key` — Keyboard navigation

## Tool Usage Examples

### Loading a trace and reading the tree

```
1. browser_navigate → https://smith.langchain.com/public/{trace-id}/r
2. browser_wait_for → time: 5  (SPA needs time to render)
3. browser_snapshot → read the full accessibility tree to see all nodes
4. browser_take_screenshot → omit the filename parameter (see note below)
```

**Note on screenshot paths:** The Playwright MCP server sandboxes file writes. Do NOT pass a `filename` — both absolute and relative paths are rejected. Omit the parameter: the server auto-names the file inside its own output directory and returns the saved path in the tool result. Keep a numbered log mapping each screenshot's purpose to its returned path (e.g., "01 trace overview → tmp/.playwright-mcp/page-....png"). If the user requests a report, copy the logged screenshots into `output/screenshots/` with descriptive names at generation time.

### Clicking into a node to read its data

```
1. browser_click → ref: [node ref from snapshot]  (click the node in the tree)
2. browser_snapshot → read the node detail panel (input, output, metadata)
3. browser_take_screenshot → save evidence
```

### Reading full tool response (RAW view)

```
1. browser_click → ref: [RAW button ref]  (opens full payload in new tab)
2. browser_tabs → action: select, index: 1  (switch to RAW tab)
3. browser_snapshot → read the complete untruncated JSON
4. browser_tabs → action: select, index: 0  (switch back)
```

### Scrolling a virtualized trace tree

LangSmith uses a virtualized list — only visible nodes are in the DOM. To find nodes below the fold:

```
1. browser_evaluate → function: () => { const s = document.querySelector('[data-testid="virtuoso-scroller"]'); s.scrollTop = s.scrollHeight; return s.scrollTop; }
2. browser_find → search for the target node by name (or browser_snapshot to see all visible nodes)
3. Repeat with intermediate scrollTop values until you find the target node
```

## Critical Rules

These rules exist because of real mistakes in past analyses. Violating them produces incorrect reports.

### Rule 1: If you haven't read it, you can't claim it
If you have not clicked into a node and read its actual input/output data, you CANNOT make any statement about what that node does, why it's slow, or what it contains. Say "I haven't inspected this yet" and go read it before answering. Guessing is always worse than saying "I don't know yet."

### Rule 2: NEVER infer what a node is doing from its name
An LLM node named "Formatter" might be doing routing. A node named "Supervisor" might be generating the final response. You MUST click into the node, read its input messages and output, and describe what it ACTUALLY does. Names lie. Data doesn't.

### Rule 3: Understand agent loop iterations
In ReAct/tool-use agents, the LLM is called multiple times in a loop. Each call is a continuation of reasoning, NOT a separate purpose-built step. Describe them as "agent loop iteration N" and explain what the LLM decided based on what you read.

### Rule 4: Supervisor responses are by design
In Supervisor patterns, the Supervisor produces the final user-facing response after a sub-agent transfers back. This is expected behavior. Do NOT call it "re-generating" or "duplicating" unless you have verified the system prompt instruction and can cite it.

### Rule 5: Facts first, interpretation second
For each node: state what you saw (model, latency, tokens, input, output). Then provide your analysis. Keep facts and interpretation clearly separated.

### Rule 6: Never state a number you haven't counted
If you say "20 fields", you must have counted exactly 20 by reading the RAW payload. ALWAYS click RAW on tool responses before stating any count. If you haven't counted yet, say "I need to check the RAW view to count" — then go count. No "~", no "about", no "approximately". List items explicitly when counting (field names, records, columns) so the count is verifiable.

### Rule 7: Professional language
Frame suggestions as opportunities. Caveat model change recommendations with quality validation needs. Never send approximate numbers when exact numbers are available.

### Rule 8: LangSmith PII redaction awareness
LangSmith masks sensitive data: numbers become `<NUMBER>`, dates become `<DATE_TIME>`, names become `<NAME>`. You CANNOT read exact values but CAN count structural elements (JSON objects, field names, column headers).

## Quick Start

### Analyzing a Trace

1. Activate this power
2. Read the `trace-analysis` steering file
3. User provides a LangSmith trace URL
4. Follow the systematic workflow: load trace → quick scan → ask user what to investigate → deep-dive → present findings
5. After presenting findings, ask the user: "Would you like me to generate a formal report?"
6. Only if the user says yes, read the `report-generation` steering file and generate the report

### Generating a Report

Reports are generated ONLY when the user explicitly requests one. Do not generate a report automatically.

1. Read the `report-generation` steering file
2. Follow the workflow

## Tips

1. **Wait for the SPA** — Always wait 4-5 seconds after navigating to a LangSmith URL before taking a snapshot
2. **Screenshot everything** — Take a screenshot of every node you inspect. This is your evidence.
3. **Read before describing** — Read BOTH input and output of every LLM node before describing its purpose
4. **Snapshot for text, screenshot for evidence** — Use `browser_snapshot` to read content, `browser_take_screenshot` for visual proof
5. **Always click RAW** — The default YAML view truncates large outputs. Click RAW before counting anything.
6. **Expand hidden runs** — If the tree shows "Show N hidden runs", expand it before proceeding
7. **Check `extra` metadata** — The `ls_method` field tells you how the run was instrumented
8. **Look for `first_token_time`** — On streaming LLM runs, this gives you TTFT performance data
9. **Virtualized tree** — LangSmith only renders visible nodes. Scroll the tree panel to find nodes below the fold.
10. **Be honest about gaps** — If you haven't inspected a node, say so. Never extrapolate from one node to another.

## Troubleshooting

### LangSmith page doesn't load
LangSmith is a client-side SPA. `fetch` will not work. You must use Playwright `browser_navigate` and wait for rendering.

### Node data appears truncated
Click the RAW button to open the full payload. The default YAML view truncates large outputs.

### Dialog popup blocks interaction
LangSmith sometimes shows "Switch to Agent Builder" or similar dialogs. Use `browser_snapshot` to identify the dialog, then `browser_click` to dismiss it.

### PII-redacted values
Numbers, dates, names, and emails are masked by LangSmith. Count structural elements instead of trying to read exact values.

### UI structure changes
This power depends on LangSmith's current web UI layout. If elements are not found where expected, take a `browser_snapshot` to inspect the current page structure and adapt accordingly.

### Tree nodes not visible
LangSmith uses a virtualized list. Only nodes in the visible scroll area are in the DOM. Use `browser_evaluate` to scroll the `[data-testid="virtuoso-scroller"]` element to find nodes below the fold.

## Resources

- [LangSmith Observability Concepts](https://docs.langchain.com/langsmith/observability-concepts)
- [Run (Span) Data Format](https://docs.smith.langchain.com/reference/data_formats/run_data_format)
- [Cost Tracking](https://docs.langchain.com/langsmith/cost-tracking)

## Configuration

No additional configuration required beyond the MCP servers defined in mcp.json.

---

## License and support

This power is licensed under [MIT](LICENSE).

It uses the [Playwright MCP server](https://github.com/microsoft/playwright-mcp) (Apache-2.0), which runs locally over stdio. No user data is collected by this power; trace data is read directly from LangSmith in your local browser session.


**Package:** `@playwright/mcp` (pinned in mcp.json)
**Connection:** Local Playwright MCP server (stdio)
