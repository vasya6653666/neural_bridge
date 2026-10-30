---
name: "kubernetes-workflow"
description: "Safe order of work on a Kubernetes cluster with the k8s_* tools: detect kubectl and contexts, confirm the target context, inspect objects, diff manifests, show the diff to the user, apply only the reviewed plan, plan deletions separately. Use whenever the user asks to check, deploy, change or delete anything in a cluster."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Kubernetes workflow

The power's MCP server runs `kubectl` on the user's machine with the user's kubeconfig. Paths passed to tools are
**absolute**. Work in this order.

## 1. Find out where you are

Call `k8s_detect`. It reports the kubectl version, whether Helm is available, the current context and all contexts.

- Before anything that changes the cluster, say which context you are going to use and get the user's confirmation when
  more than one context exists or the context name suggests production. Pass `context` explicitly from then on.
- If kubectl is not found, tell the user to install kubectl or to set `NB_K8S_KUBECTL` to its path and restart the IDE.
  Do not try to download it yourself.
- If no current context is set, ask the user which context to use; do not run `kubectl config use-context` for them.

## 2. Look before you change

- `k8s_get` for the overview (`kind: "pods"`, `"deploy,svc"`, a label `selector`, `allNamespaces` for a wide search).
- `k8s_describe` for one object: conditions, image, probes, recent events.
- `k8s_events` with `warningsOnly: true` for what went wrong recently; with `kind` and `name` for one object.
- `k8s_logs` for a pod or `deploy/<name>`; use `previous: true` for a container in `CrashLoopBackOff`, and `since` or
  `tail` to keep the output short.

Secret values are masked by the server. Never ask the user to paste Secret values or kubeconfig contents into the chat,
and do not try to read them another way (for example with `kubectl get secret -o yaml` in a terminal).

## 3. Diff, show, then apply

1. Edit the manifests, then call `k8s_diff_plan` with the manifest files or directories (`files`, `recursive` for
   subfolders) or a kustomization directory (`kustomize`). Pass `namespace` when the manifests do not set one.
2. If it reports no differences, stop: there is nothing to apply.
3. Show the user the list of objects and the diff. Point out created objects, changed images, replica counts, resource
   limits, and anything the user did not ask for: unexpected changes usually mean drift or a mistake in the edit.
4. Call `k8s_apply_plan` with the plan id **only after the user explicitly approves this diff**.
5. If it refuses because files changed or the context points elsewhere, make a new plan and show it again. A plan id works
   once; do not retry an apply in a loop.

`kubectl apply` here never prunes: an object whose manifest you removed stays in the cluster. Remove it with the deletion
flow below.

## 4. Deleting

Call `k8s_delete_plan` with a `name` or a `selector` and show the user the exact list it returns, including every warning
(Namespaces, CustomResourceDefinitions and volumes delete more than themselves). Call `k8s_delete_apply` only after the
user approves that list. If objects were recreated in between, the server refuses; plan again.

## 5. When something fails

Report kubectl errors as they are. `Forbidden` means the user's account lacks the permission; do not look for ways around
RBAC. Connection errors and expired credentials are fixed by the user (VPN, login to the cluster); ask them to do it and
then repeat the read.

Never run `kubectl apply`, `delete`, `edit`, `patch`, `scale` or `rollout` through the terminal to bypass this flow.
