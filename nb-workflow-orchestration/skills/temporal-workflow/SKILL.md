---
name: "temporal-workflow"
description: "Safe order of work with Temporal through the temporal_* tools: detect the CLI and target, find executions with a List Filter, read state, pending activities and a payload-free history, check task queue pollers, then start, signal, cancel or terminate only through a reviewed plan. Use whenever the user asks about Temporal Workflows, stuck or failed runs, Workers or task queues."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Temporal workflow

The power's MCP server runs the Temporal CLI (`temporal`) on the user's machine with the user's address, Namespace and
credentials. Work in this order.

## 1. Find out where you are

Call `wfo_detect`. It reports the CLI version, the address, the Namespace and the config profile in use, and whether an
API key or TLS settings are present (never their values).

- If the address or Namespace looks like production, or the user works with several, say which one you will use and get
  confirmation before any change. Pass `namespace` explicitly from then on.
- If the CLI is not found, tell the user to install the Temporal CLI or to set `NB_WFO_TEMPORAL` to its path and restart
  the IDE. Do not download it yourself.
- Never ask the user to paste an API key, a certificate or a private key into the chat. Credentials belong in
  `TEMPORAL_API_KEY`, `TEMPORAL_TLS_*` or the config profile.

## 2. Look before you change

- `temporal_workflow_list` with a List Filter, for example
  `ExecutionStatus = 'Running' AND WorkflowType = 'OrderWorkflow'` or `ExecutionStatus = 'Failed' AND StartTime > '2026-01-01T00:00:00Z'`.
  Keep `limit` small; narrow the query instead of listing everything.
- `temporal_workflow_describe` for one run: status, pending activities with attempt counts and the last failure message,
  pending child workflows, and the failure of a failed run.
- `temporal_workflow_history` for the timeline: which activity failed, which signal arrived, where the run waits. Use
  `limit` for long histories.
- `temporal_task_queue_describe` when a run does not progress: no pollers means no Worker is processing that task queue
  (a deployment or Worker problem, not a Workflow bug). A growing backlog means Workers are too slow or too few.

Inputs, results, memo and heartbeat details are never shown, only their size: they may contain personal data. Do not
look for them another way (for example `temporal workflow show` in a terminal) and do not ask the user to paste them.
Explain failures from the failure messages, the history and the Workflow code in the project.

## 3. Changes go through a plan

Every change has a plan tool and an apply tool. The plan changes nothing; the apply tool works only with the plan id.

1. Call the plan tool:
   - `temporal_start_plan` to start a Workflow (type, task queue, Workflow ID, `input` as a JSON value or `inputs` for
     several arguments, optional timeouts). Prefer an explicit Workflow ID so the start cannot be duplicated.
   - `temporal_signal_plan` to send a Signal to a running Workflow.
   - `temporal_stop_plan` with `mode: "cancel"` (the Workflow runs its cleanup and compensations) or `mode: "terminate"`
     (ends at once, no cleanup; give a `reason`). Prefer cancel; use terminate only when the user asks for it or the
     Workflow cannot react to cancellation (for example its Workers are gone).
2. Show the user the plan as it is: target address and Namespace, Workflow type and ID, the pinned Run ID, the input, and
   every warning. Say plainly that starting or signalling runs business logic in the user's Workers.
3. Call the matching apply tool (`temporal_start_apply`, `temporal_signal_apply`, `temporal_stop_apply`) **only after the
   user explicitly approves this plan**.
4. If the apply refuses because the run closed, a new run started or the target changed, describe the Workflow again,
   make a new plan and show it again. A plan id works once; do not retry an apply in a loop.

## 4. When something fails

Report CLI errors as they are. Connection errors, expired API keys or certificates, and `PermissionDenied` are fixed by
the user (network, credentials, Namespace permissions); ask them to fix it and then repeat the read. Do not run
`temporal workflow start`, `signal`, `cancel`, `terminate`, `reset`, `delete` or batch operations with `--query` through
the terminal to bypass this flow.
