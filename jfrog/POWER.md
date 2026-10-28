---
name: "jfrog"
displayName: "JFrog"
description: "Work with the JFrog Platform to manage Artifactory repositories, artifacts, users, groups, and projects, run security scans, and query package safety. Ships the official JFrog knowledge as steering and drives the platform through the JFrog CLI (jf) and jf api. Preview Notice: This Plugin is in preview and licensed under the Apache License 2.0. For clarity: This software is provided \"as-is\" without warranty of any kind, and without support obligations or service level commitments. Behavior, APIs, conventions, and structure may change without notice between releases. JFrog makes no guarantees of backward compatibility during the preview release cycle. Use in production environments is at your own risk."
keywords: ["jfrog", "artifactory", "artifact", "repository", "xray", "devops", "binary-management", "curation", "skills"]
author: "JFrog"
---

# JFrog Platform

> **Preview Notice:** This Plugin is in preview and licensed under the Apache License 2.0. For clarity: This software is provided "as-is" without warranty of any kind, and without support obligations or service level commitments. Behavior, APIs, conventions, and structure may change without notice between releases. JFrog makes no guarantees of backward compatibility during the preview release cycle. Use in production environments is at your own risk.

The JFrog Platform is the universal binary management and DevSecOps solution used by developers, DevOps
engineers, platform administrators, and security engineers to manage software artifacts across the entire
SDLC.

