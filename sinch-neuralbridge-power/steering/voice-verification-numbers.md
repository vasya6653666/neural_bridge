# Sinch Build — Voice, Verification & Numbers

Use this workflow when a developer wants to verify phone numbers with OTP, make voice calls, or manage virtual phone numbers.

---

## Step 1 — Validate credentials

Call `sinch-mcp-configuration` on the `sinch` MCP server. If it fails, follow the credential recovery steps in `POWER.md` before continuing.

Check which tool groups are available and warn the developer **before attempting any call**:

- **Numbers tools** — require only `PROJECT_ID`, `KEY_ID`, `KEY_SECRET`. Available immediately.
- **Verification tools** (`start-sms-verification`, `report-sms-verification`, `number-lookup`) — require `APPLICATION_KEY` and `APPLICATION_SECRET` from a Verification app. If these are not set, the call will return a 401 Unauthorized error.
- **Voice tools** — require `APPLICATION_KEY` and `APPLICATION_SECRET` from a Voice app.

If the developer wants to use Verification or Voice tools and those credentials are not configured, display this message **before making any tool call**:

> ⚠️ **Verification and Voice tools need additional credentials.**
>
> 1. Go to the [Sinch Dashboard](https://dashboard.sinch.com?utm_source=neuralbridge&utm_medium=ide)
> 2. Navigate to **Verification → Apps** (or **Voice → Apps**)
> 3. Copy the **App Key** and **App Secret**
> 4. Add them to your shell profile:
> ```bash
> echo 'export APPLICATION_KEY=your_app_key' >> ~/.zshrc
> echo 'export APPLICATION_SECRET=your_app_secret' >> ~/.zshrc
> source ~/.zshrc
> ```
> 5. Restart NeuralBridge, then try again.

Do not attempt `start-sms-verification`, `report-sms-verification`, or voice tools until the developer confirms these credentials are set.

---

## Phone number verification (OTP)

### Step 1 — Start verification

Call `start-sms-verification` with:
- `phone_number`: the number to verify, in E.164 format (e.g. `+12025551234`)

This sends an OTP SMS to the number.

### Step 2 — Submit the OTP

When the developer has the code, call `report-sms-verification` with:
- `phone_number`: the same number
- `code`: the OTP the user received

A successful response confirms the number is valid and reachable.

### Number lookup

Use `number-lookup` to check a phone number's status and capabilities (SMS-enabled, active, country) before attempting to send or verify. Good practice before expensive operations.

---

## Voice calls

### Text-to-Speech callout

Use `tts-callout` to place a voice call that reads a message aloud. Ask for:
- `destination`: phone number in E.164 format
- `text`: the message to read (plain text)
- `locale`: optional language/locale code (e.g. `en-US`, `fr-FR`)

Show confirmation before calling — voice calls are billable.

### Conference calls

Use `conference-callout` to connect multiple participants:
1. Ask for all participant phone numbers
2. Show a summary of who will be called
3. Call `conference-callout` after confirmation

Manage participants mid-call with `manage-conference-participant` (mute, unmute, hold, resume).
End the call with `close-conference`.

---

## Virtual phone numbers

### Browse available numbers

1. Call `list-available-regions` to show which regions have numbers available (optionally filter by type: `MOBILE`, `LOCAL`, `TOLL_FREE`)
2. Call `search-for-available-numbers` with the developer's preferred region, type, and pattern

### View existing numbers

Call `list-rented-numbers` to show all active numbers in the project.

### Rent a number

Show the developer the search results, then confirm before renting:

> **Ready to rent — please confirm:**
> - Number: [number]
> - Region: [region]
> - Type: [type]
> - Monthly cost will apply
>
> Type **yes** to rent, or tell me what to change.

Call `rent-sinch-virtual-numbers` only after explicit confirmation — renting a number creates a recurring charge.

---

## Safety rules

- Always confirm before placing a voice call or renting a number — both are billable.
- All phone numbers must be in E.164 format (e.g. `+12025551234`).
- Do not attempt verification or voice tools if `APPLICATION_KEY` / `APPLICATION_SECRET` are not configured — check `sinch-mcp-configuration` first.
