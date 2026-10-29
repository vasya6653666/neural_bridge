# Specs, skills, steering, hooks, agents and workflows

Project files live in the `.neuralbridge/` folder of the project; files for every project live in `~/.neuralbridge/`.

## Specs

NeuralBridge IDE has a spec mode: the agent turns a feature into three documents in
`.neuralbridge/specs/<feature>/`:

- `requirements.md` — requirements, written in EARS notation;
- `design.md` — the design;
- `tasks.md` — the implementation tasks, which the agent then works through.

## Skills

A skill is a folder with a `SKILL.md` file:

- in the project: `.neuralbridge/skills/<name>/SKILL.md`;
- for every project: `~/.neuralbridge/skills/<name>/SKILL.md`.

When a project skill and a global skill have the same name, the project one wins.

## Steering

Steering files are Markdown instructions the agent follows: `.neuralbridge/steering/*.md` in the project and
`~/.neuralbridge/steering/*.md` for every project.

## Hooks

A hook runs an agent prompt or a shell command on an event: saving a file, calling a tool, sending a prompt and others. Each
hook is a JSON file in `.neuralbridge/hooks/` of the project; hooks for every project go to `~/.neuralbridge/hooks/`.

Files named `*.neuralbridge.hook` are the older hook format. Hooks inside a power folder are examples: the IDE does not load
them from there. The user copies the ones they want into `.neuralbridge/hooks/`.

## Custom agents

A custom agent is a Markdown file with a YAML header or a JSON file:

- in the project: `.neuralbridge/agents/`;
- for every project: `~/.neuralbridge/agents/`.

## Workflows

Workflows are reusable multi-step recipes the agent can create and run. They are off by default. The setting is
`neuralbridge.workflows.enabled` in the IDE settings; changes apply to new sessions.
