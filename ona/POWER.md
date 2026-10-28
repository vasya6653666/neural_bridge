---
name: "ona"
displayName: "Offload to Ona"
author: "Ona"
license: "MIT"
description: "Detect when work belongs in Ona, resolve the current repo to a project, and use the Ona CLI to launch environments, start one-off AI executions, or create, update, and start AI automations with explicit confirmation."
keywords: ["ona", "ona cli", "run in ona", "launch in ona", "create ona environment", "ona project", "ona automation", "prepare repo for ona", "dev container for ona", "gitpod", "linear in ona", "sentry in ona", "draft pr in ona", "private network in ona"]
---

# Onboarding

Use this power when the user wants help deciding whether work belongs in Ona, launching the next step with the Ona CLI, or preparing a repository so it is ready for Ona later.

When this power first activates:

1. Decide whether the task should stay local or move to Ona.
2. If the user wants direct Ona execution and NeuralBridge can run shell commands, use the safe preflight checks listed below.
3. If the Ona CLI is unavailable but the user wants to prepare the repository for Ona, switch to the local setup path instead of stopping.

# License and support

- Power license: MIT. See `LICENSE` in this repository.
- Underlying tool: Ona CLI. This power does not require or configure an MCP server.
- Support: Use the Ona CLI documentation at https://ona.com/docs/ona/integrations/cli, the Ona support page at https://ona.com/support, or the Ona contact page at https://ona.com/contact.

## Safe preflight checks

When command execution is available, use these in order:

- `command -v ona`
- `ona whoami -o json`
- `git remote get-url origin`
- `ona project list --limit 1000 -o json`
- `ona environment list -a -o json`
- `ona ai automation list -o json`

Do not run side-effecting commands during preflight.

For project selection specifically:

- do not reason directly from the raw `ona project list --limit 1000 -o json` output in chat
- after preflight, use the combined filtering and ranking command from `steering/login-and-readiness.md`
- only present repo-matching, ranked candidates to the user
- prefer a single shell command that invokes `ona project list`, `ona environment list`, and `python3` together
- do not ask NeuralBridge to materialize intermediate JSON temp files from prior command output for ranking

## Side-effecting commands

Only run these after explicit user confirmation:

- `ona login`
- `ona login --no-browser`
- `ona project create <repo-url> ...`
- `ona environment create <project-id> --dont-wait --set-as-context ...`
- `ona environment start <environment-id> --set-as-context`
- `ona ai automation execute - --environment-id <environment-id>`
- `ona ai automation create <path-to-yaml>`
- `ona ai automation update <automation-id> <path-to-yaml>`
- `ona ai automation start <automation-id> --project <project-id>`

When building a command:

- use only flags that were validated from the live CLI help or from a successful earlier run
- do not assume every command supports `-o json`
- for `ona environment create`, prefer the plain command because it already prints the environment ID directly

## Response contract

For Ona-oriented responses, keep this section order:

1. `Why Ona`
2. `Recommended path`
3. `Readiness`
4. `Next step`
5. `Ona prompt`
6. `Additional setup needed`

`Next step` should say whether the power can run the action now or what setup or confirmation is still needed.

## What not to claim

This version is a CLI-backed launcher and local setup helper. Do not claim that it can:

- run arbitrary `ona environment exec` commands
- create brand new automation task definitions or services from natural language alone
- write automation config directly into an existing remote environment
- open an editor automatically unless the user asks

# Steering Instructions

Use steering files for the detailed workflows and best practices instead of repeating them here:

- Deciding whether to stay local or move to Ona: `steering/delegate-to-ona.md`
- Determining readiness, project resolution, Git auth, or integration gaps: `steering/login-and-readiness.md`
- Running the CLI-backed launch flow: `steering/execution-flow.md`
- Preparing a repository locally for Ona: `steering/local-setup-flow.md`
- Turning repeated work into an automation recommendation: `steering/automation-handoff.md`
- Checking whether a repo is ready for project creation: `steering/repo-readiness.md`

# Global Rules

- Prefer Ona for long-running, secure, internal-network-dependent, or repeatable work.
- Prefer staying local for short, interactive work.
- Use a **project-first** strategy whenever a project match exists.
- Filter and rank matching projects before presenting them. Do not dump raw `ona project list` output into the chat.
- For multiple project matches, use the explicit combined ranking command from `steering/login-and-readiness.md` instead of improvising from the raw JSON.
- Treat one-off long-running requests as prompt-driven AI execution, not as recurring automation.
- Treat user-facing recurring requests as AI automations. Do not route them to `.ona/automations.yaml` tasks or `ona automations task ...`.
- For recurring AI automations, persist the automation definition in the repo before creating or updating it in Ona.
- Scope environment reuse to the current NeuralBridge session by default. Do not attach a new task to some other existing environment unless the user explicitly asks.
- Ask for confirmation before starting a side-effecting flow, not before every single command inside an already approved flow.
- Treat one-off AI executions as background handoffs. Once Ona has accepted the run, report that it was handed off instead of waiting for completion in chat.
- After a one-off AI execution is handed off, stop. Do not poll, retry, or issue follow-up status-check commands unless the user explicitly asks for an update later.
- For one-off AI execution, prefer a wrapped shell command that captures noisy CLI logs and prints a short handoff confirmation plus the environment link.
- For one-off AI execution, never interpolate raw user prompt text into a fixed shell heredoc delimiter. Serialize the prompt into a temp spec file safely and clean up temp files with `trap`.
- Separate Ona login from Git auth and integrations in both reasoning and user-facing output.
- If the Ona CLI is missing and the user wants direct Ona execution or AI automations, tell them how to install it first. Prefer `brew install gitpod-io/tap/ona`, and also point them to `https://ona.com/docs/ona/integrations/cli`.
- If the user is trying to get a repo Ona-ready, do not block on the CLI; offer local Dev Container and automation setup instead.
- Use the canonical setup prompt for local repo-preparation flows rather than inventing a shorter one.
- Preserve the user's original prompt for one-off Ona execution instead of replacing it with a repo task name.
- Keep one-off AI execution YAML ephemeral. Only suggest saving YAML under `.ona/` when the user wants a reusable workflow.
