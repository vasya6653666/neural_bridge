# Vonage CPaaS Power for NeuralBridge

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Vonage](https://img.shields.io/badge/Vonage-CPaaS-brightgreen)](https://developer.vonage.com)

A NeuralBridge Power that brings the Vonage Communications Platform directly into your AI-assisted development workflow. Go from zero to a working Vonage integration in minutes with guided, conversational workflows.

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Workflows](#workflows)
- [Available Tools](#available-tools)
- [Documentation](#documentation)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

---

## What Is This?

This Power connects NeuralBridge to the Vonage CPaaS platform via two MCP servers:

| Server | Description |
|---|---|
| **`vonage-api`** | Live API bindings for account management, phone numbers, applications, and activity reports |
| **`vonage-docs`** | Vonage developer documentation, SDK references, and code examples |

Combined with steering files that encode best-practice workflows, NeuralBridge can guide you through tasks like setting up a new Vonage application, purchasing a phone number, and pulling activity reports — all through natural conversation.

---

## Prerequisites

- NeuralBridge installed and running
- A [Vonage API account](https://ui.idp.vonage.com/ui/auth/registration) (free to create)
- Your Vonage API Key and Secret from the [Vonage Dashboard](https://dashboard.nexmo.com/settings)

---

## Installation

1. Install the power from the **Powers** panel in NeuralBridge IDE.

2. Set your Vonage credentials as environment variables **before launching NeuralBridge**. The quickest way is a `.env` file in your project root:

   ```bash
   VONAGE_API_KEY=your_api_key_here
   VONAGE_API_SECRET=your_api_secret_here
   ```

   Find both values at [Vonage Dashboard → API Settings](https://dashboard.nexmo.com/settings). See [Configuration](#configuration) for the full list of variables.

3. Open the directory in NeuralBridge — the Power is detected automatically from `POWER.md`. NeuralBridge reads your environment variables and passes them to the MCP server on startup.

> **Credentials not set?** When you trigger a workflow, the Power will detect missing credentials and walk you through the setup before proceeding.

---

## Configuration

Set the following environment variables in your shell, a `.env` file, or directly in `mcp.json`.

### Required for all workflows

| Variable | Description | Where to find |
|---|---|---|
| `VONAGE_API_KEY` | Your Vonage account API key | [Dashboard → API Settings](https://dashboard.nexmo.com/settings) |
| `VONAGE_API_SECRET` | Your Vonage account API secret | [Dashboard → API Settings](https://dashboard.nexmo.com/settings) |

### Required for messaging and voice

| Variable | Description | Where to find |
|---|---|---|
| `VONAGE_APPLICATION_ID` | UUID of your Vonage Application | [Dashboard → Applications](https://dashboard.nexmo.com/applications) |
| `VONAGE_PRIVATE_KEY64` | Base64-encoded RSA private key | Downloaded when creating an application; encode with `base64 -i private.key` (macOS) or `base64 -w 0 private.key` (Linux) |

### Optional, channel-specific

| Variable | Description |
|---|---|
| `VONAGE_VIRTUAL_NUMBER` | Your purchased Vonage number in E.164 format (e.g. `+12015550100`) |
| `VONAGE_WHATSAPP_NUMBER` | Your WhatsApp Business number |
| `RCS_SENDER_ID` | Your RCS agent/sender identifier |

---

## Workflows

### Get Started

Goes from credentials to a fully configured Vonage Application with a linked phone number.

**Trigger phrases:** `"Set up Vonage"`, `"Help me get started with Vonage"`, `"Create a Vonage app"`, `"Buy a number"`

**Steps:**
1. Validates your API credentials against the live API
2. Creates a Vonage Application with your chosen capabilities (Messages, Voice, or both)
3. Searches for available phone numbers in your chosen country
4. Purchases and links the number to your application
5. Outputs all environment variables you need to continue building

---

### Reports & Monitoring

Pulls activity records, visualizes data, and checks account balance.

**Trigger phrases:** `"Show my reports"`, `"Check message delivery"`, `"Monitor usage"`, `"Check my balance"`

**Steps:**
1. Retrieves message and call records for a date range you specify (up to 30 days)
2. Filters by channel, destination number, status, or direction
3. Generates charts to visualize message volume, delivery rates, and channel distribution
4. Reports your current account balance with optional low-balance warnings

---

## Available Tools

### Account

| Tool | Description |
|---|---|
| `get-balance` | Returns current account balance |

### Numbers

| Tool | Description |
|---|---|
| `search-available-numbers` | Finds purchasable numbers by country and capability |
| `purchase-number` | Purchases a phone number |
| `list-purchased-numbers` | Lists all numbers on your account |
| `link-number-to-vonage-application` | Links a number to an application |

### Applications

| Tool | Description |
|---|---|
| `create-application` | Creates a Vonage Application |
| `list-applications` | Lists all applications on your account |

### Reports

| Tool | Description |
|---|---|
| `get-records-report` | Retrieves activity records for a date range |

### Visualization

| Tool | Description |
|---|---|
| `make-chart` | Generates a chart from report data |

### Documentation

The **Vonage Docs MCP Server** is always available for documentation lookups, code examples in any language, SDK references, and explanations of Vonage concepts.

Try: *"Show me a Python example for sending an SMS"* or *"What is an NCCO?"*

---

## Documentation

| Resource | URL |
|---|---|
| Vonage Developer Docs | https://developer.vonage.com |
| API Reference | https://developer.vonage.com/api |
| Vonage Dashboard | https://dashboard.nexmo.com |
| Vonage API Status | https://vonageapi.statuspage.io |
| NeuralBridge Powers | https://neuralbridge.ru/powers |

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards. Please report unacceptable behavior to the project maintainers.

---

## License

Copyright 2026 Vonage

Licensed under the [Apache License, Version 2.0](LICENSE). You may not use this project except in compliance with the License. A copy is included in this repository.
