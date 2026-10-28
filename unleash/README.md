# Unleash · FeatureOps Template for NeuralBridge

A NeuralBridge Power that brings feature flag management into NeuralBridge's spec-driven workflow. It configures the [Unleash MCP server](https://github.com/Unleash/unleash-mcp) and ships a set of steering files and hook templates that encode FeatureOps practices.

The defaults work out of the box, but feature management conventions vary widely across teams and industries. This Power is designed as a **customizable template** — fork it, adapt the steering files to your team's domains and conventions, and roll it out.


## What's inside

| File | Purpose |
|---|---|
| `POWER.md` | Entry point — NeuralBridge reads this on activation. Frontmatter, onboarding, steering map, tool reference, metadata footer. |
| `mcp.json` | Default MCP server config — local stdio transport via `npx`. |
| `examples/mcp.remote.json` | Alternative MCP config — remote HTTP transport for Unleash-hosted MCP. Swap into `mcp.json` if your org disallows local servers. |
| `examples/README.md` | When and how to swap to the remote transport. |
| `steering/feature-flag-conventions.md` | Universal naming, types, and lifecycle rules. |
| `steering/rollout-guidance.md` | Default rollout milestones, hold durations, halt conditions. |
| `steering/cleanup-cadence.md` | Thresholds and workflow for removing stale flags. |
| `steering/high-risk-domains.md` | Worked example (payments) + template for adding your own domains. |
| `hooks/evaluate-high-risk-save.neuralbridge.hook` | File-save hook that evaluates risky changes. Ships disabled. |
| `hooks/flag-audit.neuralbridge.hook` | Manual-trigger flag audit. Ships disabled. |
| `hooks/README.md` | Install, customize, and credit-cost guidance for the hooks. |
| `LICENSE` | Apache-2.0. |

## Install

### Prerequisites

- **NeuralBridge** (IDE or CLI), with MCP enabled in settings.
- An **Unleash instance** (Cloud or self-hosted) with API access.
- A **Personal Access Token** with permissions to create and manage flags.
- For local transport: **Node.js 18+** on developer machines.
- For remote transport: the Unleash instance admin must enable **Admin settings → Remote MCP server**, and your identity provider must allow OAuth 2.0 Dynamic Client Registration.

### From the Powers panel

Install the power from the **Powers** panel in NeuralBridge IDE.

### Environment variables

Both transports use `${VAR}` expansion. Set:

```bash
export UNLEASH_BASE_URL=https://your-instance.getunleash.io/api
export UNLEASH_PAT=your-personal-access-token
export UNLEASH_DEFAULT_PROJECT=default
```

NeuralBridge requires explicit per-variable approval — click **Allow** on the popup when prompted.

## Customize for your team

This Power ships as a template. Edit these files to match your team's conventions:

1. **`steering/high-risk-domains.md`** — the file you'll edit most. Replace the payments example with your team's actual high-risk areas.
2. **`steering/feature-flag-conventions.md`** — naming convention, flag types in scope, what counts as "high-risk".
3. **`steering/rollout-guidance.md`** — default milestones, hold durations, halt thresholds.
4. **`steering/cleanup-cadence.md`** — stale-flag thresholds.
5. **`hooks/evaluate-high-risk-save.neuralbridge.hook`** — `filePattern` should match your high-risk directories.
6. **`POWER.md` frontmatter** — add domain-specific keywords so the Power activates for your team's vocabulary.

Every customizable spot in the markdown files is marked with an HTML comment: `<!-- CUSTOMIZE: ... -->`. Run `grep -r CUSTOMIZE .` from the repository root to find them all.

## Compatibility

- **NeuralBridge IDE** — primary target. Tested with workspace-scoped MCP configuration.
- **NeuralBridge CLI** — shares the same `.neuralbridge/settings/mcp.json` and steering files as the IDE.
- **Local stdio transport** — works against any Unleash Cloud or self-hosted instance with API access.
- **Remote HTTP transport** — requires the Unleash instance admin to enable remote MCP and your IDP to permit OAuth 2.0 DCR.

## License and policies

- **License:** [Apache-2.0](./LICENSE)
- **Privacy Policy:** https://www.getunleash.io/privacy-policy
- **Support:** support@getunleash.io
- **Maintainer:** Unleash (Bricks Software AS)

### MCP server attribution

This Power configures the [Unleash MCP server](https://github.com/Unleash/unleash-mcp) ([`@unleash/mcp`](https://www.npmjs.com/package/@unleash/mcp) on npm), Apache-2.0 licensed and maintained by Unleash.

## Related

- [Unleash MCP server](https://github.com/Unleash/unleash-mcp) — the underlying server this Power wraps.
- NeuralBridge Powers documentation — how Powers work in NeuralBridge.
- NeuralBridge community powers repository — other community-built powers.
- [FeatureOps](https://featureops.io) — the broader practice this Power supports.
