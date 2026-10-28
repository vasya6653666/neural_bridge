# Speech-to-Text Realtime Commit Strategies

Use this file only when deciding when transcripts should finalize in realtime speech-to-text.

## Transcript Types

| Type | Meaning | Typical use |
|------|---------|-------------|
| Partial | Interim hypothesis that may change | Live UI feedback |
| Committed | Finalized transcript segment | Persisted transcript |
| Committed with timestamps | Finalized transcript plus timing | Captions, subtitles, alignment |

## Manual Commit

Use manual commit when the application already knows where boundaries should be.

### Python

```python
async with client.speech_to_text.realtime.connect(
    model_id="scribe_v2_realtime",
) as connection:
    await connection.send({
        "audio_base_64": audio_base_64,
        "sample_rate": 16000,
    })

    await connection.commit()
```

### JavaScript

```javascript
const connection = await client.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
});

connection.send({
  audioBase64,
  sampleRate: 16000,
});

connection.commit();
```

### Manual Commit Guidance

- Commit during silence, sentence endings, or speaker changes.
- Commit every 20 to 30 seconds for long streams.
- Expect an automatic commit after long uncommitted sessions.

## Voice Activity Detection

Use VAD for live microphone input when natural pauses should drive transcript boundaries.

```javascript
const connection = await client.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
  vad: {
    silenceThresholdSecs: 1.5,
    threshold: 0.4,
    minSpeechDurationMs: 100,
    minSilenceDurationMs: 100,
  },
});
```

### VAD Parameters

| Parameter | Effect |
|-----------|--------|
| `silenceThresholdSecs` | Silence length before a commit |
| `threshold` | Speech detection sensitivity |
| `minSpeechDurationMs` | Ignore extremely short bursts of speech |
| `minSilenceDurationMs` | Ignore tiny pauses |

## `previous_text` Context

Pass short prior context with the first chunk to improve continuity:

```python
await connection.send({
    "audio_base_64": first_chunk,
    "sample_rate": 16000,
    "previous_text": "So as I was saying,"
})
```

Keep `previous_text` short and only use it when the current segment is a continuation of prior speech.

## Which Strategy To Use

- Use VAD for live microphone capture and conversational UX.
- Use manual commit for files, known segment boundaries, and server pipelines.
- Use committed transcripts, not partials, as the source of truth for storage or downstream processing.
