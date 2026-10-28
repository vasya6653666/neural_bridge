---
name: sinch-neuralbridge-power
displayName: Sinch NeuralBridge Power
description: Guided developer workflows for the Sinch Build platform — send messages across SMS, WhatsApp, RCS and more, run voice calls, verify phone numbers, and manage virtual numbers without leaving your IDE.
keywords:
  - sinch
  - sms
  - whatsapp
  - rcs
  - messaging
  - send message
  - conversation api
  - voice
  - verification
  - otp
  - phone number
  - cpaas
  - sinch build
author: Sinch
---

# Sinch Power

Welcome to the Sinch NeuralBridge Power. This Power connects you to the Sinch Build platform through guided workflows — send messages across any channel, make voice calls, verify phone numbers, and manage virtual numbers without leaving your IDE.

## MCP servers included

| Server | Purpose | Auth required |
|--------|---------|---------------|
| `sinch` | Sinch Build platform — messaging, voice, verification, numbers | Yes — credentials required (see below) |
| `sinch-docs` | Sinch developer documentation from [developers.sinch.com](https://developers.sinch.com?utm_source=neuralbridge&utm_medium=ide) | No |

---

## Before you start — credentials check

Call `sinch-mcp-configuration` using the `sinch` MCP server.

- If it returns a list of available tools, credentials are configured correctly. Proceed to the requested workflow.
- If it fails or returns tools as disabled, the credentials are missing or wrong. Stop immediately and follow the recovery steps below.

**CRITICAL: Do not attempt any workflow steps until credentials are confirmed working.**

### Recovery — credentials not configured

If `sinch-mcp-configuration` failed, display this message to the user exactly:

> **Your Sinch credentials are not set up yet.** Here's how to fix it:
>
> **Step 1** — Get your credentials from the [Sinch Dashboard](https://dashboard.sinch.com?utm_source=neuralbridge&utm_medium=ide):
> - `PROJECT_ID` — shown in the top toolbar of the dashboard
> - `KEY_ID` and `KEY_SECRET` — create a new Access Key under [Settings → Access Keys](https://dashboard.sinch.com/settings/access-keys?utm_source=neuralbridge&utm_medium=ide)
>
> **Step 2** — Export credentials to your shell profile (`~/.zshrc` or `~/.bash_profile`):
>
> ```bash
> # Required — needed for all tools
> echo 'export PROJECT_ID=your_project_id' >> ~/.zshrc
> echo 'export KEY_ID=your_key_id' >> ~/.zshrc
> echo 'export KEY_SECRET=your_key_secret' >> ~/.zshrc
>
> # Optional — set if you use messaging tools (SMS, WhatsApp, RCS)
> echo 'export CONVERSATION_APP_ID=your_app_id' >> ~/.zshrc
> echo 'export CONVERSATION_REGION=us' >> ~/.zshrc
> echo 'export DEFAULT_SMS_ORIGINATOR=+12025551234' >> ~/.zshrc
>
> # Optional — set if you use Voice or Verification tools
> echo 'export APPLICATION_KEY=your_app_key' >> ~/.zshrc
> echo 'export APPLICATION_SECRET=your_app_secret' >> ~/.zshrc
>
> # Optional — set if you use Email tools
> echo 'export MAILGUN_API_KEY=your_mailgun_key' >> ~/.zshrc
> echo 'export MAILGUN_DOMAIN=your_domain' >> ~/.zshrc
> echo 'export MAILGUN_SENDER_ADDRESS=sender@yourdomain.com' >> ~/.zshrc
>
> source ~/.zshrc
> ```
>
> > ⚠️ **Why not a `.env` file?** The `@sinch/mcp` server does load dotenv, but `dotenv.config()` looks for `.env` in whichever directory NeuralBridge spawns the process from — not necessarily your project folder. Shell profile exports are inherited by NeuralBridge directly and are always reliable.
>
> **Step 3** — Restart NeuralBridge so it picks up the new variables.
>
> ⚠️ Do not paste your credentials into this chat — set them in your `.env` file or terminal directly.

Do not continue until the user confirms they have completed the steps and restarted NeuralBridge. Then re-run `sinch-mcp-configuration` to confirm credentials are working before proceeding.

---

## Quick start

> **"Help me send an SMS with Sinch"**
> **"Send a WhatsApp message to a user"**
> **"Verify a phone number with OTP"**
> **"Make a text-to-speech voice call"**
> **"Find available phone numbers in the US"**

---

## Environment variables

> **Note:** Export these in your shell profile (`~/.zshrc` / `~/.bash_profile`) so NeuralBridge inherits them at startup. Restart NeuralBridge after setting them.

### Required

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `PROJECT_ID` | Your Sinch project identifier | Dashboard top toolbar |
| `KEY_ID` | Access key ID | Dashboard → Settings → Access Keys |
| `KEY_SECRET` | Access key secret (shown once at creation) | Dashboard → Settings → Access Keys |

### Optional — Conversation API

| Variable | Description |
|----------|-------------|
| `CONVERSATION_APP_ID` | Conversation app to use by default. Find it in Dashboard → Conversation API → Apps |
| `CONVERSATION_REGION` | Region of your conversation app: `us`, `eu`, or `br`. Defaults to `us` |
| `DEFAULT_SMS_ORIGINATOR` | Sender phone number for SMS (E.164 format, e.g. `+12025551234`) |

### Optional — Voice & Verification

| Variable | Description |
|----------|-------------|
| `APPLICATION_KEY` | Voice/Verification app key. Find it in Dashboard → Voice or Verification → Apps |
| `APPLICATION_SECRET` | Voice/Verification app secret |

### Optional — Email (Mailgun)

| Variable | Description |
|----------|-------------|
| `MAILGUN_API_KEY` | Mailgun API key |
| `MAILGUN_DOMAIN` | Mailgun sending domain |
| `MAILGUN_SENDER_ADDRESS` | Default sender address |

---

## Available workflows

| Developer intent | Steering file | Description |
|-----------------|---------------|-------------|
| "Send SMS", "Send WhatsApp message", "Send a message" | `steering/get-started.md` | Validate credentials, send first message via Conversation API |
| "Use templates", "Send to multiple channels", "WhatsApp template" | `steering/conversation.md` | Conversation apps, templates, multi-channel messaging |
| "Verify a phone number", "OTP", "Rent a number", "Voice call" | `steering/voice-verification.md` | Phone verification, TTS voice calls, virtual number management |

---

## Capabilities

### Conversation
| Tool | Description |
|------|-------------|
| `send-text-message` | Send a plain text message via SMS, WhatsApp, RCS, or any supported channel |
| `send-media-message` | Send an image, video, or document |
| `send-template-message` | Send using a predefined omni-channel template |
| `send-whatsapp-template-message` | Send using a WhatsApp-specific approved template |
| `send-choice-message` | Send a message with interactive buttons or quick replies |
| `send-location-message` | Send a location pin or coordinates |
| `list-conversation-apps` | List all configured Conversation apps |
| `list-messaging-templates` | List all available message templates |

### Verification
| Tool | Description |
|------|-------------|
| `number-lookup` | Look up a phone number's status and capabilities |
| `start-sms-verification` | Send an OTP to a phone number |
| `report-sms-verification` | Submit an OTP code to complete verification |

### Voice
| Tool | Description |
|------|-------------|
| `tts-callout` | Place a voice call and read a message aloud using Text-to-Speech |
| `conference-callout` | Connect participants to a shared conference call |
| `manage-conference-participant` | Mute, unmute, hold, or resume a participant |
| `close-conference` | End a conference call |

### Numbers
| Tool | Description |
|------|-------------|
| `list-available-regions` | List regions where phone numbers are available |
| `list-rented-numbers` | List all active phone numbers in the project |
| `search-for-available-numbers` | Search for numbers to rent by region, type, or pattern |
| `rent-sinch-virtual-numbers` | Rent one or more phone numbers |

### Email
| Tool | Description |
|------|-------------|
| `send-email` | Send an email using a template or raw HTML |
| `list-email-templates` | List available email templates |
| `retrieve-email-info` | Get delivery status for a specific email |
| `list-email-events` | View recent delivery events (bounces, opens, clicks) |
| `analytics-metrics` | Get email analytics (open rates, click-through rates) |

### Configuration
| Tool | Description |
|------|-------------|
| `sinch-mcp-configuration` | List all available tools and their status. Use this to validate credentials. |

---

## Useful links

- [Sinch Dashboard](https://dashboard.sinch.com?utm_source=neuralbridge&utm_medium=ide)
- [Sinch Developer Docs](https://developers.sinch.com?utm_source=neuralbridge&utm_medium=ide)
- [Conversation API Reference](https://developers.sinch.com/docs/conversation?utm_source=neuralbridge&utm_medium=ide)
- [Sinch Support](https://support.sinch.com?utm_source=neuralbridge&utm_medium=ide)

## License and support

This Power is covered by the [Apache-2.0](LICENSE) license.
It integrates with the [Sinch MCP Server](https://www.npmjs.com/package/@sinch/mcp) (Apache-2.0).

- [Privacy Policy](https://www.sinch.com/privacy-policy/?utm_source=neuralbridge&utm_medium=ide)
- [Support](https://support.sinch.com?utm_source=neuralbridge&utm_medium=ide)
