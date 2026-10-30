---
name: "compose-practices"
description: "Conventions for writing Dockerfiles and Compose files: small reproducible images, multi-stage builds, non-root users, pinned versions, healthchecks, depends_on conditions, volumes for data, environment and secrets kept out of images and git. Use when creating or reviewing a Dockerfile, Containerfile or compose.yaml."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Dockerfile and Compose practices
Follow the existing style of the project first. Where the project is silent, use these rules, then check the result with
the `container-workflow` skill (`ctr_compose_config`, `ctr_build`).
## Dockerfile
- Pin the base image to a version tag (`node:22.11-bookworm-slim`, `python:3.12-slim`), not `latest`. For strict
  reproducibility pin the digest as well.
- Multi-stage builds: build tools and dev dependencies in a `build` stage, only the runtime and artifacts in the final
  stage. Name the stages (`AS build`, `AS runtime`) so `target` can select them.
- Order layers from rarely to often changing: system packages, dependency manifests and install (`package*.json`,
  `requirements.txt`, lock files), then the source. Keep a `.dockerignore` with `.git`, `node_modules`, build output and
  local `.env` files.
- Run as a non-root user (`USER app`) and give it only the directories it writes to.
- One process per container; use the exec form (`CMD ["node", "server.js"]`) so signals reach the process.
- Add `HEALTHCHECK` when the service has a cheap readiness check.
- No secrets in `ARG`, `ENV` or copied files: they stay in the image layers and history. Use build secrets
  (`RUN --mount=type=secret,...`) for tokens needed during the build.
## Compose
- File name `compose.yaml`; local-only overrides go to `compose.override.yaml`, which is applied automatically and may be
  kept out of git.
- Give every service an explicit `image` (and `build` when it is built locally) so tags are predictable.
- `depends_on` with `condition: service_healthy` for services that must be ready (databases), together with a
  `healthcheck` on the dependency; plain `depends_on` only orders start-up.
- Data that must survive `down` and recreation lives in named volumes or explicit bind mounts, never only in the
  container filesystem. Mark volumes shared with other projects `external: true` so `down --volumes` never deletes them.
- Publish only the ports the user needs, and bind development ports to `127.0.0.1` (`"127.0.0.1:5432:5432"`).
- `restart: unless-stopped` for long-running services, nothing for one-off tasks.
- Configuration through `environment` with `${VAR}` substitution and an `.env` file kept out of git; commit an
  `.env.example` with names and harmless defaults. Passwords and keys go through `secrets:` (files or environment
  variables on the user's machine), not literal values in `compose.yaml`.
- Use `profiles` for optional services (debug tools, admin UIs) instead of separate files.
## Changing a running project
- Changing `environment`, `ports`, `volumes` or `image` of a service recreates its container on the next `up`; the plan
  shows it as `recreate`. Anything stored outside volumes is lost.
- Renaming a service or the project directory creates new containers and leaves the old ones as orphans; the plan lists
  them. Remove them deliberately with a removal plan.
- Renaming a named volume creates an empty new volume. Copy the data first, or keep the old `name:`.
