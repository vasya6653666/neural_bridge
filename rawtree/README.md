# RawTree Agent Skills

A skill and hosted MCP server for working with [RawTree](https://rawtree.com), following the [Agent Skills](https://agentskills.io) format. Available as a plugin for Cursor, Claude Code, Codex, Devin, and any [Agent Plugins](https://agent-plugins.org) client, and as a NeuralBridge Power. Includes RawTree's hosted MCP server for tool access.

## Install

```bash
npx skills add rawtreedb/agent-skills
```

This installs only the `rawtree` skill. To also get the RawTree MCP server, install the plugin for your agent below.

### Cursor

Cursor reads `.cursor-plugin/plugin.json`. Once RawTree is available in the [Cursor Marketplace](https://cursor.com/marketplace), open **Customize**, search for **RawTree**, and select **Install**, or run `/add-plugin rawtree` in chat. Until then, on a Teams or Enterprise plan add this repository from **Dashboard → Plugins & MCPs → Team Marketplaces → Add Marketplace → Import from Repo** (`https://github.com/rawtreedb/agent-skills`). To try it locally, clone the repository into `~/.cursor/plugins/local/rawtree` and run **Developer: Reload Window**.

### Claude Code

```bash
claude plugin marketplace add rawtreedb/agent-skills
claude plugin install rawtree@rawtree
```

Inside a session you can run `/plugin marketplace add rawtreedb/agent-skills` and `/plugin install rawtree@rawtree`. Then run `/mcp`, select `rawtree`, and complete the RawTree sign-in.

### Codex

```bash
codex plugin marketplace add rawtreedb/agent-skills
codex plugin add rawtree@rawtree
```

In the Codex app, you can also use **Add marketplace** with this repository's GitHub URL, then select RawTree from the added source. Authenticate the bundled MCP connection when prompted and start a new task to use the plugin.

### Devin

In Devin Cloud, open **Customize → Plugins → Personal → Add plugin → From repository** and enter `https://github.com/rawtreedb/agent-skills`. Once indexing finishes, select **Connect MCP** and complete RawTree's OAuth authorization. Start a new session to use the plugin.

For Devin CLI, when plugins are enabled by your organization:

```bash
devin plugins install rawtreedb/agent-skills
devin mcp login rawtree
```

Devin loads the existing Claude plugin manifest, the bundled MCP configuration, and the shared RawTree skill. Invoke the skill with `/rawtree:rawtree`. See [Devin's plugin documentation](https://docs.devin.ai/cli/extensibility/plugins/overview).

### Grok Bot and Grok Build

Grok Bot lists RawTree on [grokbot.dev/plugins/rawtree](https://grokbot.dev/plugins/rawtree/): add a custom MCP connector pointing at `https://mcp.rawtree.com/mcp` and sign in with RawTree. That page is a community listing and does not install this repository's plugin.

Grok Build reads the `.claude-plugin/` catalog in this repository:

```bash
grok plugin marketplace add rawtreedb/agent-skills
grok plugin install rawtree --trust
```

### NeuralBridge

Install the power from the **Powers** panel in NeuralBridge IDE.

### Other agents

Any [Agent Plugins](https://agent-plugins.org) client can load the root `plugin.json` and `mcp.json`. Other agents can use `skills/rawtree/SKILL.md` directly.

After installing, connect the MCP server. RawTree uses OAuth, so your client walks you through sign-in on first connect and no API key or header configuration is needed. You need a RawTree account.

## Repository Structure

```text
plugin.json                  # Agent Plugins manifest (Codex, NeuralBridge, Agent Plugins clients)
mcp.json                     # Agent Plugins MCP config (streamable-http)
.agents/plugins/
  marketplace.json           # Codex marketplace catalog
.claude-plugin/
  plugin.json                # Claude Code manifest
  marketplace.json           # Claude Code marketplace catalog
.mcp.json                    # Claude Code MCP config (type: http)
.cursor-plugin/
  plugin.json                # Cursor manifest
  marketplace.json           # Cursor marketplace catalog
  mcp.json                   # Cursor MCP config (type: http, placement: server)
POWER.md
skills/
  rawtree/
    SKILL.md
    agents/
      openai.yaml
    references/
      api.md
      cli.md
      dynamic-fields.md
      mcp.md
      performance.md
      query.md
```

## Available Skills

- `rawtree` — RawTree guidance for database, ingestion, querying, dynamic-column, and observability workflows.

## Examples

The `rawtree` skill activates automatically when a task involves RawTree. In
NeuralBridge, you can also invoke it directly with `/rawtree` when it is installed as
a standalone skill. Other compatible agents can discover it from
`skills/rawtree/SKILL.md`.

### Ask an agent

Try prompts such as:

- “Using RawTree, plan a workflow for evolving event data.”
- “Design a RawTree ingestion workflow for logs, traces, and metrics.”
- “Review this RawTree SQL query for bounded, read-only analysis.”
- “Explain how RawTree Dynamic fields handle nested and mixed-type JSON.”
- “Using RawTree MCP tools, describe this table and write a bounded query.”

When the RawTree MCP server is connected, the agent can use the appropriate
tools for table discovery, ingestion, querying, and logs while following the
skill's guidance.

## Plugins

This repository follows the [Agent Plugins](https://agent-plugins.org) open standard: `plugin.json` and `mcp.json` at the root, skills in `skills/`. It is also a plugin for these platforms through their own manifests, all sharing the single `skills/rawtree` directory:

- **Cursor**: `.cursor-plugin/`
- **Claude Code**: `.claude-plugin/` and `.mcp.json`
- **Codex**: root `plugin.json` and `mcp.json`, catalog at `.agents/plugins/marketplace.json`
- **Devin**: reuses `.claude-plugin/plugin.json`, `.mcp.json`, and `skills/`

The catalogs point at the plugin at the repository root. No separate copy of the plugin is needed.

Each platform gets its own MCP file because the formats differ: the root `mcp.json` must stay valid against the Agent Plugins schema (`type: streamable-http`, no extra fields), Claude Code reads `.mcp.json` (`type: http`), and Cursor's `.cursor-plugin/plugin.json` points at `.cursor-plugin/mcp.json`, which adds `"placement": "server"`. All three point at `https://mcp.rawtree.com/mcp`. Keep the versions in `plugin.json`, `.claude-plugin/plugin.json`, and `.cursor-plugin/plugin.json` in sync.

### OpenAI package

The root `plugin.json` is canonical for OpenAI. Its `extensions.com.openai.interface`
provides the listing descriptions, publisher, policy links, icon, capabilities,
and starter prompts. Portable clients discover the bundled `skills/` and
`mcp.json` at the root. The MCP configuration uses RawTree's hosted endpoint, so
the package needs no local server or bundled credentials.

For public publication, submit the plugin through OpenAI's **With MCP** flow
using `https://mcp.rawtree.com/mcp`, upload the `skills/rawtree` skill, and
complete the required listing, authentication, tool scan, and review tests.

Packaging follows [OpenAI's plugin documentation](https://developers.openai.com/plugins/build/plugins).

## NeuralBridge Power

The root `plugin.json` follows Agent Plugins 1.0 and makes this repository
installable as a NeuralBridge Power. The existing `skills/rawtree/SKILL.md` remains the
single source of truth for RawTree guidance; it is not duplicated into a
second Power repository.

The root `POWER.md` provides NeuralBridge's legacy presentation metadata, including
the human-readable display name **RawTree**, description, keywords, and author.
It is retained for compatibility with local Power installation while
`plugin.json` remains the portable package manifest.

The root `mcp.json` uses the Agent Plugins 1.0 MCP schema and connects the
Power to RawTree's hosted Streamable HTTP MCP server at
`https://mcp.rawtree.com/mcp`. NeuralBridge manages the MCP connection and
authentication. No API keys or authorization headers are stored in this
repository.

The repository also includes RawTree's branded Power icon. NeuralBridge's
custom GitHub and local Power imports currently use a generic placeholder icon;
the icon is available for registry curation or a local NeuralBridge registry entry.

For local MCP development, continue to use the setup in the
[`rawtree-mcp` repository](https://github.com/rawtreedb/rawtree-mcp), which
supports both stdio and a local HTTP server.

## Network and Install Disclosure

The plugin itself runs no code. It bundles a skill (Markdown) and an MCP configuration that connects to `https://mcp.rawtree.com/mcp` using OAuth with RawTree. The skill's CLI reference (`skills/rawtree/references/cli.md`) documents an optional install command for the RawTree CLI, `curl -fsSL https://rawtree.com/install.sh | bash`, which downloads and runs the installer script published by RawTree at `rawtree.com`. The skill tells agents to run it only when `rtree` is unavailable and installation is within the user's scope. The plugin never runs it automatically.

## Support

For support with the RawTree plugins, Power, or MCP integration, contact
[contact@rawtree.com](mailto:contact@rawtree.com).

See the [Tinybird Privacy Policy](https://www.tinybird.co/privacy) for
information about privacy and data handling.
