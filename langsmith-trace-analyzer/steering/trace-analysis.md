# Trace Analysis Workflow

This steering file is the complete methodology for analyzing a LangSmith trace. It uses a two-phase approach: a quick scan to orient, then targeted deep-dives to build evidence before making any claims.

---

## THE CARDINAL RULES

**Rule A: Never state what you have not verified by reading the actual node data.**

- If you have not clicked into a node and read its input/output, you CANNOT describe what it does.
- If you are unsure about something, say "I haven't inspected this node yet" and offer to deep-dive.
- If the user asks a question you cannot answer from what you've read so far, say so and go read the relevant nodes before answering.
- Guessing is worse than saying "I don't know yet — let me check."
- Every factual claim must trace back to a specific node you inspected. No exceptions.

This rule exists because names lie. Data doesn't.

**Rule B: Always verify data survives boundaries.**

- Whenever data crosses a boundary — agent handoffs, tool returns, subgraph exits, serialization steps — verify that what was produced on one side actually arrives intact on the other side.
- Read the output of the producing node. Then read the input of the consuming node. Compare them.
- Look for: fields dropped, structures flattened to text, metadata stripped, arrays reduced to summaries, or intermediate nodes that transform data between producer and consumer.
- If data is lost: quantify the impact — how many tokens and how much latency was spent generating data that never reaches its intended destination?

**Rule C: Never state a number you have not counted. No approximations. No "~". No "about".**

- If you say "20 fields", you must have counted exactly 20 fields by reading the RAW payload.
- If you haven't counted yet, say "I need to check the RAW view to count the exact fields" — then go count.
- ALWAYS click RAW on tool responses before stating any count (records, fields, columns, items).
- When comparing tool output fields to LLM output columns, count BOTH independently from the actual data. List them explicitly.
- This applies to everything: field counts, record counts, message counts, token counts. If you haven't verified the number from the source, use "I haven't counted yet" instead of guessing.

---

## Phase 1: Quick Scan

The goal of Phase 1 is to load the trace, see the full tree, and give the user a fast orientation. You are NOT making claims about what nodes do — you are reporting what you can see from the overview.

### Step 1: Load the trace

```
browser_navigate → LangSmith trace URL
```

Wait 4-5 seconds for the SPA to render. LangSmith is entirely client-side.

### Step 2: Dismiss any dialogs

Take a `browser_snapshot`. If any dialog is present (e.g., "Switch to Agent Builder"), click to dismiss it.

### Step 3: Capture and expand the full tree

1. Take a `browser_take_screenshot` of the trace overview (omit the `filename` parameter — the server auto-names the file and returns the saved path). Log it as "01 trace overview → [returned path]".
2. If the tree shows "Show N hidden runs" or collapsed sections, expand ALL of them. Every node must be visible.
3. Take another screenshot if the tree changed after expanding.

### Step 4: Record what you can see from the overview

From the trace overview (without clicking into any node), record:
- Total trace duration
- Total token count (if shown)
- Total cost (if shown)
- Status (success/error)
- Root node name and type
- The full tree structure: list every visible node with its name, type, and duration
- Count of nodes by type (how many LLM calls, how many tool calls, etc.)

### Step 5: Present the Quick Scan to the user

Present a concise orientation:

```
**Trace Overview**
- URL: [url]
- Status: [success/error] | Duration: [Xs] | Tokens: [N] | Cost: [if shown]
- Tree: [N] nodes total ([M] LLM calls, [K] tool calls, [J] other)

**Visible Tree Structure**
Root → [node names with types and durations, as a tree]

**What I can see so far (surface-level only):**
- [Observations from the overview ONLY — e.g., "3 LLM calls, the longest is 28s", "1 tool call shows error status"]
- [Any obvious patterns visible from the tree — e.g., "appears to be a Supervisor pattern with sub-agents"]

**What I cannot tell yet:**
- Why specific nodes are slow (need to inspect their input/output)
- What each LLM call is actually doing (need to read messages)
- Whether context is bloating across calls (need to check message counts)
- Root cause of any errors (need to read error details)

**What would you like me to investigate?**
I can deep-dive into:
1. **Why is it slow?** — I'll inspect the slowest nodes and trace the latency bottleneck
2. **Why does it cost this much?** — I'll check token counts and context sizes across LLM calls
3. **Why did it fail / pick the wrong tool / loop?** — I'll read the decision chain in the LLM nodes
4. **Full analysis** — I'll inspect every node systematically and give you the complete picture
5. Or ask me a specific question about any node you see in the tree
```

