# Login And Readiness

Use this guide when the user wants to offload work to Ona and you need to determine what is ready.

## Readiness state machine

Work through these states in order:

1. Determine whether Ona is a fit for the task.
2. If yes, determine local CLI readiness if possible.
3. Resolve the current repository to an Ona project when possible.
4. Determine whether the task also requires Git provider authentication.
5. Determine whether the task also requires optional integrations.

Use exactly these states when reasoning:

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

## Detection behavior

When command execution is available:

1. Run `command -v ona`
2. Run `ona whoami -o json`
3. Run `git remote get-url origin`
4. Run `ona project list --limit 1000 -o json`
5. Run `ona environment list -a -o json`

Interpretation:

- `command -v ona` fails and the user wants local repo setup -> `ready_to_prepare_repo`
- `command -v ona` fails and the user wants direct Ona execution -> `needs_cli`
- `command -v ona` succeeds and `ona whoami -o json` fails -> `needs_ona_login`
- local auth succeeds and the repo resolves to exactly one project -> `ready_to_create_environment`
- local auth succeeds and the repo resolves to multiple projects -> `needs_project_resolution`
- local auth succeeds and the repo resolves to no projects -> inspect repo readiness before offering project creation

After project resolution:

- if the user wants a one-off long-running outcome driven by their prompt -> `ready_to_start_ai_execution`
- if the user wants recurring, scheduled, PR-triggered, webhook-triggered, or saved automation behavior -> `ready_to_manage_ai_automation`

When command execution is not available:

- treat execution state as unavailable
- give browser-first guidance instead of claiming the power can run CLI-backed actions

## No-CLI local setup path

If the user wants to prepare the repository for Ona rather than launch Ona immediately:

- do not block on missing CLI
- offer a local setup workflow that generates or updates:
  - `.devcontainer/devcontainer.json`
  - `.ona/automations.yaml`
- use the canonical “Automated dev environment setup” prompt text from Ona's existing automation template
- treat this as a local repository-improvement flow, not an Ona-login flow

## Project resolution

Use a project-first strategy that scales to large numbers of matching projects.

Resolution algorithm:

1. derive the repository URL from `git remote get-url origin`
2. normalize SSH and HTTPS GitHub URL variants before matching
3. fetch raw project data with `ona project list --limit 1000 -o json`
4. fetch raw environment data with `ona environment list -a -o json`
5. run the combined ranking step before showing anything to the user
6. match on repository metadata under the project initializer, not just project name

Preferred command sequence:

1. get the current repo URL:
   - `git remote get-url origin`
2. fetch the complete project set:
   - `ona project list --limit 1000 -o json`
3. fetch recent environments:
   - `ona environment list -a -o json`
4. run one combined ranking step in the shell before speaking

Runtime rule:

- run the combined ranking as one shell command
- do not break it into “fetch JSON now, parse temp files later” steps, because that is more brittle in chat-driven execution and can produce corrupted or stale temp-file inputs

Preferred combined ranking command:

```bash
repo_url="$(git remote get-url origin)"
python3 - <<'PY' "$repo_url" \
  <(ona project list --limit 1000 -o json) \
  <(ona environment list -a -o json)
import json, sys

repo_url, projects_path, envs_path = sys.argv[1:4]

def normalize(url: str) -> str:
    url = url.strip()
    if url.startswith("git@github.com:"):
        url = "https://github.com/" + url[len("git@github.com:"):]
    if url.endswith(".git"):
        url = url[:-4]
    return url.lower().rstrip("/")

def throwaway(name: str) -> bool:
    lowered = name.lower()
    return any(term in lowered for term in ["do-not-open", "test", "testing", "delete", "ignore", "scratch"])

repo_key = normalize(repo_url)
projects = json.load(open(projects_path))
envs = json.load(open(envs_path))

recent = {}
for env in envs:
    project_id = env.get("projectId") or env.get("metadata", {}).get("projectId")
    meta = env.get("metadata", {})
    ts = meta.get("lastStartedAt") or meta.get("createdAt") or ""
    if project_id and ts and ts > recent.get(project_id, ""):
        recent[project_id] = ts

matches = []
for project in projects:
    remotes = [
        normalize(spec.get("git", {}).get("remoteUri", ""))
        for spec in project.get("initializer", {}).get("specs", [])
        if spec.get("git", {}).get("remoteUri")
    ]
    if repo_key not in remotes:
        continue
    meta = project.get("metadata", {})
    matches.append({
        "id": project.get("id", ""),
        "name": meta.get("name", ""),
        "last_used": recent.get(project.get("id", ""), ""),
        "used_by": project.get("usedBy", {}).get("totalSubjects", 0),
        "has_automations": bool(project.get("automationsFilePath")),
        "has_devcontainer": bool(project.get("devcontainerFilePath")),
        "penalty": throwaway(meta.get("name", "")),
    })

matches.sort(key=lambda m: m["name"].lower())
matches.sort(key=lambda m: m["has_devcontainer"], reverse=True)
matches.sort(key=lambda m: m["has_automations"], reverse=True)
matches.sort(key=lambda m: m["used_by"], reverse=True)
matches.sort(key=lambda m: m["last_used"], reverse=True)
matches.sort(key=lambda m: bool(m["last_used"]), reverse=True)
matches.sort(key=lambda m: m["penalty"])

for m in matches:
    print(json.dumps(m))
PY
```

Use the JSON lines from that command as the source of truth for ranking and display.

Python availability rule:

- `python3` is the preferred runtime for this ranking step
- if `python3` is unavailable, fall back to a simple repo-match-only listing with names and IDs
- do not attempt a complex recency-aware ranking in pure shell as a replacement

