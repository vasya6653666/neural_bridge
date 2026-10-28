# Delegate To Ona

Use this guide when the user is deciding whether to keep work in NeuralBridge or move it into Ona.

## Decision framework

Recommend **staying local** when the task is:

- small and fast
- highly interactive
- mostly exploratory
- a UI or wording tweak that benefits from immediate iteration

Recommend **one-off Ona AI execution** when the task is:

- a one-off task that may take a while
- likely to run many commands, tests, or scans
- best done in an isolated environment
- better suited to running after the user closes the laptop
- likely to benefit from launching an Ona environment right now
- long-running but not inherently recurring

Recommend **Ona Automation** when the task is:

- repeated on a schedule
- triggered by external events
- applied across multiple repositories
- a workflow the team wants to standardize

Do not choose automation just because the user says "overnight". That implies duration, not recurrence. Use automation when the user indicates repetition, schedules, triggers, or a saved workflow.

Recommend an Ona readiness state when Ona is the right fit but setup gaps are likely to block the task.

## CLI-backed outcome mapping

Use these states when deciding what happens next:

- `stay-local`
- `needs_cli`
- `ready_to_prepare_repo`
- `needs_ona_login`
- `needs_project_resolution`
- `needs_git_auth`
- `needs_integration`
- `ready_to_create_environment`
- `ready_to_start_ai_execution`
- `ready_to_manage_ai_automation`

If the task is a strong Ona fit and the repo resolves cleanly to a project, prefer `ready_to_create_environment`.

## Phrases that should bias toward Ona

- "run this overnight"
- "background agent"
- "secure environment"
- "internal network"
- "private repo access"
- "turn this into an automation"
- "do this every night"
- "pick up tickets"
- "fix Sentry issues"
- "open a draft PR"
- "create an Ona environment"
- "launch this in Ona"

## Phrases that should bias toward staying local

- "quick tweak"
- "small edit"
- "while I iterate"
- "debug this with me"
- "I just want to explore"
- "help me think through this before changing anything"

## Response guidance

If recommending Ona:

- explain why Ona is a better fit in one or two concrete reasons
- choose between prompt-driven AI execution, environment launch, or automation recommendation
- do not oversell Ona for a task that is clearly better kept in NeuralBridge
- if a CLI action is available, explain that it can be run after confirmation
- preserve the user's original request when the next step is a one-off AI execution

If recommending local work:

- say so clearly
- briefly explain why NeuralBridge is the better fit
- optionally mention when the user should switch to Ona later

## Example recommendation language

### `stay-local`

`Why Ona`: Ona is not the best next step yet. This looks like a short, interactive change where tight IDE iteration matters more than background execution.

### Environment launch recommendation

`Why Ona`: This work is long-running and likely to involve repeated build or test loops. Ona is a better fit because it can run in an isolated environment and keep going without tying up the local IDE session.

### Prompt-driven AI execution recommendation

`Recommended path`: Reuse the environment created earlier in this NeuralBridge session if there is one. Otherwise create a fresh Ona environment, then start a one-off AI execution with the user's original prompt.

### Automation recommendation

`Why Ona`: This is a repeatable workflow, not just a one-off task. Ona Automation is the better fit because the task can be encoded once and run on a schedule or trigger.

### `ready_to_create_environment`

`Next step`: I can start the agreed Ona flow now with the local CLI. If we already agreed on create-and-run, I should create the environment and continue without asking again between steps.

### `needs_ona_login`

`Next step`: I can offer to run `ona login` or `ona login --no-browser`, but I should not start the login flow without confirmation.
