# Execution Flow

Use this guide when the user wants the power to actually run Ona CLI commands.

## Execution model

This power is a launcher, not a full orchestration agent.

Its supported execution path is:

1. run preflight checks
2. resolve the current repo to an Ona project if possible
3. rank and narrow candidate projects if there are multiple matches
4. explain readiness and the planned flow
5. ask for confirmation once for the agreed flow
6. run the flow
7. report the result and stop unless the user explicitly asks for the next step

It also supports a local repository-preparation path:

1. detect that the user wants Ona-ready setup rather than direct Ona launch
2. if the Ona CLI is missing, switch to local setup instead of blocking
3. use the canonical setup prompt to generate Dev Container and Ona config files
4. validate locally when practical
5. report what was prepared and what still requires Ona

## Safe preflight commands

These are safe to run automatically when NeuralBridge allows shell commands:

- `command -v ona`
- `ona whoami -o json`
- `git remote get-url origin`
- `ona project list --limit 1000 -o json`
- `ona environment list -a -o json`

These commands should be enough to detect:

- whether the CLI exists
- whether the user is logged in
- what repository is currently in scope
- whether an Ona project already exists for that repo
- which matching projects the user has recently used

## Confirmed side-effect commands

Only run these after the user explicitly confirms:

- `ona login`
- `ona login --no-browser`
- `ona project create <repo-url> --name <derived-name> ...`
- `ona environment create <project-id> --dont-wait --set-as-context --name <derived-name>`
- `ona environment start <environment-id> --set-as-context`
- `ona ai automation execute - --environment-id <environment-id>`
- `ona ai automation create <path-to-yaml>`
- `ona ai automation update <automation-id> <path-to-yaml>`
- `ona ai automation start <automation-id> --project <project-id>`

Command-template rules:

- validate flags against the live `--help` output or a known-good successful run before proposing them
- do not add `-o json` to commands that do not support it
- for `ona environment create`, prefer the plain command because it prints the environment ID directly
- after a failed command due to an invalid flag, correct the template in reasoning and continue without repeating the same bad shape

## Local setup flow

Use this flow when the user wants the repository prepared for Ona and the CLI is missing or not required yet.

Expected outputs:

- `.devcontainer/devcontainer.json`
- `.ona/automations.yaml`
- any minimal supporting files needed to make the setup work

Use the canonical setup prompt from Ona's “Automated dev environment setup” workflow rather than inventing a shorter ad hoc prompt.

Local validation should prefer:

- checking the generated files for obvious completeness and consistency
- project-specific sanity checks from the repository
- Ona-specific CLI validation only when the CLI is actually available

## Environment creation flow

When the current repo resolves to exactly one project:

1. explain that the project match was found
2. offer the exact `ona environment create` command
3. if environment creation is just the first step of an already approved create-and-run flow, do not ask again
4. run it after confirmation
5. report the environment ID or creation result

Default flags:

- `--dont-wait`
- `--set-as-context`
- `--name <derived-name>`

Do not automatically open the environment in an editor unless the user asks.

## One-off AI execution flow

Use this flow when the user wants Ona to take a goal or prompt and work on it, such as:

- "run the entire test suite overnight in Ona"
- "investigate this bug in Ona"
- "use Ona to fix this and raise a draft PR"

Suggested flow:

1. resolve or select the project
2. if this NeuralBridge session already created an environment for the task, reuse it
3. otherwise create a fresh environment for the current task
4. only use some other existing environment when the user explicitly asks for it
5. preserve the user's original request as the prompt payload
6. offer the exact `ona ai automation execute` command before running it
7. execute a one-off steps spec with an `agent.prompt` step against the environment
8. treat the run as a background handoff once Ona accepts it
9. report the identifiers and the environment details link
10. stop unless the user later asks for another action

Preferred command shape:

```bash
env_id="<environment-id>"
prompt_file="$(mktemp)"
spec="$(mktemp)"
log="$(mktemp)"
trap 'rm -f "$prompt_file" "$spec" "$log"' EXIT

# Write the original user request into $prompt_file using a safe file write.
# Do not inline raw prompt text into a fixed shell heredoc delimiter.

python3 - "$prompt_file" >"$spec" <<'PY'
import sys

prompt = open(sys.argv[1], encoding="utf-8").read().rstrip("\n")
print("- agent:")
print("    prompt: |")
for line in prompt.splitlines() or [""]:
    print(f"      {line}")
PY

ona ai automation execute "$spec" --environment-id "$env_id" >"$log" 2>&1 || true

agent_execution_id="$(grep -o 'agent_execution_id=[0-9a-f-]*' "$log" | head -1 | cut -d= -f2 || true)"

if [ -n "$agent_execution_id" ]; then
  echo "Task successfully handed off to agent."
  echo "Follow it anytime: https://app.ona.com/details/$env_id"
else
  cat "$log"
  exit 1
fi
```

Rules:

- do not replace the original user request with a repo task name
- prefer an ephemeral temp spec file outside the repo, or another equally safe transient mechanism
- do not keep one-off execution YAML in the repository after the handoff finishes
- do not leave one-off YAML behind in the repo unless the user explicitly wants to keep it
- do not embed raw prompt text into a fixed shell heredoc delimiter
- when temp files are used, always clean them up with `trap` even on failure
- do not inspect `.ona/automations.yaml` as part of one-off execution or recurring automation flows
- do not classify a one-off overnight request as recurring automation just because it is long-running
- if the environment was created with `--dont-wait`, be prepared to start or wait for it before launching the AI execution if needed
- do not scan `ona environment list` looking for any random running environment to reuse
- session-local reuse is good; cross-session reuse should be opt-in
- if the power proposes "create a fresh environment, then start the one-off AI execution" as one plan and the user says `yes`, `ok`, or equivalent, treat that as approval for the whole flow
- do not ask again between environment creation and AI execution unless:
  - the environment creation failed and the fallback plan changes materially
  - the selected project or environment changes
  - the prompt payload changes materially
