# Data, telemetry and privacy

## What stays on the user's machine

NeuralBridge IDE keeps its data locally, in `~/.neuralbridge/` and in the `.neuralbridge/` folder of each project:

- chat sessions;
- the agent's memory;
- steering files, skills, hooks and specs;
- MCP settings (`~/.neuralbridge/settings/mcp.json` for the user, `.neuralbridge/settings/mcp.json` for the project).

The agent's memory is local and is not synced between machines.

## What is sent

- During an agent turn, the request and the model's answer go through the NeuralBridge service.
- Files the user uploads to the cloud config in the web account (see `cloud-config.md`).
- Usage data and performance metrics, if the user allows them (see below).

Nothing else with the user's content is sent by the IDE.

## Settings

The settings are under **Settings → Telemetry**, in the section **Data Sharing And Prompt Logging**:

| Setting | Default | What it controls |
|---|---|---|
| **Usage Analytics And Performance Metrics** | on | When off, the IDE sends no usage data or performance metrics. |
| **Content Collection For Service Improvement** | on | When off, every request tells the service not to keep its content. |

Write the setting names exactly as above.

## Retention and personal data

Do not state how long anything is kept: the retention rules belong to the privacy policy. Link to it:
https://panel.neuralbridge.ru/legal/privacy
