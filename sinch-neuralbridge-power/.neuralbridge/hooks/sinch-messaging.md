---
description: Activates the Sinch messaging workflow when a spec mentions SMS, WhatsApp, RCS, or any message sending requirement
trigger:
  type: fileEdited
  filePattern: ".neuralbridge/specs/**"
---

# Sinch — Messaging Hook

When this hook fires, scan the spec for any requirement involving:
- Sending SMS, WhatsApp, RCS, or multi-channel messages
- Push or in-app notifications via messaging
- User alerts, OTPs, or transactional messages
- Any mention of Sinch or a CPaaS provider

If a messaging requirement is found:

1. Notify the developer:
   > I noticed your spec includes SMS/messaging requirements. The Sinch Power is active — I can help you implement this using the Sinch Build platform.

2. Validate credentials by calling `sinch-mcp-configuration` on the `sinch` MCP server before proceeding. If credentials are not configured, follow the recovery steps in `POWER.md`.

3. Load `steering/get-started.md` and follow its workflow to implement the messaging requirement from the spec.

Do not send any messages without showing the developer a confirmation summary first.