- once the user has approved a create-and-run flow, do not pause for a second conversational confirmation before the execution step
- once `ona ai automation execute` emits an `agent_execution_id`, treat the handoff as successful even if later status polling hits `deadline_exceeded`
- do not automatically retry the same prompt after a polling timeout if the run was already accepted
- prefer saying "task handed off to Ona" over waiting in chat for the work to complete
- include the canonical Ona environment link in the handoff message: `https://app.ona.com/details/<environment-id>`
- wrap the command so raw CLI logs are captured and only a short success message is printed on handoff
- after handoff, do not poll for status, do not run environment-list checks, and do not invent follow-up commands such as `ona ai execution get`
- the correct post-handoff UX is to return quickly with the environment link, not to continue checking

## Multiple project match flow

When the repo matches multiple projects:

1. rank matches by:
   - exact repo match
   - recent personal usage from environments
   - stronger project signals like `usedBy.totalSubjects`, `automationsFilePath`, and `devcontainerFilePath`
   - project-name hints from the user's wording
   - clean names before throwaway names
   - fallback name order
2. if there are 2 to 10 matches, show all of them
3. if there are more than 10 matches, show the top 5 and state how many remain
4. support user follow-ups:
   - `show all`
   - `filter <text>`
   - `use <project-id>`
   - `use <project-name>`
5. only proceed once a single project is selected

Do not hard-truncate to 3 candidates.

Do not present the raw output of `ona project list` as the selection experience. Filter and rank in the shell first, then present only the repo-matching candidates.

Preferred rule:

- do not run `ona project list -o json` and then reason about the full blob in chat
- do not invent an alternative ranking method when the combined ranking command in `steering/login-and-readiness.md` is available
- do not split the ranking flow into assistant-managed temp files and a later parse step
- run a single shell ranking step that:
  - normalizes `git remote get-url origin`
  - filters projects to exact repo matches
  - joins recent environments from `ona environment list -a -o json`
  - sorts by recency, shared usage, Ona config signals, and name quality
- only present the filtered, ranked candidates to the user

If one project clearly dominates, such as:

- very recent personal usage
- much higher shared usage
- real Ona config present
- a canonical repo name like `Next`

then recommend that candidate first and explain why, while still allowing the user to override it.

## Project creation flow

Only offer project creation when:

- the current repo does not already match a project
- `.devcontainer/devcontainer.json` exists

Suggested flow:

1. explain that no matching project exists
2. explain that the repo appears ready because a devcontainer exists
3. offer the exact `ona project create` command
4. ask for confirmation
5. if project creation succeeds, offer environment creation as the next step

If the repo lacks a devcontainer, stop and explain why project creation is not being offered automatically.

## AI automation flow

Use this flow when the user wants to create, update, or start an Ona AI automation.

Suggested flow:

1. resolve or select the project context
2. if needed, list existing AI automations with `ona ai automation list -o json`
3. write the AI automation YAML specification into `.ona/ai-automations/<slug>.yaml`
4. match existing AI automations by exact automation name plus the selected project ID in trigger context
5. if exactly one automation matches, treat the request as an update
6. if no automations match, treat the request as a create
7. if multiple automations match, show the candidates and ask the user which one to update
8. offer the exact `ona ai automation create <path-to-yaml>`, `ona ai automation update <automation-id> <path-to-yaml>`, or `ona ai automation start <automation-id> --project <project-id>` command
9. ask for confirmation before running it

Rules:

- recurring, scheduled, PR-triggered, and webhook-triggered requests should use this flow
- do not route these requests to `.ona/automations.yaml`
- `.ona/automations.yaml` is for per-environment tasks and services, not for the Automations product
- if a one-off run proves useful and the user wants repetition, promote it into an AI automation definition under `.ona/ai-automations/`
- prefer file-based `ona ai automation create` and `ona ai automation update` over stdin for recurring workflows
- do not silently create duplicate automations when an exact name-and-project match already exists
- after create or update succeeds, return the automation definition link: `https://app.gitpod.io/automations/<automation-id>#definition`

## Reporting rules

After a command runs:

- report whether it succeeded
- include the most useful identifier, such as project ID, environment ID, or task execution ID
- tell the user the next available action

For AI automation create or update specifically:

- say the automation was created or updated successfully
- include the automation definition link and stop
- keep the user-facing summary minimal, for example: `Automation created successfully. Open it anytime: https://app.gitpod.io/automations/<automation-id>#definition`
- if the YAML was saved in the repo, mention the saved path briefly

For one-off AI execution specifically:

- if the output includes `agent_execution_id`, report that the task was handed off to Ona
- include the environment details link and stop
- keep the user-facing summary minimal, for example: `Test successfully handed off to agent. Follow it anytime: https://app.ona.com/details/<environment-id>`
- only surface `environment_id` or `agent_execution_id` when the user explicitly asks for debugging detail
- do not frame a post-handoff polling timeout as total failure

If a command fails:

- summarize the failure clearly
- do not claim that Ona itself is broken unless the error shows that
- fall back to the structured response contract and the shortest recovery path
