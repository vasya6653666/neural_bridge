---
name: "create-power"
description: "Build a new power for NeuralBridge IDE from scratch in the Agent Plugins format: decide what it teaches, write plugin.json and skills, add MCP servers if needed, then install and test it. Use when the user wants to create their own power."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Create a power

A power packages what an agent needs to do one job well: instructions (skills, guides) and, if the job needs live access to
a service, MCP servers. The exact file rules are in the `power-format-reference` skill; read it before writing files.

## 1. Agree on the purpose

Ask the user, briefly:

1. What should the agent be able to do with this power? One or two sentences.
2. Does it need to talk to a service or a local program (then it needs an MCP server), or is it knowledge only?
3. If there is a server: the package or URL, how it signs in (API key, OAuth, none), which settings the user must supply.
4. The name. Suggest one that follows the `name` rule (lowercase, digits, `-`).

Do not start writing until the purpose and the server question are clear.

## 2. Plan the skills

Split the knowledge into skills by task, not by topic: a skill is something the agent opens because the user asked for that
task. Typical split:

- one skill per main workflow (set up, deploy, debug…);
- a reference skill for facts the workflows share, if they would otherwise repeat them.

Each skill's `description` must say what it does **and when to use it**. The agent sees only the descriptions until it opens
a skill. Keep each `SKILL.md` focused; move long tables, examples and error catalogs to files in the skill's
`references/` folder and point to them by relative path.

## 3. Write the files

1. Create the folder `<name>/` with `plugin.json` (required fields `$schema` and `name`; add `displayName`, `description`,
   `version`, `author`, `keywords`, `license`).
2. For each skill: `skills/<skill-name>/SKILL.md` with `name` equal to the folder name and a `description`.
3. If the power needs a server: `mcp.json` with the same schema version as `plugin.json`. Pin package versions
   (`some-server@1.2.3`), keep secrets out of the file, use `${PLUGIN_DATA}` for anything the server writes.
4. Optional: `ru.neuralbridge/INSTRUCTIONS.md` — a short overview the agent reads on activation (what the power is for, which
   skills to open first, what the user must set up), and `ru.neuralbridge/steering/*.md` for longer guides.

A skill body that works well:

```markdown
# <Task>

## Before you start
- What must be installed or configured; how to check it.

## Steps
1. …
2. …

## If something goes wrong
- "<error text>": cause and fix.
```

## 4. Check before installing

- `plugin.json` and `mcp.json` are valid JSON objects, `$schema` values are exact, versions match.
- Every skill folder has a `SKILL.md` whose `name` matches the folder.
- No unknown top-level fields in `mcp.json`; every `stdio` command is a program name or `./…` inside the folder.
- No secrets, no absolute paths from your machine, no binary files.

## 5. Install and test

- In the IDE: the **Powers** view → **Add Custom Power** → choose the power folder.
- Or in the web account: page «Powers и MCP» → «Загрузить папку»; the power then reaches the IDE through the cloud config.
- Test: start a new chat, ask for the task the power is meant for and check that the agent opens the right skill. If there
  is a server, open the **MCP Servers** view and check that `power-<name>-<server>` connects; use **Show MCP Logs** when it
  does not.

## 6. Share it

To propose the power for the NeuralBridge catalog, put it in a **public GitHub repository** and send the link through
https://neuralbridge.ru/powers/suggest. The power must be in the Agent Plugins format; an older `POWER.md` power has to be
converted first (see the last section of `power-format-reference`).
