# Figr MCP - agent guide

Figr is an AI design canvas. The **Figr MCP** exposes a project, design system, or context pod as a virtual filesystem.

**Endpoint:** the HTTP URL the client configured (production default: `https://mcp.figr.design/mcp`).

With `figr:write` you can create entities and edit files. Without it, mutating tools return `insufficient_scope` — re-auth. This guide is the source of truth for Claude Code, Cursor, VS Code, Codex, and other MCP clients.

Two workflows:

1. **Write in Figr** — create/set → write/edit/shell → `figr build` / `figr publish` → `finish_turn`.
2. **Port to a local repo** — read via MCP, implement in the user's codebase.

---

## What you get

| Capability | Tool(s) | Notes |
|---|---|---|
| Bind a project | `set_project` | Figr project URL. Optional `?boardNode=`. |
| Create a project | `create_project` | Empty-ready. Optional `designSystemId` / `spaceId`. |
| Bind a design system | `set_design_system` | Session becomes the DS tree (author at `/`). |
| Create a design system | `create_design_system` | Empty git + `/SKILL.md`. Then write the package. |
| Create a context pod | `create_context_pod` | Empty-ready. Attach with `create_project({ spaceId })`. |
| Explore | `ls`, `tree`, `stat` | Start at `/`. Org skills: `ls /skills/` (not listed at project root). |
| Read | `read` | Deep-agent source: raw paginated `content` + `downloadUrl` (curl -L for as-is). |
| Search | `grep` | JS RegExp. Prefer scoping `path`. |
| Design + chat context | `get_design_context` | Code **plus** the conversation. Prefer when reimplementing a screen. |
| Write | `write_file`, `edit_file`, `batch_edit_file`, `cp` | VFS paths from `ls`. No `rm` / `mv` / `sed -i`. |
| Shell | `shell` | `figr init` / `figr build` / `figr publish`. No `rm`/`mv`/`sed -i`. |
| Canvas preview | `shell` → `figr build <app>` | Stamps the node preview. Not optional. |
| Durable share URL | `publish_artifact` | Canvas Publish button. After a successful build. |
| Chat turn | `finish_turn` | Last call after edits. User bubble + reply on the canvas. |
| Org skill | `create_skill` | New `/skills/{slug}/SKILL.md`. Updates: `write_file` / `edit_file`. |
| Connectivity | `ping` | Smoke check. |

---

## Write in Figr

1. `create_project` or `set_project` (include `?boardNode=` when they named a node). Or `create_design_system` / `set_design_system` to author a DS.
2. `tree` / `ls /`.
3. Write with `write_file` / `edit_file`. Prototype paths are `/<app>/…` (never `/deepagent/…`).
4. **Prototype:** `figr init <app>` if needed, then **`figr build <app>`** after the write batch. That is what shows the canvas preview. `publish_artifact` is a separate durable link.
5. **Design system:** write `/index.css` (and the rest) on a DS session, then **`figr publish`** as its own shell command (not chained).
6. `finish_turn({ query, response })` so Figr chat shows the turn.

Do not skip `figr build` and then call `publish_artifact` hoping the canvas will update. Preview and share URL are different.

### Prototype contract

- `src/` is yours. Never edit `figr-template.json`, `build.mjs`, or `tsconfig.json`.
- Maintain `src/screens.figr.json`. `screens` is an object keyed by screen id, never an array. Concrete paths only (`/users/42`), never `:id`. Don't write `position`. Leave `edges: []`.
- No `fetch` / `axios` / HTTP — mock in component state. No `localStorage` / `sessionStorage`.
- Declare packages in `package.json` `dependencies` before importing them. When consuming a DS, declare the **published** package name from `figr publish` (usually `figr-ds-<id>`), not `"design-system"`.
- Each `/<app>/src/` is its own bundler — no cross-app imports. Share with `cp`.

### Design system

**Author** (session is the DS): `create_design_system` / `set_design_system`. Read `/SKILL.md` first. Write `/index.css` (`@theme` + `@utility`), `/design.md`, `/package.json` (`name` stays `design-system`), optional `/src/components/`. Then `figr publish`.

**Consume** (session is a project): read the attached DS, import the published package, don't copy DS files into the app. A `@theme` token is already a utility — `bg-bg-muted`, never `bg-[var(--color-bg-muted)]`.

**Do not write `/design-system/…` from a project session.** That creates a prototype folder named `design-system`, not DS git. Switch with `set_design_system` first.

### Skills

`ls /skills/` then `create_skill` (new) or `write_file` `/skills/{slug}/SKILL.md` (update). Frontmatter `name` must equal the folder slug; `mode` is `always` or `relevant`.

### Wireframes

`write_file` `/wireframes/<slug>.html` — fragment only (`data-wireframe`, `data-width`, `data-title`, `data-bg`). Hex/rgb, no `var(--*)`, inline styles only.

---

## Port to a local repo

1. `set_project` with the Figr URL.
2. `tree` / `ls /`. If `selectedBoardNode` is set, start from its `folderPrefix` / `filePath`.
3. Prefer `get_design_context` on screens you will build.
4. `grep` scoped to that folder. `/queries` for rationale.
5. Implement in the **user's codebase** — match tokens/layout/behavior; wire real data.

Deep-agent source `read` returns raw paginated `content` plus `downloadUrl` on live HEAD. When the source must land as-is: `curl -L "$downloadUrl" -o <path>`. Absent for query snapshots, queries, design-system, and synthetics.

---

## Project tree (Deep Agent)

```text
/
├── <prototype-folder>/   # e.g. /login-prototype/
│   └── src/
├── queries/
├── design-system/        # attached DS listing — read, don't write
├── project.json
└── canvas/board.json
```

Older artifact projects use `/artifacts/` instead of prototype folders.

---

## URLs

| Form | Example |
|---|---|
| Production | `https://app.figr.design/{orgId}/{projectId}` |
| Local / short | `http://localhost:5173/projects/{projectId}` |
| Node focus | `...?boardNode={nodeKey}` |
| Design system | `https://app.figr.design/{orgId}/design-system/{designSystemId}` |

`projectId` is a UUID (second path segment on org-scoped URLs).

---

## Anti-patterns

- Writing a prototype and never running `figr build` (canvas stays "Building preview")
- Writing `/design-system/…` from a project session
- Importing `"design-system"` from a prototype (use the published `figr-ds-*` name)
- Storage paths with `/deepagent/` instead of VFS paths from `ls` / `tree`
- `rm`, `mv`, `sed -i` — they don't persist
- Implementing from a screenshot instead of MCP file contents
- Skipping `/design-system` when a project has one attached (read it; don't copy it)

---

## Starter prompts (for humans)

**Write in Figr**

```text
Use the Figr MCP to work in this canvas. Explore, then make the changes in Figr (write + figr build), not in my local repo.
<FIGR_URL>
```

**Port into this repo**

```text
Use the Figr MCP to understand this canvas, focusing on this node in particular.
Explore the project, then help me implement it in this repo.
<FIGR_URL_WITH_BOARD_NODE>
```

**Design system**

```text
Use the Figr MCP to load this design system. Read SKILL.md, then write tokens and publish.
<FIGR_DESIGN_SYSTEM_URL>
```
