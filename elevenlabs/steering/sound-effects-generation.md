# Sound Effects Generation

Use this file only for non-speech audio generation such as ambience, Foley, impacts, textures, or UI sounds.

## Request Shape

Sound effects generation is prompt-driven. Use a direct description of the desired sound and then refine with duration, looping, output format, and prompt influence as needed.

### cURL

```bash
curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Thunder rumbling in the distance",
    "duration_seconds": 6,
    "prompt_influence": 0.7
  }' \
  --output thunder.mp3
```

## Prompting Guidance

- Use concrete acoustic language, not abstract emotional language alone.
- Describe the source, environment, intensity, and tail.
- Add whether the sound should loop seamlessly.
- For UI sounds, specify brevity and texture, such as "soft glassy confirm click" or "short muted error buzz".

### Better Prompts

- "A seamless nighttime forest ambience with crickets, distant owls, and a soft wind bed"
- "A heavy cinematic metal door slam with a long industrial reverb tail"
- "A short, clean mobile success chime with a modern glass texture"

### Weaker Prompts

- "Cool sound"
- "Something dramatic"
- "Make an ambience"

## Common Controls

| Control | Purpose |
|---------|---------|
| `duration_seconds` | Set an explicit target length |
| `loop` | Request a seamless looping output |
| `prompt_influence` | Balance strict prompt adherence versus creative variation |
| `output_format` | Choose a format appropriate for the delivery target |

## Use Cases

### Ambient Loop

Prefer:

- medium duration
- `loop=true`
- lower-to-medium prompt influence if some natural variation is acceptable

### UI Sound

Prefer:

- very short duration
- highly specific material words like click, tap, chime, buzz, whoosh
- a more constrained prompt

### Cinematic Impact

Prefer:

- explicit transient words like slam, hit, crash, boom
- detail about decay and reverb tail
- no looping

## Practical Guidance

- Use specific prompts for higher-quality outputs.
- Use `loop=true` for background beds and ambient environments.
- Increase prompt specificity before increasing prompt influence.
- Generate a few nearby variants and compare for fit if the first result is close but not exact.
