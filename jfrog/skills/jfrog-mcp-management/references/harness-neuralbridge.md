# Harness: NeuralBridge

NeuralBridge-specific config for the `jfrog-mcp-management` skill (NeuralBridge IDE and
`neuralbridge-cli`).
Read this together with [harness-common.md](harness-common.md)
(shared entry shape and success criterion). You reached this file because
Step A matched **NeuralBridge**: your system prompt / system instructions identify
you as NeuralBridge (NeuralBridge IDE or `neuralbridge-cli`). The environment script does not
detect NeuralBridge (IDE terminals report `TERM_PROGRAM=vscode`), so rely on your own identity,
not on the script's VS Code result. Config, key, and env syntax are identical on both surfaces.

## Config files

- **NeuralBridge IDE only — enable MCP support** before writing `mcp.json`: the setting
  `neuralbridge.configureMCP` must not be `Disabled` (the **Enable MCP** button
  above an open `mcp.json` sets it to `Enabled`). `neuralbridge-cli` does not need this setting.
- **Default scope: project.** `.neuralbridge/settings/mcp.json` in the workspace root
  — shareable via git. Create if missing: `{ "mcpServers": {} }`.
- **User (global):** `~/.neuralbridge/settings/mcp.json` (or
  `$NEURALBRIDGE_HOME/settings/mcp.json` if `NEURALBRIDGE_HOME` is set). Use ONLY if the
  user says "personal only" / "do not commit". Not always present — create if missing:
  `{ "mcpServers": {} }`.
  NeuralBridge merges both automatically, workspace taking precedence on
  conflicts.
- Do not ask which scope unless the user brings it up.

## Top-level key

`mcpServers`

## Value reference (env / secrets)

`${VAR_NAME}`, resolved first from the server entry's own `env` block, then from
the environment NeuralBridge was launched with. For `Bearer` headers:
`"Bearer ${TOKEN}"`. The user must export the variable in the launching shell
(see [persisting-env-vars.md](persisting-env-vars.md)); values are picked up on
next launch. Never write a raw secret — always `${VAR}`. An unresolved
`${VAR_NAME}` is left as-is, so the server starts with the literal placeholder —
if a server fails that way, tell the user to export the variable and relaunch.

## Enable

Every entry not marked `"disabled": true` runs automatically — writing the
entry is enough, there is no separate approval step. To disable without
deleting, set `"disabled": true` on that server's entry (or use **Disable** on
the server in the **MCP Servers** view).

## Restart

Editing `mcp.json` needs no restart — NeuralBridge watches both files and
reconnects affected servers on save. But a **newly exported env var** needs
NeuralBridge relaunched: it only reads the shell environment at launch, so a var
exported after NeuralBridge is already running won't resolve until you relaunch.

## List installed

- **`neuralbridge-cli`:** `neuralbridge-cli mcp list workspace` / `neuralbridge-cli mcp list global` for
  live status per scope (`neuralbridge-cli mcp list` alone lists the merged view).
  `neuralbridge-cli mcp status --name <name>` for one server.
- **NeuralBridge IDE:** tell the user to open the **MCP Servers** view in the NeuralBridge panel for
  live server + tool status — it lists each server with its state and tools.
- For JFrog metadata on either surface, read `mcpServers` directly from
  `.neuralbridge/settings/mcp.json` (project) and `~/.neuralbridge/settings/mcp.json`
  (user, or `$NEURALBRIDGE_HOME/settings/mcp.json` if `NEURALBRIDGE_HOME` is set).

## Verify

If you can already see or call at least one upstream tool from this
server, skip this check. Otherwise:

- **`neuralbridge-cli`:** `neuralbridge-cli mcp status --name <name>` for connection status,
  then confirm tools via `/mcp` in the same chat session.
- **NeuralBridge IDE:** tell the user to open the **MCP Servers** view and expand the
  server — it lists the server's tools and its connection state.

Success: `/mcp` or the view lists at least one upstream tool for the server. Connected/active
status alone is not success.

Empty tool list: not success, not a diagnosis — follow
[Connected but 0 tools](key-rules-and-troubleshooting.md#connected-but-0-tools).
Do not invent another debug path until that section is finished.
