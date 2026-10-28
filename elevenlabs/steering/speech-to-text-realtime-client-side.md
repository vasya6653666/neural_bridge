# Speech-to-Text Realtime Client-Side

Use this file only for browser or React realtime transcription. Do not use it for backend streaming.

## Security Rule

Never expose `ELEVENLABS_API_KEY` in the browser. Generate a single-use token on the backend and pass that token to the client.

## Backend Token Endpoint

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.get("/scribe-token", yourAuthMiddleware, async (req, res) => {
  const token = await elevenlabs.tokens.singleUse.create("realtime_scribe");
  res.json(token);
});
```

Single-use tokens expire quickly, so mint them just before the session starts.

## React Example

```typescript
import { useState } from "react";
import { useScribe } from "@elevenlabs/react";

function TranscriptionComponent() {
  const [transcript, setTranscript] = useState("");

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      setTranscript((prev) => prev + data.text);
    },
  });

  const startRecording = async () => {
    const tokenResponse = await fetch("/scribe-token");
    const { token } = await tokenResponse.json();

    await scribe.connect({
      token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  };

  return (
    <div>
      <div>Status: {scribe.status}</div>
      <button onClick={startRecording}>Start</button>
      <button onClick={() => scribe.disconnect()}>Stop</button>
      <p>{transcript}</p>
    </div>
  );
}
```

## Browser JavaScript Example

```typescript
import { Scribe, RealtimeEvents } from "@elevenlabs/client";

async function startTranscription() {
  const tokenResponse = await fetch("/scribe-token");
  const { token } = await tokenResponse.json();

  const connection = Scribe.connect({
    token,
    modelId: "scribe_v2_realtime",
    includeTimestamps: true,
    microphone: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
    console.log("Partial:", data.text);
  });

  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
    console.log("Committed:", data.text);
  });
}
```

## Manual Chunking

Use manual chunking for prerecorded audio or custom browser sources:

```typescript
const chunkSize = 4096;

for (let offset = 0; offset < pcmData.length; offset += chunkSize) {
  const chunk = pcmData.slice(offset, offset + chunkSize);
  const bytes = new Uint8Array(chunk.buffer);
  const base64 = btoa(String.fromCharCode(...bytes));

  scribe.sendAudio(base64);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

scribe.commit();
```

## Microphone Settings

| Option | Purpose |
|--------|---------|
| `echoCancellation` | Reduce speaker echo |
| `noiseSuppression` | Remove background noise |
| `autoGainControl` | Normalize volume |

## Best Practices

- Protect the token endpoint with your own auth.
- Use client-side realtime only when the microphone or UI lives in the browser.
- Request timestamps only when needed.
- Use VAD for conversational capture and manual commit for fully controlled chunking.
