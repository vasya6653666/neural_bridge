# Automation Handoff

Use this guide when the user's request should become an Ona AI Automation rather than a one-off prompt-driven AI execution.

This guide is for the Automations product, not for `.ona/automations.yaml` tasks and services.

## When to choose automation

Prefer `offload-automation` when the task is:

- repeated on a schedule
- repeated across repositories
- triggered by pull requests, webhooks, or issue events
- a maintenance workflow the team wants to standardize

Examples:

- nightly dependency cleanup
- daily backlog pickup
- recurring Sentry triage
- scheduled test or validation sweeps
- repeated docs or migration work across repositories

Do not use this guide for one-off requests that merely happen to run for a long time. "Run this overnight in Ona" should usually stay a one-off AI execution unless the user asks for a recurring or saved workflow.

## What to hand off

When recommending automation, produce a brief that is ready to paste into Ona Automation setup or map to an AI automation created or updated through the CLI.

If the workflow started as a successful one-off execution and now needs to be reused:

- explain that the one-off execution YAML should not be kept by default
- suggest promoting it into a repo-stored AI automation definition under `.ona/ai-automations/`
- make clear that `.ona/automations.yaml` remains the repo task and service file
- only persist the new YAML when the user explicitly wants a repeatable workflow

The `Ona prompt` section should include:

- the task to perform
- what should trigger it
- what success looks like
- whether it should open a draft PR
- what external context it may need

## Default automation framing

Unless the user specifies otherwise, assume:

- draft PRs are safer than ready-to-merge PRs
- small, reviewable changes are preferred
- repeated work should be explicit about success criteria

## AI automation management flow

If the user wants to create, update, or start an Automation:

- use `ona ai automation list -o json` to discover existing AI automations when needed
- write the YAML spec into `.ona/ai-automations/<slug>.yaml`
- match existing automations by exact automation name plus the selected project ID in trigger context
- if exactly one automation matches, update it
- if no automations match, create it
- if multiple automations match, show the candidates and ask the user which one to update
- use `ona ai automation create <path-to-yaml>` to create a new AI automation from that saved file
- use `ona ai automation update <automation-id> <path-to-yaml>` to update an existing AI automation from that saved file
- use `ona ai automation start <automation-id> --project <project-id>` only when the user wants to manually start an existing AI automation
- do not silently create duplicate automations when an exact name-and-project match already exists
- do not route these requests to `ona automations task ...`
- after create or update, return the automation definition link: `https://app.gitpod.io/automations/<automation-id>#definition`

## Example structure for automation handoff

### `Recommended path`

`Recommended path`: Offload this to an Ona Automation. This is repeatable work that will be easier to maintain as a scheduled or triggered workflow than as a one-off prompt.

### `Ona prompt`

Use a compact brief like this:

```text
Run this workflow as an Ona Automation.

Goal:
- <what the automation should accomplish>

Trigger:
- <schedule, PR event, webhook, or manual trigger>

Execution rules:
- Work in the relevant repository or project
- Keep changes small and reviewable
- Run the smallest relevant checks
- Open a draft PR with a concise summary

Success criteria:
- <what should be true when the automation finishes>
```

## When not to choose automation

Do not choose automation when the user only needs:

- a one-off investigation
- a single implementation pass
- work that still needs interactive shaping before repetition makes sense

Also do not claim that this power can create brand new automation tasks or services directly through the CLI in this version.
