# Sinch power for NeuralBridge

A NeuralBridge Power that connects the [Sinch Build platform](https://dashboard.sinch.com?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build) to your AI-assisted development workflow — send SMS, WhatsApp, and RCS messages, verify phone numbers, make voice calls, and manage virtual numbers without leaving your IDE.

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

## Setup

Export credentials to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Required
echo 'export PROJECT_ID=your_project_id' >> ~/.zshrc
echo 'export KEY_ID=your_key_id' >> ~/.zshrc
echo 'export KEY_SECRET=your_key_secret' >> ~/.zshrc
source ~/.zshrc
```

Find your credentials in the [Sinch Dashboard](https://dashboard.sinch.com?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build):
- `PROJECT_ID` — shown in the top toolbar
- `KEY_ID` / `KEY_SECRET` — under Settings → Access Keys

Restart NeuralBridge after setting variables.

## What you can do

| Say this in NeuralBridge | What happens |
|------------------|-------------|
| "Send an SMS with Sinch" | Guides you through sending a message with confirmation |
| "Send a WhatsApp message using a template" | Lists your templates and sends with approval |
| "Verify a phone number with OTP" | Sends an OTP and submits the code |
| "Make a text-to-speech voice call" | Places a TTS call with confirmation |
| "Find available phone numbers in the US" | Searches and rents virtual numbers |

## Workflows

- **[Get Started](steering/get-started.md)** — validate credentials, send first message
- **[Conversation & Templates](steering/messaging-campaigns.md)** — WhatsApp templates, multi-channel, interactive messages
- **[Voice, Verification & Numbers](steering/voice-verification-numbers.md)** — OTP, TTS calls, virtual number management

## Privacy

Use of Sinch APIs through this Power is governed by the [Sinch Privacy Notice](https://sinch.com/legal/privacy-notice/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build). When users use this Power to access Sinch APIs, their use of the applicable Sinch services is subject to the [Sinch Privacy Notice](https://sinch.com/legal/privacy-notice/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build) and, where applicable, the [Sinch Data Processing Agreement](https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/data-processing-agreement/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build).

## License

[Apache-2.0](LICENSE)

## Important

This Power is a developer tool that helps you interact with Sinch APIs through NeuralBridge. It is not a standalone service. Use of Sinch APIs requires a Sinch account and is subject to the [Sinch Terms of Service](https://sinch.com/legal/terms-and-conditions/other-sinch-terms-conditions/terms-of-service/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build), [Privacy Notice](https://sinch.com/legal/privacy-notice/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build), and [Acceptable Use Policy](https://sinch.com/legal/policies-statements/sinch-voice-policies-statements/acceptable-use-policy/?utm_source=neuralbridge&utm_medium=power&utm_campaign=sinch-build). Sinch does not control or operate the NeuralBridge platform and is not responsible for its availability, performance, functionality, or operation.
