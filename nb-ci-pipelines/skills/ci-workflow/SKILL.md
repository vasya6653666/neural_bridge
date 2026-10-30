---
name: "ci-workflow"
description: "Safe order of work on CI pipelines with the ci_* tools: detect installed programs and pipeline files, lint GitHub Actions workflows with actionlint, validate .gitlab-ci.yml with glab, list and dry-run jobs with act, run a job locally only after the user approves the plan. Use whenever the user asks to check, fix, debug or run a CI workflow or pipeline."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# CI pipelines workflow
The power's MCP server runs `actionlint`, `act` and `glab` on the user's machine when they are installed. Every tool takes
`dir`: the **absolute** path of the repository root. Paths of files (`files`, `file`, `workflowFile`, `eventFile`,
`secretFile`) are absolute too. Work in this order.
## 1. Find out what you are working with
Call `ci_detect` with the workspace root as `dir`. It reports which programs are installed with their versions, the
workflow files in `.github/workflows`, and `.gitlab-ci.yml` with its `include` entries. Includes are only listed: open local
ones yourself when you need their content.
If a program is missing, tell the user what to install or which variable to set (`NB_CI_ACTIONLINT`, `NB_CI_ACT`,
`NB_CI_GLAB`) and restart the IDE, then continue with what is available. Do not download or install programs yourself.
## 2. Lint after every edit
- GitHub Actions: call `ci_actionlint` (all workflows, or `files` for the ones you changed). Fix every problem at the file,
  line and column it gives and lint again until it reports no problems. `[shellcheck]` and `[pyflakes]` problems are in
  `run:` scripts; fix them unless the user decides otherwise. Use `ignore` only when the user asks.
- GitLab CI: call `ci_gitlab_lint`. It sends the file to the user's GitLab server, so mention this the first time and skip
  it if the user does not want the file uploaded. `dryRun: true` with `ref` simulates pipeline creation for a branch and
  catches problems with `rules` and includes; nothing is created. If glab is not authenticated, ask the user to run
  `glab auth login` in a terminal; do not ask for a token in the chat.
## 3. See which jobs exist
Call `ci_act_list`, optionally with `event` (for example `pull_request`) or `workflowFile`, to see job ids, stages and events.
Use job ids from this table in the next step. Duplicate job ids across workflows need `workflowFile`.
## 4. Plan a local run
Call `ci_act_plan` with `event`, `job` and, if needed, `workflowFile` and `eventFile`. It runs a dry run, starts no
containers and returns a plan id. Pass secrets only as `secretFile`, a file path the user gives you; never put secret values
into arguments, the chat or files you create. If act reports that no default runner image is configured, ask the user to run
`act` once in a terminal to choose one, or which image to pass in `platforms`.
## 5. Show the plan and get approval
Show the user the first line of the plan (jobs run in Docker containers, images and actions may be downloaded), the
command, the jobs and steps from the dry run, and the secret file if any. Say what the job will do: deploy steps, pushes,
publishing or calls to external services run for real inside the containers. If the plan contains more jobs than the user
asked for (jobs listed in `needs` run too), say so.
## 6. Run only the reviewed plan
Call `ci_act_run` with the plan id **only after the user explicitly approves this plan**. A plan id works once. If the run is
refused because files changed, call `ci_act_plan` again and repeat step 5. If a job fails, read the end of the output, find
the failing step, fix the cause, lint again (step 2) and plan again; do not loop runs without telling the user.
Never run `act` without `-n` through the terminal to bypass this flow.