Filtering rule:

- if the user says `filter <text>`, apply that filter to the ranked repo-matching result set, not to the raw `ona project list` output
- if the user gives an exact project ID, skip filtering and use that project directly

Observed project metadata can include:

- `initializer.specs[].git.remoteUri`
- `metadata.name`
- `id`
- `usedBy.totalSubjects`
- `automationsFilePath`
- `devcontainerFilePath`

Observed environment metadata can include:

- `metadata.projectId`
- `metadata.lastStartedAt`
- `metadata.createdAt`

Matching rules:

- exactly one match -> use that project ID
- 2 to 10 matches -> show all matching projects
- more than 10 matches -> show a ranked top 5 plus a path to show all
- zero matches -> check `.devcontainer/devcontainer.json`

Ranking rules:

1. exact repository match
2. recent personal usage derived from environments when available
3. stronger project signals such as shared usage and attached Ona config
4. project-name hints from the user's wording when available
5. clean, canonical names over obviously temporary or unsafe names
6. fallback alphabetical order

Recent usage heuristic:

- map recent environments to projects via top-level `projectId`, falling back to `metadata.projectId`
- sort candidate projects by the newest available environment timestamp for the current user
- prefer `metadata.lastStartedAt` when available, otherwise `metadata.createdAt`

Do not label a project as "recent" unless that ranking really came from environment history.

Additional ranking heuristics:

- prefer projects with larger `usedBy.totalSubjects` when recency is close or missing
- prefer projects with `automationsFilePath` or `devcontainerFilePath` set when the workflow depends on Ona setup
- strongly downrank names that look throwaway or unsafe, such as:
  - `do-not-open`
  - `test`
  - `testing`
  - `delete`
  - `ignore`
- do not apply the negative-name penalty when the user explicitly asks for that project

Presentation rule:

- never dump the raw `ona project list` output into the chat
- never treat `ona project list -o json` by itself as the project-selection experience
- always filter to repo matches first, then show the ranked result set
- if one candidate is clearly dominant by recency, shared usage, and config readiness, recommend it directly and explain why

Environment-selection rule:

- treat environment selection separately from project selection
- do not automatically attach the current task to an arbitrary existing running environment
- prefer the environment created earlier in the current NeuralBridge session when available
- otherwise create a fresh environment for the current task
- only reuse another existing environment when the user explicitly asks for it or provides the environment ID

If no project exists:

- if `.devcontainer/devcontainer.json` exists, offer project creation after confirmation
- if it does not exist, explain that the repo is not ready for automatic project creation

Interactive selection rules:

- allow `show all`
- allow `filter <text>`
- allow `use <project-id>`
- allow `use <project-name>` only when it narrows to a single project

Do not silently choose between multiple projects.

## Distinguish the setup layers

### Ona login

Use this when the user needs access to Ona itself.

Preferred guidance:

- open `https://app.ona.com`
- or run `ona login`
- or run `ona login --no-browser`
- or use `ona login --token <token>` with a PAT

PAT page:

- `https://app.ona.com/settings/personal-access-tokens`

### Git provider authentication

Use this when the user expects Ona to:

- clone a repository
- push commits
- create or help create a PR

Git auth page:

- `https://app.ona.com/settings/git-authentications`

Never describe this as "just log into Ona."

### Optional integrations

Use this only when the workflow depends on them:

- Linear for issue pickup or ticket context
- Sentry for issue investigation
- Notion for workspace documentation context

Integrations page:

- `https://app.ona.com/settings/org-integrations`

## Confirmation rules

All side-effecting CLI flows require user confirmation.

Supported confirmed actions:

- `ona login`
- `ona login --no-browser`
- `ona project create <repo-url> ...`
- `ona environment create <project-id> --dont-wait --set-as-context ...`
- `ona environment start <environment-id> --set-as-context`
- `ona ai automation execute - --environment-id <environment-id>`
- `ona ai automation create <path-to-yaml>`
- `ona ai automation update <automation-id> <path-to-yaml>`
- `ona ai automation start <automation-id> --project <project-id>`

When a command is available:

- tell the user the command or short sequence of commands you intend to run
- explain the reason for running them
- treat one user confirmation as approval for that agreed flow

Do not ask for a second conversational confirmation inside the same already approved flow unless something material changes.

Do not auto-run login or environment creation just because the user asked to use Ona.

## Required response structure

For any offload recommendation, include:

### `Readiness`

Use one sentence naming the current state and the most important consequence.

Examples:

- `Readiness`: Ready to create environment. The local Ona CLI is authenticated and this repository resolves to a single Ona project.
- `Readiness`: Ready to start AI execution. The local Ona CLI is authenticated, the project is selected, and I can run the agreed create-and-run flow once you confirm the plan.
- `Readiness`: Needs Ona login. The local Ona CLI is present, but the current session is not authenticated.
- `Readiness`: Needs CLI. I could not find the Ona CLI locally, so I cannot launch anything directly from this power yet. Install it with `brew install gitpod-io/tap/ona` or follow `https://ona.com/docs/ona/integrations/cli`.
- `Readiness`: Ready to prepare the repo. I could not find the Ona CLI locally, but I can still set up the Dev Container and Ona configuration files in this repository.
- `Readiness`: Needs project resolution. I found multiple matching Ona projects, ranked the best candidates, and can show or filter the full list before creating anything.

### `Additional setup needed`

Only list blocking or near-blocking items relevant to the exact task.

Examples:

- Git provider auth for clone and PR access
- Linear integration for ticket context
- Sentry integration for issue context
- Project creation because no Ona project currently matches this repository

Do not list all possible Ona setup steps on every response.
