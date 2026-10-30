---
name: "argo-workflow"
description: "Safe order of work with Argo Workflows through the argo_* tools: detect the CLI and target, lint manifests offline, list workflows, find the failed node and read its logs, then submit, stop, terminate or retry only through a reviewed plan. Use whenever the user writes Argo Workflow manifests or asks about workflow runs in a cluster."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Argo Workflows workflow

The power's MCP server runs the argo CLI on the user's machine, either against an Argo Server (`ARGO_SERVER`) or the
Kubernetes API through the user's kubeconfig. Paths passed to tools are **absolute**. Work in this order.

## 1. Find out where you are

Call `wfo_detect`. It reports the argo version and the mode: the Argo Server address, or the current kubeconfig context.

- Before any change, say which context or server and which namespace you will use, and get the user's confirmation when
  there are several or the name suggests production. Pass `context` and `namespace` explicitly from then on.
- If argo is not found, tell the user to install the argo CLI or to set `NB_WFO_ARGO` to its path and restart the IDE.
  Do not download it yourself.
- Never ask the user to paste `ARGO_TOKEN`, kubeconfig contents or Secret values into the chat.

## 2. Check manifests locally

When you write or edit Workflow, WorkflowTemplate, ClusterWorkflowTemplate or CronWorkflow manifests, call `argo_lint`
with their absolute paths. It runs offline by default: references between the given files are resolved, nothing is sent.
Fix every reported problem and lint again. Use `offline: false` only when the manifest references templates that exist
only in the cluster and the user agrees to send the manifest for validation.

## 3. Investigate a run

1. `argo_list` (filter by `status`, `selector` or `prefix`) to find the workflow.
2. `argo_get` to see every node with its phase and error message; `failedOnly: true` for large workflows. Parameter and
   artifact values are not shown; read them from the manifests in the project if needed.
3. `argo_logs` for the failed step: pass `pod` (the prefix of the log lines) and `container` when needed, and keep `tail`
   or `since` short. Values that look like passwords or tokens are masked.

Common causes to check: image pull errors and missing Secrets (node message), OOMKilled or exit code 137 (raise resource
limits), an unknown template or parameter (lint), RBAC errors of the workflow service account.

## 4. Changes go through a plan

1. Call the plan tool:
   - `argo_submit_plan` with `file` (an absolute path) or `from` (`workflowtemplate/<name>`,
     `clusterworkflowtemplate/<name>`, `cronworkflow/<name>`) and `parameters`. It runs a server-side dry run, so nothing
     is created.
   - `argo_stop_plan` with `mode: "stop"` (running nodes stop, exit handlers still run) or `mode: "terminate"` (no exit
     handlers). Prefer stop.
   - `argo_retry_plan` for a Failed or Error workflow; `restartSuccessful` with `nodeFieldSelector` to rerun chosen
     successful steps too.
2. Show the user the plan as it is: target, namespace, workflow names, entrypoint, service account, images, parameters,
   failed nodes, and every warning.
3. Call `argo_submit_apply`, `argo_stop_apply` or `argo_retry_apply` with the plan id **only after the user explicitly
   approves this plan**.
4. If the apply refuses because the file or template changed, or the workflow was recreated, retried or changed phase,
   make a new plan and show it again. A plan id works once; do not retry an apply in a loop.

## 5. When something fails

Report argo errors as they are. `Forbidden` means the account lacks permission; do not look for ways around RBAC.
Connection errors and expired tokens are fixed by the user. Never run `argo submit`, `stop`, `terminate`, `retry`,
`resubmit`, `delete` or `kubectl` commands through the terminal to bypass this flow.
