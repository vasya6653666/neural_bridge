---
name: "power-format-reference"
description: "Exact rules of the power format NeuralBridge IDE loads: folder layout, plugin.json fields, SKILL.md front matter, mcp.json servers, the ${PLUGIN_ROOT} and ${PLUGIN_DATA} placeholders and the ru.neuralbridge folder. Use when writing or checking any file of a power."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Power format reference

NeuralBridge IDE loads powers in the open **Agent Plugins** format (version 1.x). A folder is an Agent Plugins power when it
has a `plugin.json` at its root. Write every new power in this format. The older `POWER.md` format is covered briefly at the
end, for converting existing powers.

## Layout

```
my-power/
├── plugin.json                 required: the manifest
├── skills/                     optional: one folder per skill
│   └── <skill-name>/
│       ├── SKILL.md            required in each skill folder
│       └── references/…        optional: files the skill points to
├── mcp.json                    optional: MCP servers the power starts
└── ru.neuralbridge/            optional: files only NeuralBridge IDE reads
    ├── INSTRUCTIONS.md         shown to the agent when the power is activated
    └── steering/*.md           guides the agent reads on demand
```

Keep the power to text files (Markdown, JSON, scripts). The cloud config carries file content as UTF-8 text, so images and
other binary files do not survive it.

## plugin.json

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "my-power",
  "displayName": "My Power",
  "version": "1.0.0",
  "description": "One sentence: what the power lets the agent do.",
  "author": { "name": "Your Name", "email": "you@example.com", "url": "https://example.com" },
  "homepage": "https://example.com",
  "repository": "https://github.com/you/my-power",
  "license": "MIT",
  "keywords": ["word the user would type", "another one"]
}
```

| Field | Rule |
|---|---|
| `$schema` | **Required.** Exactly `https://agent-plugins.org/schemas/1.<minor>.<patch>/plugin.schema.json`. Missing or different — the power is rejected. |
| `name` | **Required.** 1–64 characters: lowercase letters, digits, `.` and `-`; starts and ends with a letter or digit; no `--`, no `..`. |
| `displayName` | Name shown in the Powers view. Without it, `name` is shown. |
| `version`, `description`, `homepage`, `repository`, `license` | Strings. `description` is what the user sees in the list. |
| `author` | An object with only `name`, `email`, `url`. Any other key — the whole author is ignored. |
| `keywords` | Array of strings: the words a user would type when looking for this power. |
| `extensions` | An object for client-specific data. |

Any other top-level field is ignored and reported as an issue. The file must be a JSON object.

## SKILL.md

Each folder under `skills/` with a `SKILL.md` is one skill. The file starts with YAML front matter:

```markdown
---
name: "my-skill"
description: "What the skill does and when to use it."
---

# My skill
…
```

| Field | Rule |
|---|---|
| `name` | **Required.** 1–64 characters: lowercase letters, digits and `-`; starts and ends with a letter or digit; no `--`. Use the folder name: a different name still loads but is reported. |
| `description` | **Required.** 1–1024 characters. The agent decides whether to open the skill from this line alone, so say *what* and *when*. |

Folder names that are not valid skill names are skipped. Two skills declaring the same `name` — the second is skipped. A
skill whose path leads outside the power folder is skipped.

## mcp.json

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "local-tool": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "some-mcp-server@1.2.3", "--data", "${PLUGIN_DATA}"],
      "env": { "LOG_LEVEL": "error" }
    },
    "remote-service": {
      "type": "streamable-http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "X-Client": "neuralbridge" }
    }
  }
}
```

- `$schema` is required and must name the **same version** as `plugin.json`; otherwise no server from the file is loaded.
- Only `$schema` and `mcpServers` are allowed at the top. Any other field disables every server in the file.
- A server entry that breaks a rule below is skipped; the rest still load.

**`stdio`** — fields `type`, `command`, `args`, `env`, `cwd` only.

- `command` is a program name found on `PATH` (`npx`, `uvx`, `node`) or a path starting with `./` inside the power folder.
  Other paths are rejected.
- `args` — array of strings; `env` — object with string values. `env` must not set `PLUGIN_ROOT` or `PLUGIN_DATA`.
- `cwd` starts with `./`, `${PLUGIN_ROOT}` or `${PLUGIN_DATA}` and contains no `..`. Without `cwd`, the server runs in the
  power folder.

**`streamable-http`** and **`sse`** (older transport) — fields `type`, `url`, `headers` only. `url` is `http://` or
`https://` without a user name or password; header names must not repeat (case-insensitive), values are strings.

**Placeholders** in `args`, `env` values and `cwd`:

| Placeholder | Becomes |
|---|---|
| `${PLUGIN_ROOT}` | the installed power folder, `~/.neuralbridge/powers/installed/<name>` |
| `${PLUGIN_DATA}` | a writable folder for the power's data, `~/.neuralbridge/powers/data/<name>` |

Both are also passed to `stdio` servers as environment variables. In the MCP Servers view a power's server is named
`power-<power name>-<server name>`.

**Never put secrets in `mcp.json`.** Use placeholders the user replaces (`<your-api-key>`), or let the server read a variable
from the user's environment.

## The ru.neuralbridge folder

Files only NeuralBridge IDE reads:

- `INSTRUCTIONS.md` — what the agent sees when it activates the power: when to use it, which skills and guides it has.
- `steering/*.md` — guides the agent opens on demand through the `neuralbridge_powers` tool. Only `.md` files directly in
  `steering/` count.

## Where powers live

- Installed powers: `~/.neuralbridge/powers/installed/<name>/`.
- Hook files inside a power are examples only: the IDE does not load hooks from a power folder. Tell the user to copy them
  into `.neuralbridge/hooks/` of their project.

## Converting an older POWER.md power

Some existing powers use an older layout: `POWER.md` at the root (YAML header with `name`, `displayName`, `description`,
`keywords`, `author`, then documentation), a `steering/` folder and an `mcp.json` without `$schema`. NeuralBridge IDE still
reads them, but new work goes into Agent Plugins:

1. **Header → `plugin.json`.** Copy `name` (fix it to the name rule), `displayName`, `description`, `keywords`;
   `author: "Name"` becomes `"author": { "name": "Name" }`. Add `$schema` and `version`.
2. **Body and `steering/` → skills.** Each task-shaped part becomes `skills/<skill-name>/SKILL.md` with a `description`
   saying what and when. The overview goes to `ru.neuralbridge/INSTRUCTIONS.md`; guides the agent needs on demand go to
   `ru.neuralbridge/steering/`. Fix links between files.
3. **`mcp.json`.** Add `$schema` with the same version as `plugin.json`, give every server a `type` (`stdio` for a
   `command`, `streamable-http` or `sse` for a `url`), remove fields the format does not allow (`disabled`, `autoApprove`
   and the like), keep only `$schema` and `mcpServers` at the top.
4. **Remove** `POWER.md` and the root `steering/` folder once nothing from them is lost, then check the result against the
   rules above.

