---
name: "container-workflow"
description: "Safe order of work with Docker or Podman through the ctr_* tools: detect the engine, look at containers, images and logs, check Compose files, build, then plan and apply Compose up/down or removals only after the user approves the plan. Use whenever the user asks to run, restart, debug, build, stop or clean up containers or a Compose project."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Container workflow
The power's MCP server runs `docker` or `podman` (and Compose) on the user's machine. Paths you pass (`dir`, `context`)
must be **absolute**. Read tools and plan tools change nothing; `ctr_build` writes to the local image store; only
`ctr_compose_apply` and `ctr_remove_apply` change running containers, networks, volumes and images.
## 1. Find out what you are working with
Call `ctr_detect` first. It reports the engine and versions and whether the daemon or service is reachable, and which
Compose is available.
- No engine: tell the user to install Docker or Podman, or set `NB_CONTAINERS_ENGINE` to the binary path and restart the
  IDE. Do not download or install anything yourself.
- Daemon not reachable: tell the user to start Docker Desktop, the Docker service or the Podman machine. Do not retry in a
  loop.
- No Compose: the user needs Docker Compose v2 (plugin or standalone) or `NB_CONTAINERS_COMPOSE`.
## 2. Look before changing anything
- `ctr_ps` for containers and their status and ports; use `filters` such as `status=exited` or
  `label=com.docker.compose.project=<name>` to narrow it.
- `ctr_logs` with a small `tail` first (50–200 lines); add `since` (for example `15m`) for a recent problem and
  `timestamps` when the order of events matters. Quote the lines that explain the problem.
- `ctr_inspect` for state, exit code, health, restart policy, ports, mounts and networks. Environment values are hidden
  on purpose; never ask the user to paste secrets into the chat.
- `ctr_images` to see which tags exist locally and how big they are.
## 3. Check Compose files
After editing `compose.yaml` (or when a project fails to start), call `ctr_compose_config` with the project directory. It
merges the files and substitutes variables exactly as Compose will. Fix every error it reports and read its warnings:
an unset variable usually means a missing `.env` entry.
## 4. Build
`ctr_build` builds from a context directory. Tell the user before calling it: a build runs the `RUN` steps of the
Dockerfile (project code) and may pull base images. Use `target` for multi-stage builds and `tags` the project expects.
Never put secrets in `buildArgs`; they stay in the image history. The tool never pushes. If the build fails, show the
failing step from the output and fix the Dockerfile or the code, then build again.
## 5. Plan, show, apply
For `compose up` / `compose down`:
1. `ctr_compose_plan` with `action` (`up` or `down`), and for `up` optionally `services`, `build`, `pull: false`; for
   `down` optionally `volumes`.
2. Show the plan to the user as it is: the command, then each service line (`create`, `recreate`, `rebuild`, `start`,
   `keep`) or each removal. Call out every `recreate` (the container is replaced and loses data outside volumes), every
   `remove`, and above all every `DELETE volume` line: `volumes: true` destroys data.
3. Call `ctr_compose_apply` with the plan id **only after the user explicitly approves this plan**.
For removing containers or images: `ctr_remove_plan`, show the list, then `ctr_remove_apply` after approval. Ask before
using `force: true` on running containers. There is no prune tool; do not suggest `system prune` through the terminal.
A plan id works once. If apply refuses because files, `.env`, the configuration or the objects changed, make a new plan
and show it again. Never run `docker compose up/down`, `docker rm`, `docker rmi` or `prune` in the terminal to bypass
this flow.
## 6. After applying
Check the result with `ctr_ps` and, for services that did not start, `ctr_logs`. Report what is running and on which
ports.
