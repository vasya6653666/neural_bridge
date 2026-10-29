---
name: "terraform-workflow"
description: "Safe order of work on a Terraform or OpenTofu project with the iac_* tools: detect the binary and root modules, format, validate, plan, show the summary to the user, apply only the reviewed plan. Use whenever the user asks to check, change, plan or deploy infrastructure described in .tf files."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Terraform / OpenTofu workflow

The power's MCP server runs `terraform` or `tofu` on the user's machine. Every tool takes `dir`: the **absolute** path of a
root module (a directory with `.tf` files where `init` is run). Work in this order.

## 1. Find out what you are working with

Call `iac_detect` with the workspace root as `dir`. It reports the binary and version and lists directories with `.tf`
files. If several directories are listed, decide which ones are root modules (they usually have a `backend`, `provider`
blocks or `.tfvars` next to them; folders under `modules/` are usually child modules) and ask the user when it is not
clear which environment they mean.

If neither binary is found, tell the user to install Terraform or OpenTofu, or to set `NB_IAC_BINARY` to the binary path and
restart the IDE. Do not try to download a binary yourself.

## 2. Edit, then format and validate

After changing `.tf` files:

1. `iac_fmt` with `write: true` — canonical formatting (only local files change).
2. `iac_validate` — syntax, types, references, provider schemas. Fix every error it reports, with the file and line it gives,
   and validate again until it says the configuration is valid. Warnings are worth mentioning to the user.

`iac_validate` runs `init -backend=false`: it downloads providers but does not touch remote state.

## 3. Plan

Call `iac_plan`. It runs a real `init` and `plan` with the user's backend and credentials and changes nothing in the
infrastructure. Pass `varFiles` when the project uses `.tfvars` per environment. Use `targets` only when the user asks
for it: a targeted plan leaves the rest of the configuration out of sync.

Errors at this step are usually about credentials, backend access or a state lock. Report them as they are; do not
retry in a loop and never suggest `force-unlock` unless the user confirms nobody else is running Terraform.

## 4. Show the plan and get approval

Show the user the summary from `iac_plan` as it is: counts first, then the list. Call out every `delete` and `replace`
line explicitly and explain why the resource is replaced when the summary gives a reason. If the plan contains more
than the user asked for, say so and stop: unexpected changes usually mean drift or a mistake in the edit.

## 5. Apply only the reviewed plan

Call `iac_apply_plan` with the plan id **only after the user explicitly approves this plan**. It applies exactly the saved
plan, so nothing that the user has not seen can be applied. A plan id works once. If the apply fails because the plan is
stale (state changed since planning), run `iac_plan` again and repeat step 4.

Never run `terraform apply`, `destroy` or `state` commands through the terminal to bypass this flow.
