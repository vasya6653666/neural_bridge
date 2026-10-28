# Sinch Build — Conversation & Templates

Use this workflow when a developer wants to use templates, send across multiple channels, or set up a Conversation app.

---

## Step 1 — Validate credentials

Call `sinch-mcp-configuration` on the `sinch` MCP server. If it fails, follow the credential recovery steps in `POWER.md` before continuing.

---

## Step 2 — Identify the use case

Ask what the developer wants to do:
- **Send a templated message** (WhatsApp approved template, omni-channel template)
- **List available apps or templates**
- **Send interactive messages** (buttons, quick replies, location)

---

## Step 3 — List available resources

Before building any message, fetch the current state:
- Call `list-conversation-apps` to show available apps and their channels
- Call `list-messaging-templates` to show available templates (omni-channel and WhatsApp-specific)

Present the results to the developer and confirm which app and template to use.

---

## Step 4 — Template messages

### WhatsApp templates

Use `send-whatsapp-template-message` for approved WhatsApp templates. Required:
- `template_name`: the exact approved template name (from `list-messaging-templates`)
- `recipient`: phone number in E.164 format
- `language`: template language code (e.g. `en`, `es`, `fr`)
- `app_id`: the Conversation app ID

### Omni-channel templates

Use `send-template-message` for templates that work across multiple channels. Required:
- `template_id`: from `list-messaging-templates`
- `recipient`: phone number or channel-specific ID
- `channel`: the target channel
- `app_id`: the Conversation app ID

---

## Step 5 — Interactive messages

### Choice messages (buttons / quick replies)

Use `send-choice-message` when the developer wants to add interactive options to a message. Ask for:
- Recipient, channel, and message text
- The choices (button labels) — maximum 3 for most channels

### Location messages

Use `send-location-message` when the developer wants to send a map pin. Ask for:
- Recipient and channel
- Latitude and longitude, or a place name (use geocoding if `GEOCODING_API_KEY` is set)

---

## Step 6 — Confirmation before sending

Always show a summary before any send:

> **Ready to send — please confirm:**
> - Type: [text / template / choice / location]
> - Channel: [channel]
> - Recipient: [number or ID]
> - App: [app_id]
> - Content: [summary of what will be sent]
>
> Type **yes** to send, or tell me what to change.

---

## Safety rules

- Never send a WhatsApp template message without verifying the template name exists via `list-messaging-templates` — sending an unknown template name results in an error.
- Always confirm the Conversation app and channel before sending — a mismatch will fail.
- All phone numbers must be in E.164 format.
