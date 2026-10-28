# Finout Power for NeuralBridge

Connects NeuralBridge to Finout, giving the agent your cloud cost tools plus
guidance for using them well — spend breakdowns, cost anomalies, waste and rightsizing,
budgets and forecasts, unit economics, and tag coverage across AWS, Azure, GCP, Kubernetes,
and SaaS sources.

Built to the [Agent Plugins 1.0.0](https://agent-plugins.org) spec, so it also loads in
other agents that implement the format.

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

Its MCP server is named `power-finout-finout`.

## Sign in

There is no API key to configure. The server uses OAuth.

If the first connection fails with `Failed to connect: Unauthorized`, choose **Authenticate** on
`power-finout-finout` in the **MCP Servers** view (in the CLI: `/mcp auth`) — a browser tab opens for your normal Finout login.

| Symptom | Fix |
|---|---|
| `Unauthorized` on first use, no browser | **Authenticate** in the **MCP Servers** view, or `/mcp auth` in the CLI |
| Token expired or rejected | **Authenticate**, or `/mcp auth` |
| Flow stuck waiting on the browser | **Reconnect**, then **Authenticate**; in the CLI `/mcp cancel-auth`, then `/mcp auth` |
| Wrong account signed in | Sign out of Finout in the browser, then **Authenticate**; in the CLI `/mcp logout`, then `/mcp auth` |

Tools are scoped to the account of whoever signs in.

## Verify

Ask NeuralBridge a cost question — the power activates on keywords:

- "What did we spend on AWS last month, broken down by service?"
- "Why did our cloud bill jump recently?"
- "Where are we wasting money in Kubernetes?"

`list_available_filters` is the cheapest connectivity check: it needs no arguments and
lists your cost centers.

## Layout

```
plugin.json           manifest + activation keywords
mcp.json              remote MCP server (streamable-http, OAuth)
skills/finout/
  SKILL.md            always loaded — routing table and hard constraints
  references/         read on demand
    connecting.md         sign-in and auth troubleshooting
    cost-analysis.md      filter discovery, cost types, honest reporting
    waste-and-anomalies.md  waste funnel, anomalies, budgets
```

`SKILL.md` stays small on purpose — it is loaded on activation, and depth belongs in
`references/`, which the agent opens only when a task needs it.

**Skills are not automatically in context when the tools are used.** Observed behavior: for
a plain cost question the agent calls the MCP tools directly and never activates the skill,
so guidance here is onboarding and reference material — it does not constrain tool calls.
Anything that must always hold belongs in the MCP tool descriptions themselves, which are
always in context.

This power also ships no `POWER.md` and no steering files — those belong to the older
legacy power format. NeuralBridge's install-time walkthrough may try `readSteering` and report a
missing file; that is harmless and the agent proceeds from the skill.

## Self-hosted accounts

A dedicated Finout deployment uses a different MCP host. Change the `url` in `mcp.json` to
that host's `/mcp` endpoint; the OAuth flow is identical.

## Support

If you need help with anything, please reach out to support@finout.io 

## Privacy Disclosure

Finout MCP processes cloud-cost data. Please see the Finout Privacy Policy at: https://www.finout.io/privacy-policy/ 

## License

[Apache-2.0](LICENSE).
