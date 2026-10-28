# Pi Security for NeuralBridge

Bring Pi Security into NeuralBridge to understand security findings, review your security posture, and get practical guidance. This Power packages six workflows and one connection to Pi's hosted MCP service. There is no local server, build step, API key, or additional agent to configure.

**Compatibility:** this package targets NeuralBridge IDE and optional NeuralBridge CLI using the modern Agent Plugins format.

## What you can do

| Workflow | Try asking | Boundary |
| --- | --- | --- |
| [Investigate a finding](skills/investigate-pi-finding/SKILL.md) | “Help me understand Pi finding FND-123.” | Read-only evidence and interpretation |
| [Review security posture](skills/review-pi-security-posture/SKILL.md) | “Review my Pi threat-model and Code Gatekeeper posture.” | Read-only, scoped to the applications and results you select |
| [Get remediation guidance](skills/get-pi-remediation-guidance/SKILL.md) | “Show me Pi's remediation guidance without changing code.” | Fetches existing guidance; preparing a package plan requires confirmation |
| [Start a design review](skills/start-pi-security-design-review/SKILL.md) | “Queue a Pi security review of this pasted Markdown.” | Queues one review only after confirmation |
| [Import a Markdown report](skills/ingest-pi-markdown-report/SKILL.md) | “Import example-report.md into Pi; here is its Markdown.” | Starts processing only after confirmation |
| [Use secure-development guidance](skills/use-pi-secure-development-playbook/SKILL.md) | “Ask Pi for secure-development guidance for this task.” | Guidance, not automatic code changes; feedback requires confirmation |

`FND-123` and `example-report.md` are synthetic examples, not real records. Use references returned by Pi or supplied by an authorized user; never guess workspace names, repository slugs, or record IDs. Design reviews accept supported Confluence/Notion links or pasted Markdown. Report import requires both a `.md`/`.markdown` filename and pasted Markdown; these workflows do not upload local files or attachments.

## Get started

The following steps are for you to perform when you are ready to connect. Use a customer-free project and test workspace first.

### 1. Install the power

1. Install the power from the **Powers** panel in NeuralBridge IDE.
2. Ask a Pi Security question to activate the power.

NeuralBridge IDE names the power's MCP server `power-pi-security-<server name>`. Do not copy
`mcp.json` into your user or project settings or add a second Pi server.

### 2. Sign in to Pi and check the workspace

The Power declares only `https://mcp.pi.security/mcp` using `streamable-http`. [Agent Plugins leaves authentication to the client](https://agent-plugins.org/plugin-authors/mcp-servers); there are no portable OAuth credential fields to fill in. In NeuralBridge IDE, sign in to a remote MCP server with **Authenticate** in the **MCP Servers** view.

1. When NeuralBridge connects and offers OAuth sign-in, complete Pi's sign-in in your browser. Choose the intended Pi workspace if prompted. Review the requested access before approving it.
2. Ask: **“Use the Pi Security MCP `whoami` tool to show my authenticated Pi workspace and granted scopes. Do not run any other Pi tools yet.”** This means Pi's tool, not the terminal's `whoami` command.
3. Check that the returned workspace (tenant) is the one you intend to use. Do not proceed if it is missing, unclear, or wrong.

Your project folder, repository, and NeuralBridge account do not select or switch the Pi workspace; the Pi OAuth session does. A successful NeuralBridge login alone does not verify Pi access. Repeat the Pi identity check after reconnecting or changing accounts and before each write.

If the Power does not expose the expected tools or OAuth cannot finish, stop and report a sanitized error. Do not substitute tokens, custom client credentials, headers, a proxy, or a different endpoint. This package does not promise that every NeuralBridge version can complete Pi's OAuth flow.

### 3. Start read-only; confirm each change

Begin with a scoped finding or posture question. Check the evidence and coverage shown in the response. Before a write, the skill must show the Pi workspace, action, and inputs and wait for your fresh confirmation. For reports and designs it previews a non-sensitive summary and content size rather than repeating the full document. Earlier permission to “help” or “review” is not permission to submit data.

Keep NeuralBridge's tool approval prompts enabled. A queued review, started import, or generating plan is still in progress—not a completed result. If the response to a write is unclear, do not retry automatically; it may already have been accepted.

## Optional NeuralBridge CLI

The IDE is sufficient. If you also want terminal access, use NeuralBridge CLI. Install this power through the IDE first; do not create a separate CLI MCP configuration or custom agent. Ask a Pi Security question to activate it and use `/mcp` to inspect the connection. Complete Pi OAuth if requested and repeat the Pi `whoami` check—do not assume IDE credentials or workspace selection carry over.

If the CLI does not pick up the power, stop rather than adding a workaround.

## Reconnect or remove

Use the power's connection as displayed by NeuralBridge IDE: `power-pi-security-<server name>`.

- **IDE:** in the **MCP Servers** view, use **Reconnect** for connection trouble or **Authenticate** to sign in again when a token expires; **Show MCP Logs** shows the connection log.
- **CLI:** `/mcp` shows the connection; `/mcp auth` signs in again, `/mcp cancel-auth` stops a stuck browser sign-in, and `/mcp logout` clears the server's stored credentials. Select the Pi power's server, not an unrelated connection.
- **Wrong Pi workspace:** stop, sign out of Pi in the browser, and choose **Authenticate** again. If that does not switch the workspace, ask support rather than editing credential files. Run Pi `whoami` again before other requests.
- **Removal:** remove the installed power in the **Powers** panel and check that its skills and tools are no longer available in a new IDE or CLI session. Do not assume removal revokes OAuth access or deletes data already submitted to Pi; manage that with Pi.

Never replay an uncertain write while troubleshooting a connection.

See [SECURITY.md](SECURITY.md) for private reporting and support.

## License and attribution

Licensed under [MIT](LICENSE).
