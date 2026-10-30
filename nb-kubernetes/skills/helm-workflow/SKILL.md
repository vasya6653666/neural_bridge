---
name: "helm-workflow"
description: "Safe order of work with Helm charts and releases through the helm_* tools: list and inspect releases, lint and render a local chart, plan an upgrade or install with a server-side dry run, show added, changed and removed objects, run only the reviewed upgrade. Use when the user works with a Helm chart or asks to install or upgrade a release."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# Helm workflow

The `helm_*` tools run Helm on the user's machine and need Helm 3.13 or newer. If `k8s_detect` says Helm is not found,
tell the user to install it or to set `NB_K8S_HELM` to its path and restart the IDE; do not install it yourself. Charts are
**local**: an absolute path to a chart directory or a packaged `.tgz`. Values files are absolute paths too.

## 1. Know the release

- `helm_list` (with `namespace` or `allNamespaces`) shows releases, revisions and status.
- `helm_status` shows one release: revision, status, chart version and notes. Release values are not shown; if you need
  them, read the values files in the project instead of asking the user to paste them.

## 2. Check the chart locally

1. `helm_lint` with the same values files the release uses. Fix every `[ERROR]` and lint again; mention warnings.
2. `helm_template` to see what the chart renders. Secret values and container environment values are masked in the output.

If rendering fails because dependencies are missing from `charts/`, ask the user to run `helm dependency build` for the
chart; the server does not download dependencies.

## 3. Plan the upgrade

Call `helm_upgrade_plan` with the release name, the chart, the values files and the namespace. It runs a server-side dry
run, so nothing in the cluster changes. Confirm the context with the user first (see the `kubernetes-workflow` skill).

Show the user the summary as it is:

- the counts, then every `remove` line first: those objects will be deleted by the upgrade;
- changed objects and what changed in them (image tags, replicas, resources, new or removed environment variables);
- hooks that will run (for example migration Jobs before the upgrade);
- whether it is a new install, and whether `createNamespace` is set.

## 4. Run only the reviewed upgrade

Call `helm_upgrade_apply` with the plan id **only after the user explicitly approves this plan**. The server refuses when
the chart or values files changed, the context points elsewhere, or the release moved to another revision since the plan;
in that case plan again and show the new summary. A plan id works once.

If the upgrade fails, report the error and the release status from `helm_status`. Do not run `helm rollback` or
`helm uninstall` through the terminal without the user's explicit request.
