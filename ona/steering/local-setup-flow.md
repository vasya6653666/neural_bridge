# Local Setup Flow

Use this guide when the user wants to prepare a repository for Ona without requiring the Ona CLI to be installed first.

## When to use this flow

Use this flow when the user asks for things like:

- "set up a dev container for Ona"
- "prepare this repo for Ona"
- "make this repo ready for Ona agents"
- "create the devcontainer and Ona config"

Use it especially when:

- `command -v ona` fails
- the user wants local repo preparation, not immediate Ona launch

## What this flow should do

Prepare the repository locally by generating or updating:

- `.devcontainer/devcontainer.json`
- `.ona/automations.yaml`
- any minimal supporting config needed to satisfy the setup

Do not block on Ona login or project creation for this path.

## Canonical setup prompt

Use this prompt as the source of truth. It comes from Ona's existing “Automated dev environment setup” workflow template:

```text
Create a high-quality, fully working “development environment as code” configuration for the current environment.

The setup must work for:
• Ona (Gitpod Flex) development environments, which use DevContainer configurations.
Do not confuse this with Gitpod Classic (Gitpod Dedicated), which uses .gitpod.yml.
• All Git repositories mounted under the DevContainer workspace.

Terminology
• apps: Source code intended to be built and shipped.
• dev tool: Any tool used for compiling, building, publishing, testing, profiling, debugging, or accessing an app's infrastructure.

Required Process
1. Read the documentation (see Allowed Sources) to fully understand:
• Ona automations, secrets, environment variables, CLI, and prebuilds.
• DevContainer fundamentals and how they integrate with Ona and VS Code.
2. Analyze the source code and identify:
• Documentation on dev setup or contribution guidelines.
• Configuration files for containers, IDEs, build tools, environment variables, etc.
3. Update all necessary files, including:
• devcontainer.json
• Ona automations (tasks and services)
• Any other files required to meet the Success Criteria.
4. Run the Acceptance Tests for all code you have created and iterate until the last run of every Acceptance Test has been successful.
5. Do not create any documentation files.

Success Criteria
• The DevContainer includes all tools needed to work with any file in any repo in this environment.
• Ona automation services exist for every service required or recommended to run any app in this environment.
• Ona automation services exist for every app, for the standard or documented configurations.
• Ona automation tasks exist for all standard or documented development workflows for this repo.
• If an app exposes a TCP port, the DevContainer must forward it.
• If an app exposes an HTTP/HTTPS port, the corresponding Ona automation service must expose it by running "ona env port open" before starting the app.
• The DevContainer must install all VS Code extensions necessary to work effectively with the files and services in this environment.

Acceptance Tests:
• The command "ona auto update <filename>" succeeds
• The command "ona env devcontainer validate" succeeds
• The DevContainer rebuilds successfully.
• All installed tools launch successfully and are available in the correct version
• Ona automation tasks start and finish successfully.
• Ona automation services successfully reach the state "ready".
• Apps exposed via Ona port respond successfully when curl'ing the port.

Allowed Sources
• Ona documentation: automations, secrets, environment variables, CLI, prebuilds, DevContainers
https://ona.com/docs/llms.txt
• DevContainer documentation: https://containers.dev/
• DevContainers in VS Code: https://code.visualstudio.com/docs/devcontainers/containers
• DevContainer base images: https://hub.docker.com/r/microsoft/devcontainers
• VS Code extensions:
• https://marketplace.visualstudio.com/vscode
• https://open-vsx.org/
• Any publicly available DevContainer features
• Anything installable within a Dockerfile
```

## Practical adaptation for the power

When the Ona CLI is missing:

- keep the prompt's file-generation goals
- keep the Ona docs and DevContainer docs as source-of-truth references
- do not promise that Ona CLI acceptance tests can run locally
- still generate the files so the repository is ready for Ona once the CLI or project setup exists

## User-facing behavior

The power should explain:

- it cannot launch Ona directly without the CLI
- it can still prepare the repository locally
- the generated files are intended to make the repo ready for Ona environments and automations later
