# Speech-to-Text Realtime Events

Use this file only when the task is about realtime event names, payloads, message formats, or error handling.

## Sent Messages

### `input_audio_chunk`

```json
{
  "message_type": "input_audio_chunk",
  "audio_base_64": "<base64-encoded-pcm-audio>",
  "sample_rate": 16000
}
```

| Field | Description |
|-------|-------------|
| `message_type` | Always `input_audio_chunk` |
| `audio_base_64` | Base64-encoded PCM audio |
| `sample_rate` | Sample rate in Hz |
| `previous_text` | Optional context on the first chunk only |

### `commit`

```json
{
  "message_type": "commit"
}
```

## Received Events

### `session_started`

```json
{
  "type": "session_started",
  "session_id": "abc123",
  "model_id": "scribe_v2_realtime"
}
```

### `partial_transcript`

```json
{
  "type": "partial_transcript",
  "text": "Hello, how are"
}
```

### `committed_transcript`

```json
{
  "type": "committed_transcript",
  "text": "Hello, how are you today?"
}
```

### `committed_transcript_with_timestamps`

```json
{
  "type": "committed_transcript_with_timestamps",
  "words": [
    { "text": "Hello", "start": 0.0, "end": 0.32, "type": "word" }
  ]
}
```

## Error Event

```json
{
  "type": "error",
  "code": "invalid_audio",
  "message": "Audio format not supported"
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `authentication_failed` | Invalid API key or token |
| `quota_exceeded` | Usage limit reached |
| `invalid_audio` | Unsupported or malformed audio |
| `rate_limited` | Too many requests |
| `session_time_limit_exceeded` | Session ran too long |
| `unaccepted_terms` | Terms must be accepted in dashboard |
| `resource_exhausted` | Capacity issue on the service |
| `transcription_error` | Internal processing failure |

## Event Handling Examples

### Python

```python
async for event in connection:
    if event.type == "session_started":
        print(event.session_id)
    elif event.type == "partial_transcript":
        print(event.text)
    elif event.type == "committed_transcript":
        print(event.text)
    elif event.type == "error":
        print(event.code, event.message)
```

### JavaScript

```javascript
connection.on("session_started", (data) => {
  console.log("Session:", data.sessionId);
});

connection.on("partial_transcript", (data) => {
  console.log("Partial:", data.text);
});

connection.on("committed_transcript", (data) => {
  console.log("Final:", data.text);
});

connection.on("error", (error) => {
  console.error("Error:", error.code, error.message);
});
```

## Practical Guidance

- Use partial events for user feedback only.
- Use committed events for persistence and downstream application state.
- Request timestamp events only when alignment data is needed.
- Treat authentication, rate limiting, and invalid audio as separate recovery paths.
