---
name: "pillir-flow"
displayName: "Pillir Flow"
description: "Pillir Flow — the AI execution engine. Turns AI intent into real work, executed directly against SAP, Oracle, JD Edwards, and your enterprise systems. No APIs. No rewrites. No middleware."
keywords: ["pillir", "flow", "pillir flow", "enterprise app",  "sap integration", "oracle integration",  "app generation", "work unit"]
version: "0.1.0"
author: "Pillir"
icon: "./icon.png"
license: "MIT"
privacyPolicy: "https://www.pillir.io/privacy-policy"
support: "support@pillir.ai"
homepage: "https://pillir.ai"
repository: "https://github.com/pillir/power-pillir-flow"
mcpServers:
  - name: "pillir-flow"
    license: "LicenseRef-Pillir-Commercial"
    privacyPolicy: "https://www.pillir.io/privacy-policy"
    support: "support@pillir.ai"
    homepage: "https://flow.pillir.ai"
---

# Pillir Flow Power

Flow is the AI execution engine. It turns AI intent into real work — executed directly against SAP, Oracle, JD Edwards, and your enterprise systems. No APIs. No rewrites. No middleware.

This Power gives the NeuralBridge agent native knowledge of Flow's execution model: how to discover functions in connected ERPs, how to inspect their schemas, how to execute them with the user's parameters.


> **CRITICAL — READ BEFORE DOING ANYTHING ELSE:**
> You MUST complete the API key check below BEFORE calling any Flow MCP tools, making test calls, or proceeding to any other onboarding step. Do NOT skip this. Do NOT make "lightweight" or "discovery" calls to test connectivity. Ask the user first.

## Onboarding

### Step 1: Verify Flow API key (MANDATORY — DO NOT SKIP)

**Stop. Do not call any MCP tools yet.** First, ask the user:

> "Have you set up your Pillir Flow API key? This power requires a valid `PILLIR_API_KEY` to connect to the Flow MCP server."

Then wait for the user to respond. Do not proceed until they confirm.

**If the user says no, hasn't set it up, or is unsure**, walk them through setup:

1. Go to `https://flow.pillir.ai` and log in
2. Navigate to workspace settings and generate an API key
3. Set it up using one of these options:
   - **Option A (recommended):** Set the environment variable `PILLIR_API_KEY` in your shell profile, then restart NeuralBridge
   - **Option B:** Open `~/.neuralbridge/settings/mcp.json`, find the `X-FLOW-API-KEY` header under the Flow server entry, and replace `${PILLIR_API_KEY}` with the actual key value
4. After setup, restart NeuralBridge or reconnect the MCP server

**Do NOT proceed to Step 2 until the user explicitly confirms the key is configured.** Acceptable confirmations: "done", "set", "configured", or the user shares a masked key. A different question or silence is NOT confirmation — ask again.

**After the user confirms**, make one test call to verify. If it returns 401 or 403, the key is wrong — go back to setup. If it returns a different error, the key may be fine but the server config needs debugging.

### Step 2: Install the recommended hook

Add this hook to `.neuralbridge/hooks/review-flow-spec.neuralbridge.hook`:

​```json
{
  "enabled": true,
  "name": "Review Flow Spec",
  "description": "Validate the generated Flow spec against enterprise best practices before deployment",
  "version": "1",
  "when": { "type": "userTriggered" },
  "then": {
    "type": "askAgent",
    "prompt": "Review the current Flow spec for missing requirements, unmapped integrations, and deployment readiness. Flag any gaps before publishing."
  }
}
​```

### Step 3: Confirm capabilities

List the Flow MCP tools available in this session and summarize what the user can do from NeuralBridge — generate specs, register integrations, trigger deployments, etc. This gives them a concrete starting point.

## Best practices

- **Start with the business outcome, not the technical call.** Ask the user what business transaction needs to happen and which enterprise system holds the data. Let Flow's discovery tools find the right function rather than guessing function names.

- **Prefer native connectors over custom APIs.** When the user needs data from or action in SAP, Oracle, or JD Edwards, use Flow's built-in adapters — no ABAP, no OData, no middleware.

- **Follow the search-then-execute pattern.** For every ERP integration, the agent's workflow is: (1) discover the right function, (2) inspect its schema, (3) confirm the selection and parameters with the user, (4) execute. Don't skip discovery — guessing function names or parameter shapes wastes Work Units and risks bad data.

- **Generate specifications using Flow.** Flow finds the right function from the ERP (both custom and standard) and makes recommendations.
  Example: `search_sap` returns the function schema, including import, export, and table parameters, and identifies which parameters are mandatory.

- **Execute functions using Flow.** Once a function is identified and selected, Flow runs it directly against the enterprise system and returns the response.
  Example: `execute_function` runs the selected function with the supplied mandatory and optional parameters and returns the SAP response.

## Steering map

Route to the right guidance based on what the user is doing:

- Discovering or executing ERP functions → `steering/flow-discover-and-execute.md`
- Connecting to a specific enterprise system (SAP, Oracle, JDE) → `steering/flow-integrations.md`

## License and support

**This Power**
- License: MIT
- Source: [github.com/pillir/power-pillir-flow](https://github.com/pillir/power-pillir-flow)
- Issues and PRs: [github.com/pillir/power-pillir-flow/issues](https://github.com/pillir/power-pillir-flow/issues)

**Pillir Flow MCP server**
- License: Commercial — governed by [Pillir Terms of Service](https://pillir.ai)
- Privacy Policy: [pillir.ai/privacy](https://www.pillir.io/privacy-policy)
- Homepage: [flow.pillir.ai](https://flow.pillir.ai)
- Support: [support@pillir.ai](mailto:support@pillir.ai) or [Pillir support portal](https://support.pillir.io)