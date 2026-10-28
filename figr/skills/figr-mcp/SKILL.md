---
name: figr-mcp
description: Use Figr MCP to create or edit Figr canvases, design systems, and skills, or to port UI into the user's repo. Use when the user pastes a Figr URL, asks to build in Figr, or mentions Figr MCP.
---

# Figr MCP

Connect to Figr over MCP. Two workflows: **write in Figr**, or **port into this repo**.

Full contract: [mcp-guide.md](mcp-guide.md)

## Write in Figr

1. `create_project` or `set_project` (`?boardNode=` if they named a node). DS work: `create_design_system` / `set_design_system`.
2. `tree` / `ls /`.
3. `write_file` / `edit_file` / `shell`. Prototype paths are `/<app>/…`, never `/deepagent/…`.
4. `figr build <app>` after a prototype write batch (canvas preview). `figr publish` as its own command after DS writes.
5. `finish_turn({ query, response })` last.

`publish_artifact` is the durable share URL, not the canvas preview.

## Port to this repo

1. `set_project` with the Figr URL.
2. Prefer `get_design_context` on screens you will build.
3. Implement in the user's stack — match tokens/layout/behavior; wire real data.

## Rules

- Mutating tools need `figr:write`. `insufficient_scope` → re-auth.
- VFS paths from `ls` / `tree`. Never `/deepagent/…`.
- Do not write `/design-system/…` from a project session.
- Consume a published DS via `figr-ds-*`, not `"design-system"`.
- Maintain `src/screens.figr.json`. No `fetch` / `axios` / `localStorage`.
- Org skills: `ls /skills/` then `create_skill` or `write_file`.
- Deep-agent source `read` returns raw paginated `content` plus `downloadUrl` on live HEAD. As-is: `curl -L "$downloadUrl" -o <path>`.
