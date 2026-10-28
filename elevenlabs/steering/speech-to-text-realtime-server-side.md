# Speech-to-Text Realtime Server-Side

Use this file only for backend realtime transcription, server SDK usage, streamed URLs, or raw audio chunks sent from a server.

## When To Prefer Server-Side Realtime

- The audio source is a server-side stream or file.
- The server needs direct control over commit timing.
- The browser should not connect directly to ElevenLabs.
- The app needs to proxy or normalize raw PCM audio before transcription.

## Stream a Remote Audio URL

### Python

```python
import asyncio
import os
from elevenlabs.client import ElevenLabs
from elevenlabs import RealtimeEvents, RealtimeUrlOptions

async def main():
    elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))
    stop_event = asyncio.Event()

    connection = await elevenlabs.speech_to_text.realtime.connect(RealtimeUrlOptions(
        model_id="scribe_v2_realtime",
        url="https://npr-ice.streamguys1.com/live.mp3",
        include_timestamps=True,
    ))

    connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, lambda data: print(data.get("text", "")))
    connection.on(RealtimeEvents.ERROR, lambda error: stop_event.set())

    try:
        await stop_event.wait()
    finally:
        await connection.close()

asyncio.run(main())
```

### JavaScript

```javascript
import { ElevenLabsClient, RealtimeEvents } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient();

const connection = await client.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
  url: "https://npr-ice.streamguys1.com/live.mp3",
  includeTimestamps: true,
});

connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
  console.log("Partial", data);
});
```

## Send PCM Chunks Manually

### Audio Requirements

| Parameter | Value |
|-----------|-------|
| Format | PCM 16-bit |
| Sample rate | 16000 Hz recommended |
| Channels | Mono |
| Chunk size | About 32,000 bytes for 1 second at 16 kHz |

### JavaScript

```javascript
import * as fs from "node:fs";
import { AudioFormat, ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient();

const connection = await client.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
  audioFormat: AudioFormat.PCM_16000,
  sampleRate: 16000,
  includeTimestamps: true,
});

const audioBuffer = fs.readFileSync("audio.pcm");
const chunkSize = 32000;

for (let i = 0; i < audioBuffer.length; i += chunkSize) {
  const chunk = audioBuffer.subarray(i, i + chunkSize);
  connection.send({
    audioBase64: chunk.toString("base64"),
    sampleRate: 16000,
  });
}

connection.commit();
```

## Raw WebSocket Fallback

Use the raw WebSocket endpoint only when the SDK cannot be used:

```text
wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime
```

### Input Message

```json
{
  "message_type": "input_audio_chunk",
  "audio_base_64": "<base64-encoded-audio>",
  "sample_rate": 16000
}
```

### Commit Message

```json
{
  "message_type": "commit"
}
```

## Best Practices

- Normalize audio to mono PCM before streaming when possible.
- Use server-side realtime for remote streams, telephony, and integration backends.
- Send chunks at real-time pace if you want transcript timing to track the live source closely.
- Pair this file with the commit strategies or event reference steering files only when the user explicitly needs those details.
