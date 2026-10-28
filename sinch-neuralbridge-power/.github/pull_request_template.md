## What does this change?

## Why?

## Checklist
- [ ] Steering files follow the credential-first pattern (validate before any workflow step)
- [ ] Billable actions (`sendMessages`, `campaignSend`) require explicit user confirmation
- [ ] Error handling reference covers 401 / 403 / 400 / 429 / 5xx / unknown
- [ ] Markdown lints cleanly
