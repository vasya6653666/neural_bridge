# Claude Code Plugin Metadata

This directory contains Claude Code-specific plugin configuration.

- `plugin.json` - Claude Code plugin manifest (name, description, and other metadata)
- `marketplace.json` - Marketplace listing for plugin discovery

Shared content (skills, commands) lives at the repo root and is auto-discovered by Claude Code. The portable Box MCP endpoint is declared in the root `mcp.json`; authentication remains managed by Claude Code.

For the plugin specification, see the [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins-reference).