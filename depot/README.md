# Depot Power

A Power for NeuralBridge IDE that gives your AI coding assistant deep knowledge of [Depot](https://depot.dev)'s remote container build service.

## What is Depot?

[Depot](https://depot.dev) provides drop-in replacement for `docker build` and `docker buildx build` that runs container image builds on fast cloud infrastructure with automatic, persistent layer caching. Instead of building locally, Depot transfers the build context to remote builders in AWS, providing faster builds with native multi-platform support (e.g. `linux/amd64` + `linux/arm64`) without emulation.

## What can this Power do?

With this Power installed, your AI assistant can help you:

- **Write optimized Dockerfiles** - cache-efficient layer ordering, `RUN --mount=type=cache` patterns, multi-stage builds, and `.dockerignore` setup
- **Configure CI/CD pipelines** - set up Depot in GitHub Actions, GitLab CI, CircleCI, Buildkite, Jenkins, and more
- **Debug failed builds** - diagnose slow builds, cache misses, and common error messages
- **Set up multi-platform builds** - native `linux/amd64` and `linux/arm64` builds without emulation
- **Use the Depot CLI** - `depot build`, `depot bake`, `depot init`, and other commands
- **Manage the Depot Registry** - save, pull, and push images with `--save`, `depot pull`, and `depot push`

## Installation

Install the power from the **Powers** panel in NeuralBridge IDE.

## Quickstart

Once installed, try asking your AI assistant:

> Use the Depot power to optimize my Dockerfile

> Integrate Depot with my CI workflow for container builds

> Can you determine why my build cache keeps invalidating? Use the Depot power

## Links

- [Depot website](https://depot.dev)
- [Documentation](https://depot.dev/docs)
- [CLI reference](https://depot.dev/docs/cli/reference)
- [Support](https://depot.dev/help)

## License

MIT
