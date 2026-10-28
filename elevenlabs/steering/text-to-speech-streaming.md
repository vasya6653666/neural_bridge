# Text-to-Speech Streaming

Use this file only for low-latency text-to-speech, streamed playback, WebSocket text input, and chunk scheduling.

## Model Selection

| Model | Latency | Use case |
|-------|---------|----------|
| `eleven_flash_v2_5` | ~75ms | Lowest-latency multilingual streaming |
| `eleven_flash_v2` | ~75ms | Lowest-latency English streaming |
| `eleven_turbo_v2_5` | Low | Better quality with still-low latency |

Use Flash models for realtime playback. Do not use WebSocket input streaming with `eleven_v3`.

## SDK Streaming

### Python

```python
from elevenlabs.client import ElevenLabs

client = ElevenLabs()

audio_stream = client.text_to_speech.convert(
    text="This is a streaming example with ultra-low latency.",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_flash_v2_5",
)

with open("output.mp3", "wb") as f:
    for chunk in audio_stream:
        f.write(chunk)
```

### JavaScript

```javascript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream } from "node:fs";

const client = new ElevenLabsClient();

const audioStream = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text: "Streaming audio in JavaScript.",
  modelId: "eleven_flash_v2_5",
});

audioStream.pipe(createWriteStream("output.mp3"));
```

## WebSocket Input Streaming

Use the WebSocket endpoint when text arrives incrementally, such as from an LLM or turn-by-turn agent response.

```text
wss://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream-input?model_id={modelId}
```

### Message Flow

1. Open the socket and send an initialization payload.
2. Send text chunks as they become available.
3. Send `flush: true` at sentence boundaries when you need immediate generation.
4. Send an empty `text` string to close the stream.
5. Read base64 audio chunks until `isFinal`.

### Initialization Message

```json
{
  "text": " ",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.8,
    "use_speaker_boost": false
  },
  "generation_config": {
    "chunk_length_schedule": [120, 160, 250, 290]
  },
  "xi_api_key": "your_api_key"
}
```

### Incremental Text

```json
{ "text": "Hello, " }
```

### Force Immediate Audio

```json
{ "text": "End of sentence.", "flush": true }
```

### Close Stream

```json
{ "text": "" }
```

## Key Parameters

| Parameter | Description |
|-----------|-------------|
| `chunk_length_schedule` | Character thresholds before audio generation starts. Lower values reduce latency; higher values improve prosody. |
| `flush` | Forces immediate generation without waiting for the next threshold. |
| `voice_settings` | Per-message tuning for `stability`, `similarity_boost`, and `use_speaker_boost`. |

## Output Events

### Audio Chunk

```json
{
  "audio": "base64_encoded_audio_data"
}
```

### Final Event

```json
{
  "isFinal": true
}
```

## Best Practices

- Use `eleven_flash_v2_5` for multilingual realtime experiences.
- Use `flush: true` at turn endings so the user hears the final buffered text promptly.
- Keep the socket alive if needed; inactivity can close the connection after about 20 seconds.
- Buffer a small amount of audio before playback to avoid choppy output.
- Prefer `pcm_24000` for low-latency processing, `mp3_44100_128` for direct playback, and `ulaw_8000` for telephony pipelines.
