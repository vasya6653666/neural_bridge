---
name: "terraform-practices"
description: "Conventions for writing Terraform and OpenTofu code: project layout, root and child modules, version pinning, variables and outputs, state and secrets, naming, refactoring with moved blocks. Use when creating a new configuration, adding resources or modules, or reviewing .tf code."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Terraform / OpenTofu practices

Follow the existing style of the project first. Where the project is silent, use these rules.

## Layout

- One root module per environment or stack (`envs/prod`, `envs/staging`, or `stacks/<name>`). Shared code goes into child
  modules under `modules/<name>/`.
- Inside a module: `main.tf` (resources), `variables.tf`, `outputs.tf`, `versions.tf` (`terraform` block and
  `required_providers`), optional `locals.tf` and `data.tf`. Large modules may split `main.tf` by topic.
- A child module never configures providers or backends; the root module does.

## Versions

- Pin the core version range in `required_version` (for example `>= 1.6, < 2.0`).
- Pin every provider in `required_providers` with a source and a `~>` constraint. Commit `.terraform.lock.hcl`; never
  commit `.terraform/`.
- Pin module sources from a registry with `version`, from git with `?ref=<tag>`.

## Variables and outputs

- Every variable has `type` and `description`; add `validation` blocks for values with rules (CIDRs, name formats, enums).
- Prefer object types over many loose variables for one concern. Give defaults only to values that are safe everywhere.
- Mark secrets `sensitive = true`, both variables and outputs. Do not output secrets unless another stack really reads them.
- Outputs describe what other stacks or people need (IDs, endpoints), each with a `description`.

## State and secrets

- Remote state with locking for anything shared; never keep `terraform.tfstate` in git.
- State contains secrets in plain text: restrict access to the backend and do not paste state into chat.
- Do not hard-code credentials in `.tf` or `.tfvars`; take them from the environment or a secret store. Keep secret
  `.tfvars` files out of git.

## Resources

- Names: `snake_case`, describing the role (`logs`, `web`), not the type (`bucket1`). Use `this` when a module creates one
  resource of a type.
- `for_each` over maps or sets of strings for collections; `count` only for on/off switches. Keys of `for_each` must be
  stable, otherwise resources are recreated.
- Tag or label resources consistently through provider default tags or a `locals` map.
- Use `lifecycle { prevent_destroy = true }` on data stores the user cannot afford to lose.

## Refactoring without recreating

- Renaming a resource or moving it into a module: add a `moved` block instead of letting the plan destroy and create.
- Bringing an existing object under management: an `import` block with the real ID, then plan until it shows no changes.
- Removing from management without destroying: a `removed` block with `lifecycle { destroy = false }`.

After any of these, run the workflow from the `terraform-workflow` skill and check that the plan shows no `delete` or
`replace` for the refactored resources.
