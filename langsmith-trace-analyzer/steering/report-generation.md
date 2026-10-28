# Report Generation Workflow

Generate a formal Markdown report from a completed trace analysis. The analysis MUST be completed first.

Reports are generated ONLY when the user explicitly requests one.

---

## Report Structure

Write the report to `output/trace-analysis-report-{trace-id-prefix}.md`, where `{trace-id-prefix}` is the first 8 characters of the trace ID (e.g., `output/trace-analysis-report-019f730a.md`). This prevents consecutive analyses from overwriting each other.

Copy the screenshots taken during analysis (the Playwright MCP server returns the saved path for each one) into `output/screenshots/` alongside the report, so the report's relative image links resolve.

### Sections (in order):

1. **Header** — Title, trace URL, date, summary metrics (duration, tokens, cost, status, node count)

2. **Executive Summary** — 2-3 paragraphs: architecture pattern, top findings, overall assessment

3. **Architecture Overview** — Call chain with node names and latencies, models used, routing mechanism. Include trace overview screenshot.

4. **Step-by-Step Walkthrough** — For every inspected node, a table with Type/Duration/Model/Status/Cost/TTFT, then Input summary, Output summary, Analysis (interpretation separated from facts). Include node screenshot.

5. **Latency Waterfall** — Table: Node | Type | Duration | % Total | Cumulative

6. **Token Usage** — Table: LLM Call | Model | Input Tokens | Output Tokens | Total | Context (message count)

7. **Cost Breakdown** — Table: LLM Call | Model | Prompt Cost | Completion Cost | Total Cost. Include total row. If cost data unavailable, note it.

8. **TTFT Analysis** — Table: LLM Call | Model | TTFT | Total Duration | Generation Rate. Only include if `first_token_time` data exists. Omit entirely otherwise.

9. **Findings** — Numbered. Each: Title, Observation (facts + node refs), Evidence (screenshot ref + numbers), Impact (quantified), Severity (High/Medium/Low)

10. **Recommendations** — Numbered. Each: Title, Related Finding, Suggestion (framed as opportunity), Expected Impact (conservative), Caveats (trade-offs)

11. **Projected Improvement** — Conservative estimates with ranges for latency, tokens, and cost savings.

---

## Language Guidelines

**DO use:** "agent loop iteration N", "response generation step", "Finding" (not "Root Cause"), "it may be worth evaluating", exact numbers from metadata.

**DO NOT use:** "formatting call" or "re-generation call" (unless verified), "Root Cause", approximate numbers when exact numbers are available, superlatives or hyperbole.

**Model change recommendations:** Always caveat with quality validation needs. Never recommend without acknowledging the trade-off.

---

## Screenshot References

Use relative paths: `![Caption](screenshots/filename.png)`
