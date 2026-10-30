---
name: "openfaas-workflow"
description: "Safe order of work on OpenFaaS functions with the faas_* tools: detect faas-cli and the gateway, inspect functions and logs, build locally, plan a deployment of a stack file, show the plan to the user, deploy only the reviewed plan, plan removals separately. Use whenever the user asks to check, build, deploy or remove OpenFaaS functions."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---

# OpenFaaS workflow

The power's MCP server runs `faas-cli` on the user's machine. The gateway comes only from the `OPENFAAS_URL` environment
variable, and authentication is the user's own `faas-cli login`. Paths passed to tools are **absolute**. Work in this
order.

## 1. Find out where you are

Call `sls_detect`. It reports the faas-cli version, the gateway origin, the default function namespace and whether a
saved login exists for this gateway.

- If faas-cli is not found, tell the user to install faas-cli 0.18.9 or newer, or to set `NB_SLS_FAAS` to its path and
  restart the IDE. Do not download it yourself. An older version is reported with a warning: the list, describe and plan
  tools need 0.18.9.
- If the gateway is not the one the user means, ask them to set `OPENFAAS_URL` and restart the IDE. Never ask for the
  gateway password; if the gateway needs a login and none is saved, the user runs `faas-cli login` in their own terminal.

## 2. Look before you change

- `faas_list` for the overview: image, ready and desired replicas, invocations.
- `faas_describe` for one function: status, image, environment variable names, secret names, labels, resources.
- `faas_logs` with `lines` or `since` to see what a function printed recently.

Environment values and annotation values are hidden by the server. Never ask the user to paste them into the chat.

## 3. Build

`faas_build` builds images locally with the user's container engine. This runs the Dockerfile and build steps of the
project, pulls base images and may download templates; say so before the first build and ask when the project is not the
user's own. Use `shrinkwrap: true` to only generate the build contexts in `./build` (nothing is built), and
`noTemplatePull: true` when the user wants no downloads. The build does not push images: pushing to a registry is the
user's step, outside this server.

## 4. Plan, show, then deploy

1. Call `faas_deploy_plan` with the stack file (`file`), and `filter` or `namespace` only when the user asks for them.
2. Show the user the plan per function: created or updated, the image change, environment variables added, changed or
   removed (by name), secrets, labels, resources. Point out removed environment variables and secrets, and anything the
   user did not ask for.
3. Make sure the images in the plan exist in a registry the cluster can pull from; the deploy does not build or push.
4. Call `faas_deploy_apply` with the plan id **only after the user explicitly approves this plan**.
5. If it refuses because a file, the gateway or a function changed, make a new plan and show it again. A plan id works
   once; do not retry in a loop.

After deploying, call `faas_describe` for each function and report whether it became ready; on problems read
`faas_logs`.

If the stack file sets `provider.gateway` to another gateway, the plan is refused: ask the user whether to set
`OPENFAAS_URL` to that gateway or to remove the line from the file. Do not edit the gateway in the file on your own.

## 5. Removing

Call `faas_remove_plan` with the function names and show the user the list it returns. Call `faas_remove_apply` only after
the user approves that list. If a function changed or was recreated in between, the server refuses; plan again.

## 6. When something fails

Report faas-cli errors as they are. `unauthorized` means the saved login is missing or expired: the user runs
`faas-cli login`. Connection errors mean the gateway is not reachable from this machine (port-forward, VPN): ask the user to
fix it, then repeat the read.

Never run `faas-cli deploy`, `remove`, `up`, `secret` or `login` through the terminal to bypass this flow.
