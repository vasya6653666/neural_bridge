<!--
Licensed to YugabyteDB, Inc. under one or more contributor license agreements.
See the NOTICE file distributed with this work for additional information
regarding copyright ownership. YugabyteDB licenses this file to you under
the Apache License, Version 2.0 (the "License"); you may not use this file
except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
-->
# Meko power for NeuralBridge

The Meko power gives NeuralBridge long-term memory and a shared team knowledge base.
NeuralBridge recalls your preferences, conventions, and earlier decisions across
sessions, saves new ones as you work, and searches documents your team uploaded
to a Meko datapack.

The power follows the [Agent Plugins](https://agent-plugins.org/) format and
contains:

| Path | Purpose |
|---|---|
| `plugin.json` | Manifest and activation keywords |
| `mcp.json` | Connection to the hosted Meko MCP server at `https://mcp.mekodata.ai/mcp` |
| `skills/meko-memory/` | Tool-by-tool guidance, with reference files |
| `ru.neuralbridge/INSTRUCTIONS.md` | Session setup NeuralBridge shows when the power activates |
| `ru.neuralbridge/steering/connection-troubleshooting.md` | Fixes for connection and tool errors |

## Requirements

- NeuralBridge IDE or NeuralBridge CLI.
- A Meko account. Sign up at [cloud.mekodata.ai](https://cloud.mekodata.ai).

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

Then sign in once: open NeuralBridge's **MCP Servers** view, find the power's `meko`
server, and choose **Authenticate**. NeuralBridge opens a browser for the Meko sign-in. The
power stores no API key or other secret.

## Use it

Mention Meko or ask NeuralBridge to remember or recall something, for example:

- "Remember that we deploy from the repo root only."
- "What do you know about our release process?"
- "Search the team knowledge base for the billing incident runbook."

NeuralBridge activates the power, sets up a Meko conversation for the session, and
calls the Meko tools it needs.

## Choose the power or the installer

Meko also ships an installer, `npx @yugabytedb/meko-mcp --client neuralbridge`, which
configures NeuralBridge with an API key and adds hooks that capture every conversation
automatically. The power doesn't include those hooks: NeuralBridge saves memories when
you state durable facts or ask it to remember something.

Use one of them. If you install both, NeuralBridge sees two copies of every Meko tool.

## Privacy

The power sends data to the hosted Meko service only when NeuralBridge calls a Meko
tool. See the
[Meko Connector and Skills Privacy Policy](https://github.com/yugabyte/meko-skills/blob/main/PRIVACY_POLICY.md)
and the [Yugabyte Privacy Notice](https://www.yugabyte.com/privacy-policy/).

## Support

- Questions and bugs: [GitHub issues](https://github.com/yugabyte/meko-skills/issues).
- Security reports: security@yugabyte.com, as described in
  [SECURITY.md](https://github.com/yugabyte/meko-skills/blob/main/SECURITY.md).

## License

Apache-2.0.