**IMPORTANT**: Do NOT answer questions about node behavior at this stage. If asked, say you need to inspect the node first.

---

## Phase 2: Deep-Dive

Phase 2 is where you inspect actual node data. Which nodes you inspect depends on what the user wants to know. But the inspection methodology is always the same: click in, read everything, screenshot, then describe what you saw.

### Choosing what to inspect

Based on the user's question or choice from Phase 1:

**"Why is it slow?"** → Start with the top 3 nodes by duration. For each, inspect input size (message count, context length) and output size. Then check if slow nodes are sequential or parallel.

**"Why does it cost this much?"** → Inspect all LLM nodes. Record token counts, costs, and input context sizes. Track how context grows across successive calls.

**"Why did it fail / wrong tool / loop?"** → Inspect the error node and the LLM call(s) immediately before it. Read the system prompt, available tools, and the LLM's decision. Then trace forward to see how the system recovered.

**"Full analysis"** → Inspect every node in order. This is the most thorough but slowest path.

**Specific question** → Inspect the relevant node(s) and their immediate neighbors (parent, siblings, children).

### How to inspect each node type

#### LLM nodes — full inspection

1. Click into the node
2. Read the **Input messages**:
   - Count the messages
   - Read the system prompt
   - Read every human, AI, and tool response message
   - Note the full content of each
3. Read the **Output**:
   - Is it a tool_use call? A text response? Both?
   - Read the exact content
4. Read the **Tools section** — which tools are available? Which was called?
5. Record from metadata:
   - Token counts: input, output, total
   - Cost: prompt cost, completion cost, total (if available)
   - TTFT: first_token_time (if available, streaming only)
   - Model: exact identifier
   - Instrumentation: `extra.ls_method`
6. Determine agent loop iteration:
   - 1st LLM call in a chain = initial routing or tool decision
   - 2nd+ = continuation after tool result
   - Describe as "agent loop iteration N"
7. Take a screenshot. Save with descriptive name.
8. **Only now** describe what this node is doing — based on what you read, not its name.

#### Tool nodes — full inspection

1. Click into the node
2. Read the **Input** — every parameter and its value
3. Read the **Output** — success or failure? What data returned?
4. **ALWAYS click RAW** to see the full untruncated payload. The default YAML view truncates. You MUST read RAW before stating any counts.
5. If JSON data returned, count from the RAW view:
   - Count the exact number of records/objects by counting `{` at the record level
   - Count the exact number of fields per record by listing every field name from the first record
   - List every field name explicitly (e.g., "orderno, ordersuf, transtype, ..." — all of them)
   - State the count as "X fields" only after you have listed them all
6. If the downstream LLM uses only some of these fields in its output, count BOTH sets independently:
   - "Tool returned X fields: [list all]"
   - "LLM used Y fields in output: [list all]"
   - "Z fields (X-Y) were unused: [list the unused ones]"
7. If error: read full error message verbatim. Note what happens next in the tree.
8. Record: tool name, duration, status
9. Take a screenshot.

#### Retriever nodes

1. Click in, read query/input
2. Read retrieved documents — count, content, relevance scores
3. Record duration. Screenshot.

#### Embedding / Prompt / Parser nodes

1. Click in, read input and output
2. Note model (embedding), template vars (prompt), or parsed structure (parser)
3. Record duration. Screenshot.

#### Chain/Agent wrapper nodes

1. Note input vs output message count (reveals loop iteration count)
2. Map child nodes and their sequence
3. Calculate overhead: wrapper duration minus sum of children

#### Data boundary verification

Whenever data crosses a boundary in the trace — between any two connected nodes — verify integrity:

1. Identify every point where one node's output feeds into another node's input
2. Read the producing node's output — record the full structure
3. Read the consuming node's input — record what it actually received
4. Compare: is anything missing, transformed, or flattened?
5. If data is lost: quantify the waste — tokens and latency spent producing data that doesn't arrive
6. Screenshot both sides for evidence

### Screenshot naming

Omit the `filename` parameter — the server auto-names each screenshot and returns the saved path. Keep a numbered log mapping purpose to path (e.g., "01 trace overview → tmp/.playwright-mcp/page-....png", "02 llm routing → ..."). If the user later requests a report, copy the logged screenshots into `output/screenshots/` with descriptive names (`01-trace-overview.png`, `02-llm-routing.png`) so the report's relative links resolve.

---

## Phase 3: Tell the Story

After inspecting the relevant nodes, present your findings as a narrative that answers the user's question. Structure depends on what they asked.

### For "Why is it slow?"

