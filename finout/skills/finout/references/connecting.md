# Connecting and authentication

The server is `https://mcp.finout.io/mcp`. Auth is per-user OAuth — no API key, nothing to
configure. Tools are scoped to the account of whoever signs in.

## First sign-in requires a deliberate reconnect

If the first connection fails with `Failed to connect: Unauthorized` and no sign-in prompt,
ask the user to choose **Authenticate** on `power-finout-finout` in the **MCP Servers** view of
NeuralBridge IDE (in NeuralBridge CLI: `/mcp auth`). A browser tab opens on the Finout authorize page; the user signs in with their
normal Finout login.

| Symptom | Fix |
|---|---|
| `Unauthorized` on first use, no browser opened | **Authenticate** in the **MCP Servers** view, or `/mcp auth` in the CLI |
| Token expired or rejected | **Authenticate**, or `/mcp auth` |
| Flow stuck waiting on the browser | **Reconnect**, then **Authenticate**; in the CLI `/mcp cancel-auth`, then `/mcp auth` |
| Wrong account signed in | Sign out of Finout in the browser, then **Authenticate**; in the CLI `/mcp logout`, then `/mcp auth` |

## Verify

Call `list_available_filters` with no arguments — cheap, needs no prior discovery, and a
successful response lists the account's cost centers, confirming both auth and data access.

If filters come back but cost queries are empty, auth is fine and the query is wrong. See
`cost-analysis.md`.

## Self-hosted accounts

A dedicated Finout deployment uses a different MCP host. Replace the `url` in `mcp.json`
with that host's `/mcp` endpoint; the OAuth flow is identical.

## Headless and CI

This power needs a browser. Unattended jobs use the `client_credentials` grant with an
M2M client that an account admin provisions against a specific tenant and roles — a
separate credential this power does not configure.
