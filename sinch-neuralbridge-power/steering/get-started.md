# Sinch Build — Get Started

Use this workflow when a developer wants to send their first message or validate their Sinch setup.

---

## Step 1 — Validate credentials

Call `sinch-mcp-configuration` on the `sinch` MCP server.

- If it returns available tools → credentials are working. Continue to Step 2.
- If it fails or all tools appear disabled → follow the credential recovery steps in `POWER.md`. Do not continue until credentials are confirmed.

---

## Step 2 — Identify what the developer wants to send

Ask if not already clear:
- **Channel**: SMS, WhatsApp, RCS, Messenger, or other?
- **Recipient**: phone number in E.164 format (e.g. `+12025551234`) or channel-specific ID
- **Message**: the text content

If the developer does not specify a channel, default to SMS.

---

## Step 3 — Check for required config

Before sending, confirm:
- For **SMS**: a sender number is available. Check if `DEFAULT_SMS_ORIGINATOR` is set in env, or ask the developer which number to use as sender.
- For **WhatsApp / RCS**: a Conversation app must be configured. If `CONVERSATION_APP_ID` is not set, call `list-conversation-apps` and ask the developer to choose one.

---

## Step 4 — Show confirmation summary

Before sending, display a summary and wait for explicit approval:

> **Ready to send — please confirm:**
> - Channel: [channel]
> - Recipient: [number or ID]
> - Message: "[message content]"
> - Sender: [sender number or app]
>
> Type **yes** to send, or tell me what to change.

Do not call `send-text-message` until the developer confirms.

---

## Step 5 — Send the message

Call `send-text-message` with:
- `recipient`: the phone number or channel-specific identifier
- `message`: the confirmed text content
- `channel`: the confirmed channel (e.g. `SMS`, `WHATSAPP`, `RCS`)
- `app_id`: the Conversation app ID (if applicable)

---

## Step 6 — Confirm and offer next steps

After a successful send, confirm to the developer and offer:
- Send to another recipient
- Try a different channel
- Send a media or template message

---

## Sending media

Use `send-media-message` when the developer wants to send an image, video, or document. Ask for:
- Recipient and channel
- The media URL (must be publicly accessible)
- Optional caption text

Show the same confirmation summary before sending.

---

## Managing apps and templates

- To see all Conversation apps: `list-conversation-apps`
- To see available message templates: `list-messaging-templates`

---

## Safety rules

- Always show a confirmation summary and wait for approval before sending any message.
- Never fabricate a sender number — use only what is configured or what the developer explicitly provides.
- All phone numbers must be in E.164 format (e.g. `+12025551234`).
