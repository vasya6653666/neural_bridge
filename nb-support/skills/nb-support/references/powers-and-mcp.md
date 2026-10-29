# Powers and MCP servers

## Powers

A power bundles knowledge for the agent (skills and steering) and, when it needs one, MCP server settings.

- The **Powers** view is in the NeuralBridge panel. Its empty state reads «Import from url, folder or build your own», and the
  **Add Custom Power** button adds a power from a folder on disk.
- Installed powers live in `~/.neuralbridge/powers/installed/<power name>/`.
- The catalog is maintained by NeuralBridge. An author can propose a power through the form at
  https://neuralbridge.ru/powers/suggest (other languages: `https://neuralbridge.ru/<language>/powers/suggest`). The power
  must be in a public GitHub repository, in the Agent Plugins format.
- A power can also be installed in the web account: page «Powers и MCP», «Установить из каталога» or «Загрузить папку».
  Such powers arrive in the IDE through the cloud config (see `cloud-config.md`).

To learn how to write a power, the user can install the `nb-power-builder` power.

## MCP servers

- The **MCP Servers** view is in the NeuralBridge panel. Each server has **Reconnect**, **Authenticate** (OAuth sign-in for
  remote servers) and **Show MCP Logs**.
- Command palette: «MCP: Enable All Servers», «MCP: Disable All Servers», «Open User MCP Config (JSON)»,
  «Open Workspace MCP Config (JSON)».
- Config files: `~/.neuralbridge/settings/mcp.json` (user) and `.neuralbridge/settings/mcp.json` (project).
- Logs go to the output channel «NeuralBridge - MCP Logs».
- A server that comes from a power is named `power-<power name>-<server name>`.

## Troubleshooting a server

1. Open **Show MCP Logs** for the server and read the last error.
2. A remote server that lost its sign-in: **Authenticate**.
3. After fixing the config: **Reconnect**.
4. Servers that run a local command (`npx`, `uvx` and the like) need that program installed on the user's machine.
