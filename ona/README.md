# Offload to Ona

`Offload to Ona` is a custom NeuralBridge power that helps users decide when work should move from the IDE into Ona, checks local readiness, resolves the current repository to an Ona project, and launches the next step with the Ona CLI after explicit confirmation.

This version is intentionally scoped:

- automatic local detection when command execution is available
- project-first matching against existing Ona projects
- ranked project selection for repositories with many matching projects
- local Dev Container and Ona config preparation even when the Ona CLI is missing
- confirmed CLI-backed login, project creation, environment creation, one-off AI execution, and AI automation create/update/start flows
- no MCP server requirement
- optional local checks for `command -v ona`, `ona whoami -o json`, `git remote get-url origin`, and `ona project list --limit 1000 -o json`
- browser-first fallback when CLI checks are unavailable

## What it does

The power is designed for requests like:

- "Run this overnight in Ona"
- "This needs private network access. Should we move it to Ona?"
- "Turn this cleanup into an automation"
- "Pick up this Linear ticket in Ona"
- "Use Ona to fix this and raise a draft PR"

For matching requests, it classifies the task into one of these execution states:

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

For every offload recommendation, it returns:

- `Why Ona`
- `Recommended path`
- `Readiness`
- `Next step`
- `Ona prompt`
- `Additional setup needed`

## What the power may execute

The power separates commands into two classes.

### Safe preflight commands

These are used for detection and project resolution when NeuralBridge allows command execution:

- `command -v ona`
- `ona whoami -o json`
- `git remote get-url origin`
- `ona project list --limit 1000 -o json`
- `ona environment list -a -o json`
- `ona ai automation list -o json`

### Confirmed side-effect commands

These require explicit user confirmation before the power runs them:

- `ona login`
- `ona login --no-browser`
- `ona project create <repo-url> ...`
- `ona environment create <project-id> --dont-wait --set-as-context ...`
- `ona environment start <environment-id> --set-as-context`
- `ona ai automation execute - --environment-id <environment-id>`
- `ona ai automation create <path-to-yaml>`
- `ona ai automation update <automation-id> <path-to-yaml>`
- `ona ai automation start <automation-id> --project <project-id>`

This version does **not** run arbitrary `ona environment exec` commands or write automation config into environments.

Command-template rule:

- use flags only when the specific command supports them
- do not assume `-o json` works on `ona environment create`
- when a command already prints the needed identifier directly, prefer the plain command over adding formatting flags

## Prompt-driven execution

For one-off requests like "run the entire test suite overnight in Ona", the power should:

1. resolve or select the Ona project
2. prefer the environment created earlier in the current NeuralBridge session, otherwise create a fresh environment
3. preserve the user's original request as the AI prompt
4. run a one-off AI execution against that environment

The intended wrapped command shape for clean UX is:

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

Reporting rule for one-off runs:

- this is a background handoff, not a foreground task runner
- if `ona ai automation execute` emits an `agent_execution_id`, treat the run as successfully handed off even if the CLI later times out while polling for status
- do not immediately retry the same prompt after a `deadline_exceeded` polling failure if the agent execution was already started, because that can create duplicate runs
- once the run is handed off, stop and respond immediately with the environment link
- use the canonical Ona app URL for the environment link: `https://app.ona.com/details/<environment-id>`
- do not issue follow-up status commands automatically after handoff
- do not try commands such as `ona ai execution get`; this power should not invent post-handoff status-check commands
- do not dump the raw CLI logs back into chat on success
- do not include `environment_id` or `agent_execution_id` in the user-facing summary unless the user explicitly asks for them
- do not embed raw prompt text inside a fixed shell heredoc delimiter
- when temp files are used, clean them up with `trap` so failures do not leave prompt or log files behind

This is different from:

- `ona ai automation start`, which starts a saved automation definition
- `.ona/automations.yaml`, which configures per-environment tasks and services rather than the Automations product

The power should not use `.ona/automations.yaml` task execution to satisfy user-facing requests like "make this an automation", "run this every day", or other scheduled/background workflow asks.

Environment reuse policy for one-off runs:

