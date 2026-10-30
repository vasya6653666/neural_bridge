---
name: "knative-workflow"
description: "Safe order of work on Knative services with the kn_* tools: detect kn and the kubeconfig context, confirm the target, inspect services and revisions, plan a deployment, show the declaration and the changes to the user, apply only the reviewed plan, plan deletions separately. Use whenever the user asks to check, deploy, update, scale or delete a Knative service."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Knative workflow

The power's MCP server runs `kn` on the user's machine with the user's kubeconfig. Work in this order.

## 1. Find out where you are

Call `sls_detect`. It reports whether `kn` is installed, its version, the current kubeconfig context with its namespace,
and all contexts.

- Before anything that changes the cluster, say which context and namespace you are going to use, and get the user's
  confirmation when more than one context exists or the name suggests production. Pass `context` and `namespace`
  explicitly from then on.
- If `kn` is not found, tell the user to install the Knative CLI or to set `NB_SLS_KN` to its path and restart the IDE.
  Do not try to download it yourself.
- If no current context is set, ask the user which context to use; do not switch contexts for them.

## 2. Look before you change

- `kn_service_list` for the overview: URL, latest ready revision and the Ready condition of every service.
- `kn_service_describe` for one service: why it is not ready (reason and message), image, concurrency, autoscaling,
  traffic split.
- `kn_revision_list` with `service` to see which revisions exist and which image each one runs.

Environment values are hidden by the server; only names and Secret or ConfigMap references are shown. Never ask the user to
paste secret values into the chat.

## 3. Plan, show, then apply

1. Call `kn_deploy_plan` with `name` and `image`, plus only the settings the user asked for: `env` (non-secret values only),
   `envValueFrom` / `envFrom` for values that live in a Secret or ConfigMap, `envRemove`, `scale` (for example `"0..5"`
   to allow scale to zero), `concurrencyLimit`, `port`.
2. Secrets never go into `env`. If the user needs a new secret value, ask them to create the Kubernetes Secret themselves
   (or with the Kubernetes tools they use), then reference it with `envValueFrom` or `envFrom`. The server refuses literal
   values that look like secrets.
3. If the plan says there are no changes, stop: there is nothing to apply.
4. Show the user the list of changes and the declaration. Point out a changed image, removed environment variables, new
   Secret references, scale bounds and anything the user did not ask for. For an existing service a new revision is
   created; traffic follows the latest revision unless the service pins traffic to named revisions.
5. Call `kn_deploy_apply` with the plan id **only after the user explicitly approves this plan**.
6. If it refuses because the service, the context or the saved declaration changed, make a new plan and show it again.
   A plan id works once; do not retry an apply in a loop.

After applying, call `kn_service_describe` and report whether the new revision became ready. If it did not, show the reason
from the conditions and the revision list; do not roll back or redeploy without the user's decision.

## 4. Deleting

Call `kn_delete_plan` and show the user what it lists: the service is deleted together with all its revisions and routes.
Call `kn_delete_apply` only after the user approves. If the service was recreated in between, the server refuses; plan
again.

## 5. When something fails

Report kn errors as they are. `forbidden` means the user's account lacks the permission; do not look for ways around RBAC.
Connection errors and expired credentials are fixed by the user (VPN, login to the cluster); ask them to do it and then
repeat the read. A service that never becomes ready usually has an image pull error, a crashing container or a failing
readiness probe: the conditions say which.

Never run `kn service create`, `update`, `apply` or `delete`, or `kubectl` on Knative objects, through the terminal to
bypass this flow.
