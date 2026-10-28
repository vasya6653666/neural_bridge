# JFrog Plugin for NeuralBridge

JFrog plugin for NeuralBridge: artifact management, security scanning, supply-chain best practices, and Agent Guard.

Works in both **NeuralBridge IDE** (as a power) and **`neuralbridge-cli`** (as additive skills). One install flow covers both.


> **Preview Notice:** This Plugin is in preview and licensed under the Apache License 2.0. For clarity: This software is provided "as-is" without warranty of any kind, and without support obligations or service level commitments. Behavior, APIs, conventions, and structure may change without notice between releases. JFrog makes no guarantees of backward compatibility during the preview release cycle. Use in production environments is at your own risk.

## Skills

| Skill | Description |
| --- | --- |
| `jfrog` | JFrog Platform operations via CLI and APIs (Artifactory, Xray, access, projects, and more). |
| `jfrog-init` | Plugin readiness / setup (detect CLI, config, MCP, and related bootstrap steps). |
| `jfrog-mcp-management` | Install, list, and remove MCP servers through JFrog Agent Guard; browse the JFrog MCP catalog. |
| `jfrog-ai-catalog` | Discover, install, manage, and publish agent skills from the JFrog AI Catalog via `jf skills`. |
| `jfrog-setup-package-managers` | Bind package managers (npm, pip, Maven, Go, and more) to JFrog Artifactory via `jf setup`. |
| `jfrog-reference-architecture` | JFrog Platform topology, sizing, deployment patterns, and multi-site guidance. |
| `jfrog-package-curation` | Check package safety and download via Artifactory. |

After installing the skills (Installation, step 2.3), use them as `/jfrog`, `/jfrog-init`, etc. in a NeuralBridge IDE chat or in `neuralbridge-cli`.

Skill content is vendored under `skills/` — see [VENDOR.md](VENDOR.md).

## JFrog MCP

The plugin ships with the JFrog Platform MCP server at `https://${JFROG_PLATFORM_URL}/mcp`. `JFROG_PLATFORM_URL` is a placeholder in `mcp.json` that `/jfrog-init` replaces automatically with the host from your `jf config`. The connection uses OAuth — NeuralBridge opens a browser sign-in on first use and caches the session.

---

## Prerequisites

