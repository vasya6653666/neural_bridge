# Release checklist

**Status: helper checks pass; live acceptance in NeuralBridge IDE not recorded yet.**

This checklist covers the NeuralBridge IDE edition of the power. The
[setup guide](setup-helper.md) describes the implemented commands. The package
contains skills and a bundled helper; it ships no root `mcp.json`.

Setup accepts all local NeuralBridge IDE versions with Node.js 22+, including
future and undetected versions. The tested-version list is empty until a live
acceptance below is recorded: every version warns and continues.

The supported n8n minimum is **2.43.7**, the oldest released self-hosted version
on which the power's maintainers recorded public OAuth and full workflow
acceptance. The NeuralBridge edition keeps that baseline; it does not claim older
releases are incompatible.

## Helper checks

- [x] `npm test` — setup and discovery against disposable loopback servers,
      bundle launch modes, shared-skill snapshot handling and examples.
- [x] `npm run check` — bundle reproducibility (`npm run build:check`),
      manifest version, packaging, local Markdown links and documented commands.
- [x] The helper writes `~/.neuralbridge/settings/mcp.json` (or
      `$NEURALBRIDGE_HOME/settings/mcp.json`) for user scope and
      `<project>/.neuralbridge/settings/mcp.json` for workspace scope, and keeps
      registration metadata in `~/.neuralbridge/n8n-power/connections.json`.
- [x] Version detection: product.json of the installed application on Windows
      (`%LOCALAPPDATA%\Programs\NeuralBridge`, `…\NeuralBridge IDE`) and macOS
      (`/Applications/NeuralBridge.app`, `/Applications/NeuralBridge IDE.app`),
      `neuralbridge --version` from PATH otherwise.

## Acceptance gates

Use a development instance and synthetic data. Record the candidate commit,
NeuralBridge/OS/n8n versions, hosting model, result, and any skipped checks. Keep
tokens, passwords, and private payloads out of evidence. When a gate passes on a
NeuralBridge version, add that version to `TESTED_NEURALBRIDGE_VERSIONS` in
`src/setup/neuralbridge.mjs` and rebuild.

- [ ] **Package install:** install the power from the Powers panel and verify the
      installed files and the three entry skills (`connect-n8n`, `build-workflow`,
      `debug-execution`).
- [ ] **Local connection:** run the installed helper from NeuralBridge's agent
      terminal, authenticate the server under **MCP Servers**, complete OAuth
      consent and an authenticated native read, without editing JSON or copying
      a token.
- [ ] **Core workflow acceptance:** create and run a draft, inspect and repair
      wrong output and a runtime error, and confirm the final outputs through
      native MCP.
- [ ] **Restart:** verify a read after a full IDE restart without new consent or
      another registration.
- [ ] **Repair:** `repair --new-registration` creates a separate grant (the
      `X-N8N-NeuralBridge-Connection` header changes) and NeuralBridge asks for a
      fresh sign-in.
- [ ] **Expired-token refresh:** verify a native read after expiry refreshes the
      saved grant without another consent flow or registration.
- [ ] **Access and effects:** respect a read-only grant and unavailable
      workflows; distinguish simulated data from real integrations and obtain
      authorization for actual external effects.
- [ ] **Platforms:** record which of Windows, macOS and Linux were exercised.

## Known limitations

- NeuralBridge may request all advertised OAuth scopes regardless of the
  configured `oauthScopes`; the n8n consent page remains authoritative.
- Pinned testing through `test_workflow` depends on the client passing nested
  `pinData`; the connection skill describes a guarded manual-execution fallback.
- The helper targets local IDE sessions; `localhost` in a remote session names
  the remote machine.