- if this NeuralBridge session already created an environment for the task, reuse that environment unless the user asks otherwise
- if this NeuralBridge session did not create one, prefer creating a fresh environment over attaching to some unrelated running environment
- only reuse an older or externally created environment when the user explicitly asks to use that environment or names its ID

For one-off runs, that YAML should be treated as temporary execution input:

- prefer an ephemeral temp file outside the repo, or another equally safe transient mechanism
- do not keep one-off execution YAML in the repository
- do not create `.ona/*.yaml` in the repo for a one-off prompt unless the user explicitly asks to keep it

For repeatable workflows, the power should save AI automation definitions as code in the repository before creating or updating them in Ona.

## Recurring automation requests

For requests like "make this an automation" or "run this every day at 3pm", the power should always route to the AI Automations product, not `.ona/automations.yaml`.

Preferred CLI primitives:

- `ona ai automation list -o json` to discover existing AI automations
- `ona ai automation create <path-to-yaml>` to create a new AI automation from a repo-stored YAML file
- `ona ai automation update <automation-id> <path-to-yaml>` to update an existing AI automation from a repo-stored YAML file
- `ona ai automation start <automation-id> --project <project-id>` to manually start an existing AI automation

Important distinction:

- AI Automations are cross-run background workflows with manual, scheduled, PR, or webhook triggers
- `.ona/automations.yaml` is for per-environment tasks and services such as bootstrapping, servers, and manual commands inside an environment
- if the user asks for a recurring workflow, the power should never inspect or edit `.ona/automations.yaml` as the primary solution

Preferred repo convention for AI automation definitions:

- store them under `.ona/ai-automations/`
- use a stable file name derived from the automation purpose, for example `.ona/ai-automations/daily-full-test-suite.yaml`
- create or update the Ona automation from that saved file, not from stdin
- choose update versus create deterministically:
  - list existing AI automations first
  - match by exact automation name plus the selected project ID in trigger context
  - if exactly one automation matches, update it
  - if no automations match, create a new one
  - if multiple automations match, show the candidates and ask the user which one to update
- do not silently create duplicate automations when an exact name-and-project match already exists
- once created, return the automation definition link:
  - `https://app.gitpod.io/automations/<automation-id>#definition`

## No-CLI setup behavior

If the Ona CLI is missing, the power should still help when the user wants to make the repository Ona-ready.

In that case, it should:

- if the user wants direct Ona execution or AI Automations, first recommend installing the CLI:
  - `brew install gitpod-io/tap/ona`
  - or follow the official setup docs: `https://ona.com/docs/ona/integrations/cli`
- switch from “launch Ona” to “prepare the repo”
- generate or update:
  - `.devcontainer/devcontainer.json`
  - `.ona/automations.yaml`
- use the canonical setup prompt from Ona's existing “Automated dev environment setup” workflow

This means a missing CLI should not block repository setup work.

## Installation

Install the power from the **Powers** panel in NeuralBridge IDE.

## How it shows up in NeuralBridge

- After installation, the power appears in the **Powers** panel.
- Auto-activation depends on the keywords in `POWER.md`.

## NeuralBridge shell approvals

This power uses NeuralBridge's normal shell-command approval flow.

Expected behavior:

- NeuralBridge may ask the user to approve preflight checks
- mutating Ona CLI flows should only be run after the user explicitly confirms the plan
- users do not need to grant broad wildcard trust for this version to work

Recommended approach:

- approve preflight commands as prompted
- after the power proposes a short multi-step plan, one user confirmation should cover the agreed flow unless something materially changes

## Login and setup expectations

This power treats readiness as three separate concerns.

### 1. Ona login

Preferred paths:

