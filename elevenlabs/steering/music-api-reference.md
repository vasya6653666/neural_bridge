# Music API Reference

Use this file only for ElevenLabs music generation workflows.

## Choose The Right Method

| Method | Use when | Returns |
|--------|----------|---------|
| `compose` | Fast prompt-based generation or composition-plan playback | Audio stream |
| `composition_plan.create` | You need a structured plan before generating audio | Composition plan JSON |
| `compose_detailed` | You want audio plus plan and metadata in one response | Audio plus metadata |

## `compose`

Generate music from a prompt or from a prepared composition plan.

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | Music description |
| `composition_plan` | object | Use instead of `prompt`, never together |
| `music_length_ms` | integer | Track duration in milliseconds |
| `model_id` | string | Defaults to `music_v1` |
| `force_instrumental` | boolean | Force instrumental output in prompt mode |
| `respect_sections_durations` | boolean | Enforce section durations in a plan |

### Python

```python
audio = client.music.compose(
    prompt="An upbeat electronic track with synth leads",
    music_length_ms=30000,
)

with open("output.mp3", "wb") as f:
    for chunk in audio:
        f.write(chunk)
```

### JavaScript

```javascript
const audio = await client.music.compose({
  prompt: "An upbeat electronic track with synth leads",
  musicLengthMs: 30000,
});
```

## `composition_plan.create`

Generate a structured plan for more granular control.

### Python

```python
plan = client.music.composition_plan.create(
    prompt="A peaceful ambient track with nature sounds",
    music_length_ms=60000,
)

for section in plan.sections:
    print(section.name, section.duration_ms)
```

### Response Shape

```json
{
  "positiveGlobalStyles": ["jazz", "smooth", "warm"],
  "negativeGlobalStyles": ["aggressive", "distorted"],
  "sections": [
    {
      "name": "Intro",
      "localStyles": ["soft", "building"],
      "duration_ms": 15000,
      "lines": [
        { "text": "Instrumental intro", "type": "instrumental" }
      ]
    }
  ]
}
```

## `compose_detailed`

Use this when the app needs both the audio and the generated plan or metadata.

```python
result = client.music.compose_detailed(
    prompt="A pop song about summer adventures",
    music_length_ms=120000,
)

print(result.json)

with open(result.filename, "wb") as f:
    f.write(result.audio)
```

## Error Handling

### `bad_prompt`

Prompts that directly reference copyrighted artists, bands, or lyrics can be rejected. The response may include a safer prompt suggestion.

### `bad_composition_plan`

Composition plans can also be rejected if they contain copyrighted styles or restricted content.

### Common HTTP Errors

| Code | Meaning |
|------|---------|
| 401 | Invalid API key |
| 422 | Invalid parameters |
| 429 | Rate limit exceeded |

## Practical Guidance

- Start with `compose` when speed matters more than control.
- Use `composition_plan.create` when sections, style arcs, or lyrics structure matter.
- Use `compose_detailed` when the application needs both the rendered audio and the underlying plan.
- Avoid copyrighted artist references; describe mood, instrumentation, tempo, and structure instead.
