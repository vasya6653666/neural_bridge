---
name: "elevenlabs"
displayName: "ElevenLabs"
description: "Build with ElevenLabs text to speech, speech to text, agents, sound effects, and music APIs from one consolidated NeuralBridge power."
keywords: ["elevenlabs", "voice", "audio", "text-to-speech", "tts", "speech-to-text", "stt", "scribe", "agents", "convai", "sound-effects", "music", "streaming", "realtime", "widget", "outbound-calls"]
author: "ElevenLabs"
---

# ElevenLabs

Use this power for ElevenLabs developer workflows across text to speech, speech to text, agents, sound effects, and music.

## How NeuralBridge Uses This Power

1. NeuralBridge loads this `POWER.md` into the initial context window.
2. NeuralBridge infers the user's intent from the prompt.
3. NeuralBridge retrieves only the steering files that match that intent.

Do not load all steering files by default. Load the minimum set needed for the task. If the task is only setup or package installation, stay in this `POWER.md` and do not load capability steering files.

## Onboarding

Before using any ElevenLabs capability, confirm:

- `ELEVENLABS_API_KEY` is available in the environment or passed explicitly.
- Internet access to `api.elevenlabs.io` is available.
- The runtime matches the capability:
  - JavaScript or TypeScript server SDK: `@elevenlabs/elevenlabs-js`
  - Browser realtime SDK: `@elevenlabs/client` and optionally `@elevenlabs/react`
  - Python SDK: `elevenlabs`
  - Agent CLI workflows: `@elevenlabs/cli`
- For outbound calls, a Twilio-linked agent phone number is already configured.
- For music generation, the ElevenLabs account has a paid plan.

### Install and Authenticate

#### JavaScript or TypeScript

```bash
npm install @elevenlabs/elevenlabs-js
```

Use `@elevenlabs/elevenlabs-js`, not the deprecated `elevenlabs` npm package.

```javascript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient();
```

If migrating from old packages:

```bash
npm uninstall elevenlabs
npm install @elevenlabs/elevenlabs-js
```

#### Browser Realtime Packages

Install these only for browser-based realtime speech-to-text or browser agent conversations:

```bash
npm install @elevenlabs/client
npm install @elevenlabs/react
```

#### Python

```bash
pip install elevenlabs
```

```python
from elevenlabs.client import ElevenLabs

client = ElevenLabs()
```

#### cURL or REST

```bash
export ELEVENLABS_API_KEY="your-api-key"
```

Include the key with the `xi-api-key` header in every request.

#### Agents CLI

Install this only when creating, syncing, or managing conversational agents from the CLI:

```bash
npm install -g @elevenlabs/cli
elevenlabs auth login
elevenlabs auth whoami
```

Quick agent bootstrap:

```bash
elevenlabs agents init
elevenlabs agents add "My Assistant" --template default
elevenlabs agents push
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_API_KEY` | Required for ElevenLabs API access |

### Capability-Specific Prerequisites

| Capability | Extra requirement |
|-----------|-------------------|
| Browser realtime speech-to-text | Mint a backend single-use token; never expose the API key in the browser |
| Agents widget embedding | Public agent without auth, or a backend endpoint that provides signed URLs |
| Agents outbound calls | Twilio-linked `agent_phone_number_id` configured in ElevenLabs |
| Music | Paid ElevenLabs plan |

## When To Load Steering Files

Load only the exact file that matches the user's requested functionality. Do not load unrelated steering files "just in case."

- Load `steering/text-to-speech-streaming.md` only when the user is generating speech with low latency, streamed playback, WebSocket input streaming, chunk scheduling, flush behavior, or telephony-oriented audio output.
- Load `steering/text-to-speech-voice-settings.md` only when the user is tuning `stability`, `similarity_boost`, `style`, `speed`, or `use_speaker_boost`, or asking how to make a voice more expressive, more consistent, or closer to the source voice.
- Load `steering/speech-to-text-transcription-options.md` only when the user is doing file or URL transcription, diarization, timestamps, keyterms, language hints, webhook-based async transcription, entity detection, or subtitle-generation workflows.
- Load `steering/speech-to-text-realtime-client-side.md` only when the user is building browser or React realtime transcription, capturing microphone audio in the client, minting single-use realtime tokens, or sending manual chunks from the browser.
- Load `steering/speech-to-text-realtime-server-side.md` only when the user is building backend realtime transcription, streaming from server-side URLs, sending PCM chunks from a server, or using the server SDK or raw WebSocket endpoint.
- Load `steering/speech-to-text-realtime-commit-strategies.md` only when the user is deciding between manual commit and VAD, trying to control transcript finalization timing, or passing `previous_text` context into realtime speech-to-text.
- Load `steering/speech-to-text-realtime-events.md` only when the user needs the realtime event schema, event names, message payloads, error handling, or client/server event-processing logic.
- Load `steering/music-api-reference.md` only when the user is composing music, choosing between `compose`, `composition_plan.create`, and `compose_detailed`, editing composition plans, or handling music-specific errors.
- Load `steering/sound-effects-generation.md` only when the user is generating non-speech audio such as Foley, impacts, ambience, loops, or UI sounds, or tuning prompt specificity, loop behavior, duration, and prompt influence.
- Load `steering/agents-configuration.md` only when the user is creating, updating, syncing, or governing agent configuration, including prompts, TTS, ASR, turn-taking, knowledge base, auth, privacy, limits, CRUD, or CLI push/pull workflows.
- Load `steering/agents-client-tools.md` only when the user is adding webhook tools, browser client tools, system tools, tool schemas, or tool-calling best practices for agents.
- Load `steering/agents-widget-embedding.md` only when the user is embedding an agent widget in a site or app, customizing widget appearance, controlling it from JavaScript, integrating it into a frontend framework, or troubleshooting widget loading/audio/CORS issues.
- Load `steering/agents-outbound-calls.md` only when the user is making outbound calls with an agent, using Twilio-linked numbers, overriding conversation config per call, or passing dynamic variables into outbound calls.

### Multi-File Retrieval Rules

- Load no steering files for installation, SDK selection, auth, environment setup, or deprecated package migration. Use this `POWER.md` only.
- Load exactly one steering file when the request is narrowly scoped to one capability.
- Load multiple steering files only when the user clearly spans multiple capabilities in one request, such as configuring an agent and then embedding its widget.
- Prefer the most specific steering file available. For example, use the realtime events file for event payload questions instead of the broader realtime server or client file.

## Available Steering Files

- `steering/text-to-speech-streaming.md`
- `steering/text-to-speech-voice-settings.md`
- `steering/speech-to-text-transcription-options.md`
- `steering/speech-to-text-realtime-client-side.md`
- `steering/speech-to-text-realtime-server-side.md`
- `steering/speech-to-text-realtime-commit-strategies.md`
- `steering/speech-to-text-realtime-events.md`
- `steering/music-api-reference.md`
- `steering/sound-effects-generation.md`
- `steering/agents-configuration.md`
- `steering/agents-client-tools.md`
- `steering/agents-widget-embedding.md`
- `steering/agents-outbound-calls.md`
