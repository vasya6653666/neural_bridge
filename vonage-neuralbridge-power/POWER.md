---
name: vonage-neuralbridge-power
displayName: Vonage CPaaS Power
description: Guided developer workflows for the Vonage CPaaS platform — account setup, application management, number acquisition, activity reports, and data visualization.
keywords:
  - vonage
  - sms
  - messaging
  - voice
  - whatsapp
  - rcs
  - communications
  - cpaas
  - phone number
  - send message
  - onboarding
  - reports
author: Vonage
---

# Vonage CPaaS Power

Welcome to the Vonage NeuralBridge Power. This Power gives you access to the Vonage Communications Platform APIs through guided workflows and inline documentation.

## Onboarding

Before running any workflow, verify that the required credentials are available.

### Step 1: Check account-level credentials

Call `get-balance` using the `vonage-api` MCP server.

- If the call **succeeds**, credentials are configured correctly. Proceed to the requested workflow.
- If the call **fails** with an authentication error (401) or returns an empty/zero result that looks unexpected, the credentials are missing or wrong. Stop immediately and follow the recovery steps below.

**CRITICAL**: Do not attempt any other workflow steps until credentials are confirmed working. Proceeding without valid credentials will cause all subsequent API calls to fail.

### Step 2: Recovery — credentials not configured

If `get-balance` failed, display this message to the user exactly:

> **Your Vonage credentials are not configured yet.** To fix this, add the following to a `.env` file in your project root (or export them in your shell before launching NeuralBridge):
>
> ```
> VONAGE_API_KEY=your_api_key_here
> VONAGE_API_SECRET=your_api_secret_here
> ```
>
> You can find both values at [https://dashboard.nexmo.com/settings](https://dashboard.nexmo.com/settings).
>
> Once set, **restart NeuralBridge** so it picks up the new environment variables, then try again.

Do not continue until the user confirms they have set the variables and restarted NeuralBridge. Then re-run `get-balance` to confirm before proceeding.

---

## Quick Start

Run the **Get Started** workflow to go from zero to a working Vonage application in minutes:

> **"Start the Vonage get-started workflow"** or **"Help me set up Vonage"**

The workflow will:
1. Validate your API credentials
2. Create a Vonage Application with your chosen capabilities
3. Search for and purchase a phone number
4. Link the number to your application
5. Point you to code examples in your preferred language

---

## Environment Variables

Configure these variables in your environment or `.env` file before running workflows.

### Account-Level Credentials (required for all workflows)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VONAGE_API_KEY` | Your Vonage account API key | [Vonage Dashboard → API Settings](https://dashboard.nexmo.com/settings) |
| `VONAGE_API_SECRET` | Your Vonage account API secret | [Vonage Dashboard → API Settings](https://dashboard.nexmo.com/settings) |

### Application-Level Credentials (required for messaging and voice)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VONAGE_APPLICATION_ID` | UUID of your Vonage Application | [Vonage Dashboard → Applications](https://dashboard.nexmo.com/applications) |
| `VONAGE_PRIVATE_KEY64` | Base64-encoded RSA private key for JWT authentication | Downloaded when creating an application — encode with [this tool](https://mylight.work/private-key-to-environment-variable) |

### Channel-Specific Variables (optional, required for specific channels)

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VONAGE_VIRTUAL_NUMBER` | Your purchased Vonage number in E.164 format (e.g. `+12015555555`) | [Vonage Dashboard → Numbers](https://dashboard.nexmo.com/your-numbers) |
| `VONAGE_WHATSAPP_NUMBER` | Your WhatsApp Business number | Vonage Dashboard → Messages sandbox or approved WhatsApp number |
| `RCS_SENDER_ID` | Your RCS agent/sender identifier | Vonage Dashboard → Messages → RCS |

---

## Available Workflows

| Developer Intent | Steering File | Description |
|-----------------|---------------|-------------|
| "Set up Vonage", "Get started", "Create a Vonage app", "Buy a number" | `steering/get-started.md` | Complete onboarding: validate credentials, create application, purchase and link a number |
| "Show my reports", "Check message delivery", "Monitor usage", "Check my balance" | `steering/reports-monitoring.md` | Pull activity records, visualize data, check account balance |

---

## Capabilities Overview

### Account Tools
| Tool | Description |
|------|-------------|
| `get-balance` | Returns the current account balance with currency code |

### Numbers Tools
| Tool | Description |
|------|-------------|
| `search-available-numbers` | Finds purchasable numbers by country code and capability (SMS, Voice) |
| `purchase-number` | Purchases a specific available number for your account |
| `list-purchased-numbers` | Lists all numbers owned by your account with linked application status |
| `link-number-to-vonage-application` | Associates a purchased number with a Vonage Application |

### Application Tools
| Tool | Description |
|------|-------------|
| `create-application` | Creates a new Vonage Application with specified name and capabilities |
| `list-applications` | Lists all Vonage Applications on your account with IDs, names, capabilities, and linked number counts |

### Reports Tools
| Tool | Description |
|------|-------------|
| `get-records-report` | Retrieves message and call activity records for a specified date range with optional filters |

### Visualization Tools
| Tool | Description |
|------|-------------|
| `make-chart` | Generates a chart from report data — supports multiple chart types |

### Documentation
The **Vonage Docs MCP Server** is always available for:
- Language-specific code examples for any Vonage API
- SDK references and installation instructions
- Webhook setup guidance
- Explanations of Vonage concepts (NCCO, JWT, Vonage Applications, Virtual Numbers, etc.)

Ask: *"Show me a Node.js example for sending an SMS"* or *"What is an NCCO?"*

---

## Useful Links

- [Vonage Developer Documentation](https://developer.vonage.com/)
- [Vonage Dashboard](https://dashboard.nexmo.com/)
- [API Reference](https://developer.vonage.com/api)
- [Vonage API Status](https://vonageapi.statuspage.io/)
- [Private Key Encoder](https://mylight.work/private-key-to-environment-variable)

## License and support

This power itself is covered by the [Apache-2.0](LICENSE) license.

This power integrates with [Vonage API MCP server](https://github.com/Vonage-Community/vonage-mcp-server-api-bindings) (Apache-2.0), and [Vonage Documentation MCP server](https://github.com/Vonage/vonage-mcp-server-documentation) (Apache-2.0).

- [Privacy Policy](https://www.vonage.com/legal/privacy-policy/)
- [Support](https://www.vonage.com/support/)
