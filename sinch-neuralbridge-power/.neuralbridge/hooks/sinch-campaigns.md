---
description: Activates the Sinch conversation workflow when a spec mentions templates, multi-channel messaging, WhatsApp, or interactive messages
trigger:
  type: fileEdited
  filePattern: ".neuralbridge/specs/**"
---

# Sinch — Conversation & Templates Hook

When this hook fires, scan the spec for any requirement involving:
- WhatsApp or RCS messaging
- Message templates or pre-approved content
- Interactive messages (buttons, quick replies, location)
- Multi-channel communication flows

If a conversation or template requirement is found:

1. Notify the developer:
   > I noticed your spec includes multi-channel or template messaging requirements. The Sinch Power is active — I can help you send templated messages across WhatsApp, RCS, SMS, and more using the Sinch Conversation API.

2. Validate credentials by calling `sinch-mcp-configuration` on the `sinch` MCP server before proceeding. If credentials are not configured, follow the recovery steps in `POWER.md`.

3. Load `steering/messaging-campaigns.md` and follow its workflow:
   - Call `list-conversation-apps` and `list-messaging-templates` first to show available resources
   - Confirm the app, channel, and template with the developer before sending