```
**Latency Bottleneck**

The trace took [total]s. Here's where the time went:

| Node | Type | Duration | % of Total | Why |
|------|------|----------|------------|-----|
| [name] | LLM | [X]s | [Y]% | [evidence: e.g., "28,000 input tokens from tool response"] |
| [name] | Tool | [X]s | [Y]% | [evidence: e.g., "external API call to orders service"] |
| ... | ... | ... | ... | ... |

**The main bottleneck is [node name]** because [specific evidence from inspection].
[If applicable: "This could potentially be improved by [suggestion], though [caveat]."]
```

### For "Why does it cost this much?"

```
**Cost Breakdown**

Total trace cost: $[X] across [N] LLM calls.

| LLM Call | Model | Input Tokens | Output Tokens | Cost | Context Size |
|----------|-------|-------------|---------------|------|--------------|
| ... | ... | ... | ... | ... | [N] messages |

**The most expensive call is [name]** at $[X] because [evidence: e.g., "it received the full 3,200-token tool response plus 8 prior messages"].

**Context growth pattern**: [describe how input context grows across successive LLM calls, with exact message counts from each node you inspected]
```

### For "Why did it fail / wrong tool / loop?"

```
**Decision Chain Analysis**

Here's what happened step by step:

1. **[LLM node name]** received [N] messages including [describe key content].
   The system prompt instructed: "[exact quote from system prompt]".
   Available tools: [list].
   **Decision**: The LLM chose to call [tool name] with parameters [params].

2. **[Tool node name]** executed and [succeeded/failed].
   [If failed: "Error: [exact error message]"]
   [If succeeded: "Returned [describe output]"]

3. **[Next LLM node]** received the [result/error] and decided to [describe].
   ...

**Root cause**: [specific evidence-based explanation]
**How the system handled it**: [what happened after]
```

### For "Full analysis"

Present in this order:

1. **What happened** — Chronological walkthrough of every node, facts only
2. **Latency** — Where time was spent and why
3. **Cost** — Where tokens/money were spent and why
4. **Errors** — What failed and how the system recovered
5. **Context flow** — How data moved through the system and whether context bloated
6. **Data integrity** — Whether data produced by one node arrived intact at the consuming node, or was lost/transformed at boundaries
7. **Architecture** — What pattern was used, whether models are well-matched to their roles
8. **Opportunities** — Actionable suggestions with evidence and caveats

### Presentation rules

- **Facts first, interpretation second.** For each node: state what you saw, then what you think it means.
- **Cite your evidence.** "Node X took 28s because its input contained 28,000 tokens (screenshot 04)" — not "Node X was slow."
- **Quantify impact.** "This adds 3,200 tokens to every subsequent LLM call" — not "This inflates context."
- **Frame suggestions as opportunities.** "It may be worth evaluating..." — not "You should..."
- **Caveat model recommendations.** Any suggestion to change models must acknowledge quality trade-offs.

---

## Handling Follow-Up Questions

After presenting your analysis, the user may ask follow-up questions. If you've already inspected the relevant node, answer with evidence. If not, say so and go inspect it before answering. Never extrapolate from one node to another.

---

## Common Patterns — Describe Accurately

### What looks like "formatting" but is not
A slow LLM call after a tool returns data is the agent's standard response generation step. Describe it as: "The agent's response generation step took Xs. The input context included N messages with the JSON tool response. The output was a text response containing [describe what you see]."

### What looks like "re-generation" but is not
When a Supervisor produces a response after a sub-agent transfers back, it is producing the final user-facing response. Describe it as: "The Supervisor's response step took Xs. It received N messages including the sub-agent's output and produced the final response to the user."

### Agent loop iterations
In ReAct/tool-use agents, the LLM is called multiple times in a loop. Each call is a continuation of reasoning, NOT a separate purpose-built step. Describe them as "agent loop iteration N" and explain what the LLM decided based on what you read.

### What IS a legitimate concern
- A tool call failing because a parameter was not documented or defaulted
- Large input context causing slow LLM calls (cite the message count)
- Large output causing slow token generation (cite the token count)
- The same large data appearing in multiple downstream nodes' input context
- A system prompt instruction that forces verbose output (cite the exact instruction)
- High TTFT on a streaming call indicating the model is struggling with a large prompt
- Expensive model used for a simple routing decision that a smaller model could handle
- Structured data generated at significant cost but lost or flattened before reaching its intended destination

---

## After Analysis: Offer Report

After presenting your findings, ask:

> "Would you like me to generate a formal report?"

Only if the user says yes, read the `report-generation` steering file.