- **NeuralBridge** — IDE installed from https://neuralbridge.ru/ide, with MCP enabled (`neuralbridge.configureMCP` not set to `Disabled`), and/or `neuralbridge-cli` for terminal use.
- **JFrog CLI** — with a configured server (`jf config add`). See [Authentication](#authentication) and [Install the JFrog CLI](https://docs.jfrog.com/integrations/docs/download-and-install-the-jfrog-cli).
- **Node.js** — on your `PATH` (for the installer and the skills' helper scripts).
- **`JFROG_PLATFORM_URL`** — resolved automatically by `/jfrog-init` from your `jf config`. No manual export needed.
- **Skill runtime requirements** — `jq` and `curl` on `PATH`. For minimum versions, see the upstream skills [Requirements](https://github.com/jfrog/jfrog-skills/blob/main/README.md#requirements).

---

## Installation

### 1. Install the JFrog CLI

```bash
# macOS
brew install jfrog-cli
# Linux
curl -fL https://install-cli.jfrog.io | sh
```

Configure it for your JFrog instance (`<server-id>` is a local name you choose):

```bash
jf config add <server-id> \
  --url=https://YOUR_JFROG_PLATFORM_URL \
  --access-token=YOUR_TOKEN \
  --interactive=false

jf config use <server-id>
```

Generate a token from `https://<your-platform>/ui/admin/configuration/security/access_tokens`.

### 2. Install the power in NeuralBridge IDE

1. Open NeuralBridge and click the **Powers** icon in the Activity Bar.
2. Under **Available**, select **JFrog** and install it.

The power ships `POWER.md` + `mcp.json` + `steering/`. Steering loads automatically and provides JFrog knowledge via natural language.

> NeuralBridge installs the power into `~/.neuralbridge/powers/installed/jfrog/`, which is required for
> reliable activation. A local folder import is referenced in place and may not activate — see
> [POWER.md → Troubleshooting Installation](POWER.md#troubleshooting-installation).

3. **(Optional) Install the JFrog skills** — if you want to invoke skills using slash commands (e.g. `/jfrog`, `/jfrog-init`), open a terminal in the installed power folder and run:

   ```bash
   node scripts/install-neuralbridge.mjs
   ```

   This works on **macOS, Linux, and Windows** (requires Node.js). The installer copies the JFrog skills into `~/.neuralbridge/skills/` (read by both the IDE and `neuralbridge-cli`) and adds the `jfrog` server to `~/.neuralbridge/settings/mcp.json` (an existing `jfrog` entry is left untouched; without `JFROG_PLATFORM_URL` the entry keeps the `${JFROG_PLATFORM_URL}` placeholder that `/jfrog-init` fills in). Pass `--workspace` to install into `./.neuralbridge/` of the current project instead. Without this step, the power still works via natural language — steering loads automatically.

   <details><summary>Alternative: bash one-liner without the power folder (macOS / Linux only)</summary>

   ```bash
   curl -fsSL https://raw.githubusercontent.com/vasya6653666/neural_bridge/main/jfrog/scripts/bootstrap.sh | bash
   ```

   </details>

4. **(Requires step 3) Run `/jfrog-init`** in a NeuralBridge chat — it checks CLI, server config, and MCP registration, and walks you through anything missing. Reload the NeuralBridge window afterwards so the MCP entry reloads.

   If you skipped step 3, ask the agent in natural language (e.g. *"initialize JFrog"* or *"check my JFrog setup"*).

### Notes

> **Avoid loading JFrog twice.** The power's steering and the installed skills carry the same knowledge.
> If that is noticeable in your chats, install the skills only for one project with
> `node scripts/install-neuralbridge.mjs --workspace`.

> **`neuralbridge-cli` users:** to avoid loading JFrog twice when you use both the IDE and the CLI, give the
> CLI its own profile:
>
> ```bash
> # macOS / Linux
> NEURALBRIDGE_HOME=~/.neuralbridge-cli node scripts/install-neuralbridge.mjs
> ```
>
> ```powershell
> # Windows (PowerShell)
> $env:NEURALBRIDGE_HOME = "$HOME\.neuralbridge-cli"; node scripts/install-neuralbridge.mjs
> ```

> **Custom NeuralBridge home.** Both installers honor `NEURALBRIDGE_HOME` (default `~/.neuralbridge`):
>
> ```bash
> NEURALBRIDGE_HOME=/path/to/home node scripts/install-neuralbridge.mjs
> ```

> **Helper scripts (on demand).** The installer copies skills including their `scripts/` subdirectories.
> If you installed the power without step 3, some requests that need a runnable helper script
> (login, environment-check) will offer to copy just the scripts into `~/.neuralbridge/jfrog-scripts/`
> from the power's bundled `skills/` tree (no network). Manual install from the power folder:
>
> ```bash
> npm run install-scripts                # -> ~/.neuralbridge/jfrog-scripts   (global)
> npm run install-scripts -- --workspace # -> ./.neuralbridge/jfrog-scripts   (this workspace)
> ```

---

## Using `neuralbridge-cli`

`neuralbridge-cli` is the terminal client of NeuralBridge, separate from the IDE.

1. **Install the JFrog skills** (skip if already done during [IDE setup](#2-install-the-power-in-neuralbridge-ide)) — from the power folder:

   ```bash
   node scripts/install-neuralbridge.mjs
   ```

   Or on macOS / Linux: `curl -fsSL https://raw.githubusercontent.com/vasya6653666/neural_bridge/main/jfrog/scripts/bootstrap.sh | bash`

2. **Start a session** — no `--agent` flag needed, the install is additive:

   ```bash
   neuralbridge-cli chat
   ```

For headless/CI runs:

```bash
neuralbridge-cli chat --no-interactive --trust-tools=execute_bash "List my Artifactory repositories"
```

If you use both the IDE and `neuralbridge-cli`, give the CLI its own profile (`NEURALBRIDGE_HOME=~/.neuralbridge-cli`) to avoid loading JFrog from both steering and skills — see the [install notes](#notes).

---

## Verify

After installation, confirm:

1. **Readiness check** — if you installed skills (step 3), run `/jfrog-init`. Otherwise, ask the agent *"check my JFrog setup"*.
2. **Powers panel** — `JFrog` is listed under **Installed**.
3. **Slash commands** — if you installed skills (step 3), type `/jfrog` and confirm the JFrog skills appear.
4. **MCP** — the **MCP Servers** view lists the `jfrog` server; NeuralBridge signs in to the JFrog MCP server with OAuth when you authenticate it.

If any check fails, see [Recovery](#recovery).

---

## Recovery

| Symptom | Do this | Do **not** do this |
| --- | --- | --- |
| No `/jfrog` slash commands in IDE or CLI | Run the [installer](#2-install-the-power-in-neuralbridge-ide) (step 3) to install skills into `~/.neuralbridge/skills/`, then reload NeuralBridge. | Assume the Power alone provides `/`-invoke — it ships steering only. |
| `/jfrog-init` stopped at CLI/auth | Follow the skill prompt (`jf config add`, web login, or token path), then **re-run `/jfrog-init`**. | Skip init and only export env vars. |
| MCP missing after install | Confirm `JFROG_PLATFORM_URL` is set to host only (no `https://`, no trailing `/`), re-run `/jfrog-init`, **reload NeuralBridge**. | Set env vars mid-session and expect MCP to appear. |
| Power not activating | Reinstall from the Powers panel (not a local folder). Local imports reference in place and may not populate `installed/`. | Debug a local-folder import in production. |

---

## Authentication

Configure the JFrog CLI so the skills can reach your platform:

```bash
jf login              # browser-based setup
# or
jf config add         # interactive prompts for URL + token
```

The MCP server uses **OAuth** — NeuralBridge opens a browser sign-in on first use and caches the session.

---

## Usage

Once configured, interact with the JFrog plugin through natural language. Examples are grouped by capability.

### JFrog Platform skill

| Ask the agent… | What happens |
| --- | --- |
| "List my Artifactory repositories." | Returns repositories via the JFrog CLI. |
| "Upload this build to Artifactory." | Publishes build artifacts and metadata. |
| "Run a security audit on this project." | Runs an Xray / Advanced Security audit and summarizes findings. |
| "Show me details on CVE-2021-23337." | Looks up CVE details in JFrog Advanced Security. |
| "Create a scoped access token for CI." | Creates an access token with the requested scope. |
| "Promote this release bundle to production." | Uses Lifecycle / Distribution APIs to promote the bundle. |

### Package curation skill

| Ask the agent… | What happens |
| --- | --- |
| "Is `lodash@4.17.21` safe to install?" | Checks JFrog Public Catalog signals and curation policy for the package. |
| "Is this Maven package approved for use?" | Checks curation entitlement and policy for the requested package. |
| "Download `requests` via JFrog." | Resolves the package through an Artifactory remote cache or curation-aware package manager. |

### MCP server management (Agent Guard)

| Ask the agent… | What happens |
| --- | --- |
| "Which MCP servers can I install?" | Returns all MCP servers approved for your current project. |
| "What MCP servers do I already have?" | Returns only the MCP servers already installed on your machine. |
| "Add the GitHub MCP server." | Installs an approved MCP server and syncs its tool policies locally. |
| "Remove the Slack MCP server." | Removes the server and its stored credentials from your local setup. |

---

## Uninstall

```bash
rm -rf ~/.neuralbridge/skills/jfrog*
```

Every JFrog skill dir is `jfrog*`-prefixed, so this leaves your other skills untouched. If you installed with a custom `NEURALBRIDGE_HOME`, use `rm -rf "$NEURALBRIDGE_HOME"/skills/jfrog*` instead. Remove the `jfrog` entry from `~/.neuralbridge/settings/mcp.json` by hand if the installer added it.

---

## Troubleshooting

See the [JFrog MCP Registry troubleshooting guide](https://docs.jfrog.com/ai-ml/docs/mcp-registry-troubleshooting).

---

## Development

### Build tasks

These tasks are for **maintainers** only:

- `npm run sync-skills` — re-vendor skills from `jfrog/jfrog-skills` at the pinned tag (see [VENDOR.md](./VENDOR.md))
- `npm run gen-steering` — regenerate `steering/` from the embedded `skills/`
- `npm run verify-install` — check prerequisites (JFrog CLI + a configured server)
- `npm run validate` — lint skill frontmatter, POWER.md, and steering
- `npm test` — run the validator unit tests

> After bumping the pin: run `npm run sync-skills` **and** `npm run gen-steering`, then commit both
> `skills/` and `steering/`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and pull-request expectations.

## License

Licensed under the [Apache License 2.0](LICENSE).

- [Privacy Policy](https://jfrog.com/privacy-notice/)
- [Support](https://jfrog.com/support/)