This power delivers the official **JFrog Agent Skills knowledge as bundled steering files** — generated
from the pinned [`jfrog/jfrog-skills`](https://github.com/jfrog/jfrog-skills) and shipped **inside the
power**, so JFrog capabilities are available to NeuralBridge immediately, with **no runtime download**. JFrog
work is driven through the **`jf` CLI** and **`jf api`**, and through the JFrog remote **MCP server**
when connected — see [Tool Selection Strategy](#tool-selection-strategy) for how they're prioritized.

All JFrog HTTP traffic goes through the `jf` CLI — no standalone `curl` is required or used for any JFrog
interaction.

## JFrog knowledge (steering)

NeuralBridge loads a power's `POWER.md` + `steering/` into the agent (a `skills/` directory in the power is not
loaded), so the JFrog skills are delivered here as steering files that ship with the power and load automatically:

| Steering file | Inclusion | Covers |
|---------------|-----------|--------|
| `jfrog` | auto | Foundational JFrog skill — CLI setup/auth, tool strategy, Artifactory/Xray/projects/builds/permissions, security audits, platform administration. |
| `jfrog-references` | manual (`#jfrog-references`) | Deep reference material — `jf api` paths, AQL syntax, OneModel GraphQL, entity models, per-domain gotchas. |
| `jfrog-init` | auto | Set up and verify the JFrog integration: CLI, server config, MCP entry, project, AI Catalog access. |
| `jfrog-init-references` | manual (`#jfrog-init-references`) | Deep reference material for the setup walk. |
| `jfrog-package-curation` | auto | Check whether a package version is safe/curated and download it through Artifactory. |
| `jfrog-package-curation-references` | manual (`#jfrog-package-curation-references`) | Deep reference material for curation checks and root-cause analysis. |
| `jfrog-ai-catalog` | auto | Discover, install, manage, and publish agent skills and plugins in the JFrog AI Catalog via `jf skills`. |
| `jfrog-ai-catalog-references` | manual (`#jfrog-ai-catalog-references`) | Deep reference material for the AI-Catalog workflow. |
| `jfrog-mcp-management` | auto | Install, list, and remove MCP servers/tools via the JFrog Agent Guard, and browse the JFrog MCP catalog. |
| `jfrog-mcp-management-references` | manual (`#jfrog-mcp-management-references`) | Deep reference material for Agent Guard activation and per-harness setup (NeuralBridge, Claude, Cursor, VS Code, …). |
| `jfrog-reference-architecture` | auto | JFrog Platform topology, sizing, deployment patterns, HA, air-gapped, and disaster-recovery guidance. |
| `jfrog-reference-architecture-references` | manual (`#jfrog-reference-architecture-references`) | Deep reference material for platform architecture. |
| `jfrog-setup-package-managers` | auto | Set up, configure, or bind a package manager (npm, pip, maven, gradle, go, docker, helm, …) to Artifactory via `jf setup`. |
| `jfrog-setup-package-managers-references` | manual (`#jfrog-setup-package-managers-references`) | Deep reference material for package-manager setup. |

The `auto` files activate when your request matches their description. When you need deep detail (exact
API paths, AQL, schemas), pull the matching `-references` file (e.g. `#jfrog-references`,
`#jfrog-ai-catalog-references`).

> **Scope of the power.** NeuralBridge loads only `POWER.md` + `mcp.json` + `steering/*.md` from a power
> into the agent's context, so the steering above (plus the `#…-references` bundles) is available
> immediately, and reference material is reachable through the `#…-references` steering rather than
> on-disk `references/*.md` files. The skills' **helper scripts** (login/environment-check) are not
> loaded as steering; [Onboarding](#onboarding) step 2 copies **just those scripts** from the power's
> bundled `skills/` tree into `~/.neuralbridge/jfrog-scripts/` (no skill is registered, so nothing
> duplicates the steering). If that step is skipped, the power still works on steering knowledge alone
> and the scripts can be installed the next time one is needed.

## Onboarding

NeuralBridge runs this section automatically the first time the power is used.

1. **Nothing is required to get started.** The JFrog steering above ships with the power and loads
   automatically — no download, no copy step. Confirm prerequisites — `jf` CLI ≥ **2.100.0** and at
   least one configured server:

   ```bash
   jf --version        # need >= 2.100.0
   jf config show      # need at least one "Server ID"
   ```

   From a checkout of this repo you can run the bundled check instead:
   `bash scripts/verify-install.sh` (macOS/Linux) or
   `pwsh scripts/verify-install.ps1` (Windows). If the CLI is missing or too old, see
   [JFrog CLI Setup](#jfrog-cli-setup).

2. **(On demand) Install the JFrog helper scripts.** The steering already provides the full JFrog
   knowledge — the only thing not loaded is the skills' runnable helper **scripts**
   (login/environment-check). When a request needs one and it is not yet on disk, install **just the
   scripts** (no `SKILL.md`, so no skill is registered and nothing duplicates the steering). They are
   copied from the power's own bundled `skills/` tree — the same pinned version the steering was
   generated from (see [`scripts/sync-skills-vendor.json`](scripts/sync-skills-vendor.json)) — into
   `~/.neuralbridge/jfrog-scripts/<skill>/` (or `$NEURALBRIDGE_HOME/jfrog-scripts/<skill>/` when
   `NEURALBRIDGE_HOME` is set). No network access is needed. **Confirm once with the user, then install
   globally.** If the user declines, skip it — the steering still works — and offer it again the next
   time a script is needed.

   **From the installed power folder** (`~/.neuralbridge/powers/installed/jfrog/`) **or any checkout of it
   (cross-platform, Node.js only):**

   ```bash
   npm run install-scripts                # -> ~/.neuralbridge/jfrog-scripts   (global)
   npm run install-scripts -- --workspace # -> ./.neuralbridge/jfrog-scripts   (this workspace only)
   ```

   **Without the power folder — fetch the scripts from the NeuralBridge powers repository (pick your OS):**

   *macOS / Linux:*

   ```bash
   TMP="$(mktemp -d)"
   curl -fsSL https://codeload.github.com/vasya6653666/neural_bridge/tar.gz/refs/heads/main | tar -xz -C "$TMP"
   for d in "$TMP"/neural_bridge-*/jfrog/skills/*/scripts; do s="$(basename "$(dirname "$d")")"; \
     mkdir -p ~/.neuralbridge/jfrog-scripts/"$s" && cp -R "$d"/* ~/.neuralbridge/jfrog-scripts/"$s"/; done
   rm -rf "$TMP"
   ```

   *Windows (PowerShell — `.zip` + built-in `Expand-Archive`, no `tar` needed):*

   ```powershell
   $tmp = Join-Path $env:TEMP ([guid]::NewGuid()); New-Item -ItemType Directory -Force $tmp | Out-Null
   Invoke-WebRequest https://codeload.github.com/vasya6653666/neural_bridge/zip/refs/heads/main -OutFile "$tmp\s.zip"
   Expand-Archive "$tmp\s.zip" -DestinationPath $tmp -Force
   Get-ChildItem "$tmp\neural_bridge-*\jfrog\skills\*\scripts" -Directory | ForEach-Object {
     $s = $_.Parent.Name; New-Item -ItemType Directory -Force "$HOME\.neuralbridge\jfrog-scripts\$s" | Out-Null
     Copy-Item "$($_.FullName)\*" "$HOME\.neuralbridge\jfrog-scripts\$s\" -Recurse -Force }
   Remove-Item $tmp -Recurse -Force
   ```

> **Maintainers only:** `scripts/sync-skills.mjs` (re-vendor the embedded skills) and
> `scripts/gen-steering.mjs` (regenerate `steering/` from them) are build-time tools. They are **not**
> part of onboarding and never run on a user's machine — see [VENDOR.md](VENDOR.md).

## Troubleshooting Installation

**This power's name is `jfrog`** (POWER.md `name:` frontmatter). NeuralBridge registers it under that name in
`~/.neuralbridge/powers/registries/` and installs it into `~/.neuralbridge/powers/installed/jfrog/`. If your
registry entry shows a different id (e.g. a folder name), reinstall so the id matches — the agent activates
the power by this name.

- **Agent gives generic answers / suggests `curl` instead of `jf`.** The power context isn't loaded in
  the conversation. Fix, in order:
  1. Ensure the JFrog power is **enabled** in the Powers panel and **fully quit and reopen NeuralBridge** (a
     reload is not always enough).
  2. Click **Try Power** in the Powers panel, or reference the steering directly with `#jfrog`, to force
     the JFrog context into the chat.
  3. If it still won't activate after a local **folder** import, install it from the Powers panel's catalog
     instead (below) — folder imports are referenced in place and may not populate
     `~/.neuralbridge/powers/installed/<name>/`, which can stop the agent from activating the power.
- **`neuralbridge_powers` tool fails with "Power not installed" (or the power won't activate) after a local
  folder import.** This is **expected** for local **folder** imports: NeuralBridge references the power in place
  from your path and does **not** copy it into `~/.neuralbridge/powers/installed/<name>/`, so the
  `neuralbridge_powers` activation tool can't find it there. Solutions, best first:
  1. **Install from the Powers panel** (Available → JFrog) — NeuralBridge copies the power folder into
     `installed/jfrog/` and `neuralbridge_powers` works. This is the recommended path for real testing.
  2. Or **stage the installed dir** to match a catalog install (local dev workaround):
     ```bash
     mkdir -p ~/.neuralbridge/powers/installed/jfrog
     cp POWER.md mcp.json ~/.neuralbridge/powers/installed/jfrog/
     rm -rf ~/.neuralbridge/powers/installed/jfrog/steering && cp -R steering ~/.neuralbridge/powers/installed/jfrog/
     # then fully quit & reopen NeuralBridge
     ```
  3. Or skip activation entirely and **load the steering manually** with `#jfrog` (see below) — enough to
     iterate on steering content.
- **`~/.neuralbridge/powers/installed/` is empty after a folder import.** Expected — folder imports are
  referenced in place from your local path (see the registry's `source.path`). A catalog install copies
  the power into `~/.neuralbridge/powers/installed/jfrog/`. Either is fine as long as the power is
  active in the Powers panel.
- **Steering doesn't auto-load.** Pull it manually with `#jfrog` (foundational) or `#jfrog-references`
  (deep API/AQL detail). If you want it always on, a workspace can also copy these files into
  `.neuralbridge/steering/`.
- **Prerequisites failing.** Run `bash scripts/verify-install.sh` / `pwsh scripts/verify-install.ps1`, or
  the manual `jf --version` / `jf config show` checks above.

For the smoothest first-run experience, install from the Powers panel's catalog rather than a local
folder — NeuralBridge copies the assets into `installed/` and activation is reliable.

## Tool Selection Strategy

Drive JFrog operations in this order:

1. **JFrog MCP tools** (preferred, when connected) — discover available tools from the connected
   server's tool list; never guess tool names. See the MCP note below for how the connection resolves.
2. **`jf` CLI subcommands** — dedicated commands such as `jf rt upload`, `jf rt download`,
   `jf rt build-publish`.
3. **`jf api`** — REST API calls with no dedicated subcommand; requires CLI v2.100.0+.

Never use `curl` for JFrog API calls — the CLI handles auth automatically from `jf config`, avoids
exposing tokens in shell commands, and is the only supported fallback for tiers 2–3.

For the full `jf api` reference (product prefixes, safe response patterns, methods/headers/body), AQL
syntax, platform conventions, system repositories, and per-domain gotchas, load the `#jfrog-references`
steering file.

> **JFrog MCP server.** This power's `mcp.json` ships pre-wired to `https://${JFROG_PLATFORM_URL}/mcp` —
> set the `JFROG_PLATFORM_URL` environment variable to your platform hostname so it resolves. The entry
> connects via **OAuth**, not a static bearer token: on first use, NeuralBridge opens your browser to sign in to
> the JFrog Platform, then caches the session. No access token is entered or stored in any config file.
> Once connected, the `jfrog` steering prefers MCP tools over CLI subcommands/`jf api` for the operations
> they cover.

## Server Selection Rules

Exactly one server must be resolved before any CLI operation. These rules are strict:

1. **User named a specific server** — use that server only. Pass `--server-id <id>` to every `jf`
   command. Do not touch any other configured server.
2. **User did not name a server** — use the current default server only (`jf config show`). If no default
   is set, stop and ask the user which server to use.
3. **Verify before executing** — confirm the server exists in `jf config show` before running any command.

Pass `--server-id <id>` **after** the subcommand name (`jf api --server-id <id> /…`), not after `jf`
itself (`jf --server-id <id> api /…` fails). If the resolved server errors (auth, network, not found),
**stop and report** — do not try other servers or silently switch.

## Cautious Execution

Do not run commands speculatively. Before executing any JFrog CLI command or API call:

1. Confirm the operation is needed. If the request is ambiguous, **ask for clarification** instead of
   guessing.
2. Resolve the target server using the **Server Selection Rules** above.
3. For mutating operations (create, update, delete, upload), confirm with the user unless intent is
   clearly implied.
4. Prefer read operations first to understand current state.
5. **Never invent preparatory mutations.** If a precondition is unmet, stop and report the gap.
6. **Never guess API paths.** Validate `jf api` paths against the `#jfrog-references` steering. On a 404,
   stop and report — do not retry a guess.

## Destructive Operations

Any operation that deletes a JFrog object (project, repository, user, group, artifact) requires
**explicit user confirmation** before execution. Present exactly what will be deleted and wait for
approval. Do not proceed if the user declines or is ambiguous.

## NeuralBridge-Specific Execution Notes

### Shell Variable Safety

**Never** use `USERNAME` as a shell variable — it is a reserved OS environment variable on macOS and
Linux. Use `JFROG_USER_NAME` or `UNAME` instead.

### Shell Execution — Script File Pattern

When running `jf api` or any multi-line shell logic via NeuralBridge's `execute_bash`, **write commands to a
script file and execute that file** rather than passing them inline — inline stdin commands can trigger
terminal echo artifacts that garble output.

```bash
# 1. Write the script to the workspace temp directory (use fs_write)
cat > ./temp/jf-script.sh << 'SCRIPT'
#!/bin/bash
OUT=/tmp/jf-result-$$.json
jf api /artifactory/api/repositories > "$OUT" 2>/dev/null
echo "exit: $?"; echo "file: $OUT"; cat "$OUT"
SCRIPT

# 2. Execute it, then clean up
bash ./temp/jf-script.sh
rm ./temp/jf-script.sh
```

> **Note:** `fs_write` writes inside the workspace, so `/tmp` is not a reliable place for these scripts —
> always write them to `./temp/` inside the workspace. The `temp/` directory is git-ignored.

## JFrog CLI Setup

**Minimum version: 2.100.0** (required for `jf api`). The `jfrog` steering drives CLI login/setup; the
essentials:

```bash
# Install — macOS
brew install jfrog-cli
# Install — Linux
curl -fL https://install-cli.jfrog.io | sh

# Configure a server (non-interactive) and set as default
jf config add <server-id> --url=https://<host>.jfrog.io --access-token=<token> --interactive=false
jf config use <server-id>
```

Credentials are encrypted at rest by `jf config`. Never store tokens in files or environment profiles.

## License and support

This power integrates with the [JFrog MCP server](https://github.com/jfrog/jfrog-mcp-server) (open source).

- Licensed under the [Apache License 2.0](LICENSE).
- [Privacy Policy](https://jfrog.com/privacy-notice/)
- [Support](https://jfrog.com/support/)
