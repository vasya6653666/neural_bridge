# Repo Readiness

Use this guide when the user wants to offload work to Ona and repository setup may affect project matching or project creation.

## What to check conceptually

For this CLI-backed version, only mention readiness items that matter to the requested task.

Possible checks:

- Does the repository already match an existing Ona project?
- Does the repository have enough setup to run meaningful work in Ona?
- Is there a Dev Container or equivalent environment definition?
- Does the task require shared project configuration?
- Is this a recurring workflow that would benefit from automation config?
- Does the repo benefit from AGENTS.md or MCP config for better context?

## How to talk about setup gaps

Be specific and scoped.

Good:

- `Additional setup needed`: This task will likely work better once the repository has a Dev Container so Ona starts with the right tools and services.
- `Additional setup needed`: If you want this to run on a schedule, add the relevant Ona automation configuration after validating the prompt as a one-off task first.
- `Additional setup needed`: No Ona project currently matches this repository, so I need to create one before I can launch an environment.

Avoid:

- broad setup dumps
- long checklists that are unrelated to the user's exact request

## Suggested guidance by workflow

### One-off implementation work

Mention:

- Ona login if needed
- Git auth if clone/push/PR behavior is expected
- project match if one exists
- Dev Container only if missing setup is likely to block project creation or execution

### Automation work

Mention:

- validate the task as a one-off first when practical
- shared project configuration if the automation will run repeatedly
- automation config path only when the user is explicitly moving toward recurring work

### Integration-backed work

Mention:

- only the specific integration needed for the task
- do not turn an integration gap into a generic Ona readiness failure

## Guidance tone

Treat repo setup as an accelerator, not a moral judgment.

If the repo is not fully ready, the power should still help the user by:

- identifying the smallest missing piece
- explaining why it matters
- preserving a usable handoff prompt whenever possible

## Automatic project-creation rule

Only offer automatic project creation when:

- no existing Ona project matches the current repo
- `.devcontainer/devcontainer.json` exists

If the devcontainer file is missing, do not offer `ona project create` as the default next step. Explain that the repo is not ready for automatic project creation yet.
