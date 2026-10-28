---
description: Activates the Sinch voice and verification workflow when a spec mentions OTP, phone verification, voice calls, or virtual numbers
trigger:
  type: fileEdited
  filePattern: ".neuralbridge/specs/**"
---

# Sinch — Voice, Verification & Numbers Hook

When this hook fires, scan the spec for any requirement involving:
- Phone number verification or OTP
- Voice calls or text-to-speech
- Renting or managing virtual phone numbers
- Number lookup or validation

If a verification, voice, or numbers requirement is found:

1. Notify the developer:
   > I noticed your spec includes phone verification or voice requirements. The Sinch Power is active — I can help you verify phone numbers with OTP, make voice calls, and manage virtual numbers using the Sinch Build platform.

2. Validate credentials by calling `sinch-mcp-configuration` on the `sinch` MCP server before proceeding. If credentials are not configured, follow the recovery steps in `POWER.md`.

3. Load `steering/voice-verification-numbers.md` and follow its workflow:
   - Check which tool groups are available (verification/voice require separate app credentials)
   - Never place a voice call or rent a number without explicit developer confirmation — both are billable