- browser: [app.ona.com](https://app.ona.com)
- CLI: `ona login`
- no-browser CLI: `ona login --no-browser`
- PAT fallback: `ona login --token <token>`

PATs can be created at:

- [app.ona.com/settings/personal-access-tokens](https://app.ona.com/settings/personal-access-tokens)

### 2. Git provider authentication

This is separate from Ona login. It is required for:

- cloning repositories
- pushing commits
- opening pull requests from Ona work

Relevant page:

- [app.ona.com/settings/git-authentications](https://app.ona.com/settings/git-authentications)

### 3. Optional integrations

Only needed when the task depends on them:

- Linear
- Sentry
- Notion

Users can manage integrations in Ona settings:

- [app.ona.com/settings/org-integrations](https://app.ona.com/settings/org-integrations)

## Project-first behavior

When a Git repository is available, the power should prefer an existing Ona project over a raw repository URL.

The intended flow is:

1. detect the current `origin` remote
2. normalize the remote URL
3. fetch the full project set with `ona project list --limit 1000 -o json`
4. derive recent personal project usage from `ona environment list -a -o json` when possible
5. use the matching project when there is exactly one match
6. show all matches when there are up to 10
7. show a ranked top 5 plus a path to show all when there are more than 10
8. offer project creation only when there is no match and the repo appears Ona-ready

Non-negotiable rule:

- do not let NeuralBridge infer project selection from raw `ona project list` output alone
- always run the combined ranking step below before presenting project choices
- prefer the one-command shell form below; do not split the project JSON and environment JSON into NeuralBridge-managed temp files for a later Python step

Preferred shell recipe for project selection:

```bash
repo_url="$(git remote get-url origin)"
python3 - <<'PY' "$repo_url" \
  <(ona project list --limit 1000 -o json) \
  <(ona environment list -a -o json)
import json, sys

repo_url, projects_path, envs_path = sys.argv[1:4]

def normalize_git_url(url: str) -> str:
    url = url.strip()
    if url.startswith("git@github.com:"):
        url = "https://github.com/" + url[len("git@github.com:"):]
    if url.endswith(".git"):
        url = url[:-4]
    return url.lower().rstrip("/")

def looks_throwaway(name: str) -> bool:
    lowered = name.lower()
    bad_terms = ["do-not-open", "test", "testing", "delete", "ignore", "scratch"]
    return any(term in lowered for term in bad_terms)

repo_key = normalize_git_url(repo_url)
projects = json.load(open(projects_path))
envs = json.load(open(envs_path))

recent_by_project = {}
for env in envs:
    project_id = env.get("projectId") or env.get("metadata", {}).get("projectId")
    if not project_id:
        continue
    meta = env.get("metadata", {})
    ts = meta.get("lastStartedAt") or meta.get("createdAt") or ""
    if ts and ts > recent_by_project.get(project_id, ""):
        recent_by_project[project_id] = ts

matches = []
for project in projects:
    remotes = []
    for spec in project.get("initializer", {}).get("specs", []):
        git = spec.get("git", {})
        remote = git.get("remoteUri")
        if remote:
            remotes.append(normalize_git_url(remote))
    if repo_key not in remotes:
        continue

    meta = project.get("metadata", {})
    name = meta.get("name", "")
    project_id = project.get("id", "")
    used_by = project.get("usedBy", {}).get("totalSubjects", 0)
    has_config = int(bool(project.get("automationsFilePath"))) + int(bool(project.get("devcontainerFilePath")))
    last_used = recent_by_project.get(project_id, "")
    penalty = 1 if looks_throwaway(name) else 0
    matches.append({
        "id": project_id,
        "name": name,
        "last_used": last_used,
        "used_by": used_by,
        "has_config": has_config,
        "penalty": penalty,
    })

matches.sort(key=lambda m: m["name"].lower())
matches.sort(key=lambda m: m["has_config"], reverse=True)
matches.sort(key=lambda m: m["used_by"], reverse=True)
matches.sort(key=lambda m: m["last_used"], reverse=True)
matches.sort(key=lambda m: bool(m["last_used"]), reverse=True)
matches.sort(key=lambda m: m["penalty"])

print(f"repo={repo_key}")
print(f"matches={len(matches)}")
for m in matches:
    config = []
    if m["has_config"]:
        config.append("config")
    if m["penalty"]:
        config.append("downranked-name")
    extra = ", ".join(config) if config else "-"
    print(f"{m['id']}\t{m['name']}\tlast_used={m['last_used'] or '-'}\tused_by={m['used_by']}\t{extra}")
PY
```

Use that output, not raw `ona project list`, as the basis for user-facing project selection.

Implementation rule:

- keep the project fetch, environment fetch, and Python ranking logic in one shell command
- do not first copy JSON into temp files from prior assistant-visible command output and then parse those temp files later
- if `python3` is missing, fall back to a simpler repo-match-only listing and ask the user to choose, rather than inventing a brittle shell-only recency join

If the user asks to filter the ranked matches, apply the filter to the ranked result set, not to the raw org-wide project list. For example:

```bash
<ranked-project-command> | grep -i hosted
```

Or, when the user gives an exact project ID, bypass ranking and use that project directly.

Ranking order:

1. exact repo match
2. recent personal usage inferred from environments
3. stronger project signals such as `usedBy.totalSubjects`, `automationsFilePath`, and `devcontainerFilePath`
4. project-name hints from the user request
5. clean, canonical names over obviously throwaway names
6. fallback alphabetical order

Name-quality heuristic:

- strongly downrank names that look temporary or unsafe such as `do-not-open`, `test`, `testing`, `delete`, `ignore`, or scratch-style labels
- do not downrank those names if the user explicitly asks for them
- if one candidate is clearly dominant by recency and usage, recommend it first instead of asking the user to sift through low-quality matches

The default minimum signal for automatic project creation is:

- `.devcontainer/devcontainer.json` exists

## Canonical setup prompt

For local repository setup, the power should use the prompt from Ona's existing “Automated dev environment setup” workflow rather than inventing a separate one-off prompt.

The source of truth for that workflow currently lives in Ona's product code and aligns with the public docs story:

- [Set up your first environment](https://ona.com/docs/ona/configuration/devcontainer/getting-started)
- [Ona docs source bundle](https://ona.com/docs/llms.txt)
- [Automations as code](https://ona.com/docs/ona/automations/automations-as-code)

The prompt instructs the agent to analyze the codebase, generate or update `devcontainer.json` and Ona automations, use the allowed docs sources, and avoid creating documentation files.

## Large project sets

This power is designed to work in orgs where many projects may point at the same repository.

Behavior expectations:

- it should never hard-truncate the match set to 3
- it should never print the raw org-wide `ona project list` output to the user as the selection UI
- it should show all matches when the set is small enough to scan
- it should show a ranked preview when the set is large
- it should support follow-ups like:
  - `show all`
  - `filter hosted`
  - `use 0198131b-296d-7c26-b1b6-1f6e3905174c`
- when one project is obviously dominant, it should recommend that candidate directly and explain why
- after project selection, it should keep environment reuse scoped to the current NeuralBridge session unless the user explicitly opts into another environment

The project ID is always the escape hatch for power users.

## Example prompts

These are good prompts to verify activation and response quality:

1. `Run this test suite overnight in Ona and open a draft PR if it passes.`
2. `This bug needs access to our internal staging network. Should we offload it to Ona?`
3. `Turn this dependency cleanup into a nightly Ona automation.`
4. `Use Ona to pick up my Linear ticket and prepare the implementation plan.`
5. `Should I keep this frontend tweak in NeuralBridge or move it to Ona?`
6. `I want Ona to investigate this Sentry issue and propose a fix.`
7. `If this repo already has an Ona project, create an environment for it.`
8. `Use the Ona CLI to create the environment, but ask me before you run anything.`
9. `Show all matching projects for this repo.`
10. `Filter the matching projects to the hosted compute one.`
11. `Use project 0198131b-296d-7c26-b1b6-1f6e3905174c.`
12. `Set up this repository for Ona even if the Ona CLI is not installed.`
13. `Create the Dev Container and Ona automations config using the standard Ona setup prompt.`

## Troubleshooting

### `ona` CLI is missing

The power should choose between two paths:

- open [app.ona.com](https://app.ona.com)
- sign in there
- install the CLI later if command-line flows are needed

Or, if the user wants repo preparation rather than direct launch:

- set up `.devcontainer/devcontainer.json`
- set up `.ona/automations.yaml`
- use the canonical Ona setup prompt

### `ona whoami` fails

The power should treat this as `needs_ona_login` and suggest:

```bash
ona login
```

Or, when a PAT is preferred:

```bash
ona login --token <token>
```

If browser login is inconvenient, the power can also offer:

```bash
ona login --no-browser
```

### The user is logged into Ona but still cannot push or open PRs

The likely gap is Git provider authentication, not Ona login. Direct the user to:

- [app.ona.com/settings/git-authentications](https://app.ona.com/settings/git-authentications)

### The task mentions Linear, Sentry, or Notion but the workflow is blocked

The likely gap is an optional integration. The power should call that out separately instead of presenting it as an Ona login problem.

### The repo does not match any Ona project

The power should not silently fall back to a raw repo workflow. It should:

- check whether `.devcontainer/devcontainer.json` exists
- offer `ona project create <repo-url> ...` only after confirmation
- otherwise explain that the repo is not ready for automatic project creation

### Multiple Ona projects match the same repository

The power should not guess. It should:

- rank the matches
- show all matches when the list is short
- offer `show all` when the list is long
- allow `filter <text>` and `use <project-id>`

When ranking, it should prefer:

- projects you have actually used recently
- projects with stronger shared-usage signals
- projects with real Ona config attached
- canonical names like `Next` over throwaway names like `PD-DO-NOT-OPEN`

### The user asked for a one-off Ona run, but the power tried to start a repo task

That is the wrong execution path.

The power should:

- treat one-off long-running work as prompt-driven AI execution
- preserve the original user request as the prompt
- use `ona ai automation execute ... --environment-id <environment-id>`
- keep the generated YAML ephemeral via stdin or a temp file
- do not inspect `.ona/automations.yaml` as part of this flow
- treat `ok`, `yes`, or equivalent approval as approval for the agreed create-and-run flow, not just the first command

### The user asked to make something an automation, but the power opened `.ona/automations.yaml`

That is also the wrong execution path.

The power should:

- treat recurring, scheduled, PR-triggered, and webhook-triggered requests as AI automation requests
- use `ona ai automation list/create/update/start`, not `ona automations task ...`
- describe `.ona/automations.yaml` only as environment task and service config
- persist reusable AI automation YAML in the repo under `.ona/ai-automations/`, not as a tasks-and-services edit

### The power proposed the wrong Ona CLI command

The power should:

- validate command flags against the live CLI help before recommending them
- avoid unsupported formatting flags such as `-o json` on `ona environment create`
- fall back to the simplest known-good command form when only the environment ID is needed

### The power retried after Ona already accepted the run

The power should:

- treat `agent_execution_id` in `ona ai automation execute` output as the success signal for handoff
- avoid rerunning the same prompt just because status polling timed out afterward
- say the work was handed off to Ona and link the user to the environment details page
- stop after that unless the user explicitly asks for a later update

### The power tried to reuse some other running environment automatically

That should not be the default.

The power should:

- reuse the environment it created earlier in the current NeuralBridge session
- otherwise create a fresh environment for the current task
- only use a different existing environment when the user explicitly asks for it

### The user wants to keep a successful workflow for reuse

That is the point where the power should switch from ephemeral execution input to repo-stored automation-as-code.

The power should:

- explain that the one-off execution YAML was temporary
- suggest saving a reusable AI automation definition under `.ona/ai-automations/`
- make clear that `.ona/automations.yaml` is for repo tasks and services, while `.ona/ai-automations/*.yaml` holds reusable AI automation definitions
- if the user explicitly wants a repeatable workflow, save the YAML file first and then create or update the AI automation from that file

## Manual test cases

Validate these flows in NeuralBridge:

1. authenticated user with a matching project
2. unauthenticated user who confirms `ona login`
3. no CLI installed
4. no CLI installed, but the user asks to prepare the repo for Ona
5. repo with multiple matching projects
6. repo with more than 10 matching projects
7. `show all` follow-up after a ranked preview
8. `filter <text>` follow-up that narrows the list
9. `use <project-id>` follow-up that bypasses ranking
10. repo with no matching project but a valid devcontainer
11. repo with no matching project and no devcontainer
12. PR-oriented request with missing Git auth
13. Linear or Sentry request with missing integration
14. recurring automation request creates or updates an AI automation instead of touching `.ona/automations.yaml`
15. clearly local request that stays in NeuralBridge

## Known limitations

- this version does not run arbitrary `ona environment exec` commands
- this version does not write automation config with `ona automations update`
- this version does not create brand new automation tasks or services from natural language
- this version does not auto-open an editor after environment creation unless the user asks
- v1 does not require or configure an MCP server
- the power still relies on NeuralBridge command approvals for both preflight checks and confirmed CLI actions
