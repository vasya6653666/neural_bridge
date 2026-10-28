# AppDeploy Power for NeuralBridge

AppDeploy lets you create and publish real web apps directly from a NeuralBridge conversation. Describe what you want, and AppDeploy turns it into a live public app.

Go far beyond static landing pages and websites. With AppDeploy, you can build and deploy dashboards, internal tools, collaborative workspaces, games, AI apps, and full web apps.

Built-in app features include:

- Hosting and public links
- User authentication and databases
- File uploads and storage
- Secure secrets management
- Real-time updates and notifications
- Custom domains
- AI capabilities and scheduled jobs

Ship and iterate with confidence. AppDeploy helps you test, improve, and republish your app with automated QA, visual bug reports, version history, source code access, and rollbacks.

Zero setup required. No Git, command line, hosting provider, or infrastructure setup. Just chat and publish.

## Install

1. Install the power from the **Powers** panel in NeuralBridge IDE.
2. In the **MCP Servers** view, choose **Authenticate** on the AppDeploy server — a browser window opens to sign in (Google, Apple, X, or Guest).

Full setup guide: https://appdeploy.ai/install

## What's inside

This power is packaged in the open [Agent Plugins](https://agent-plugins.org) 1.0.0 format.

- `plugin.json` - Agent Plugins manifest
- `mcp.json` - remote MCP server config for `https://api-v2.appdeploy.ai/mcp`
- `ru.neuralbridge/steering/` - workflow guidance loaded by NeuralBridge on demand
- `POWER.md` - legacy NeuralBridge power manifest, kept for compatibility

## Support & Legal

- **License:** MIT (SPDX: MIT) for this power package; the AppDeploy MCP server is a hosted service governed by the [AppDeploy Terms of Service](https://appdeploy.ai/terms)
- **Privacy Policy:** https://appdeploy.ai/privacy
- **Support:** support@appdeploy.ai or https://appdeploy.ai/mcp-docs
