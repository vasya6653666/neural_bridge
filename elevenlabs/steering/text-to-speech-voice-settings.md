# Text-to-Speech Voice Settings

Use this file only when tuning how a voice sounds rather than how audio is streamed.

## Parameters

| Parameter | Range | Default | Effect |
|-----------|-------|---------|--------|
| `stability` | 0.0 - 1.0 | 0.5 | Higher values make output more consistent; lower values increase expressiveness. |
| `similarity_boost` | 0.0 - 1.0 | 0.75 | Higher values preserve more of the original voice identity. |
| `style` | 0.0 - 1.0 | 0.0 | Adds more stylization on supported models, but can reduce stability. |
| `speed` | 0.7 - 1.2 | 1.0 | Controls speaking speed. |
| `use_speaker_boost` | boolean | true | Improves clarity and similarity; usually leave enabled. |

## Python Example

```python
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

client = ElevenLabs()

audio = client.text_to_speech.convert(
    text="Testing different voice settings.",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_v3",
    voice_settings=VoiceSettings(
        stability=0.5,
        similarity_boost=0.75,
        style=0.0,
        use_speaker_boost=True,
    ),
)
```

## JavaScript Example

```javascript
const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text: "Testing different voice settings.",
  modelId: "eleven_v3",
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true,
  },
});
```

## Recommended Starting Points

### Audiobooks or Narration

```python
VoiceSettings(
    stability=0.7,
    similarity_boost=0.5,
    style=0.0,
)
```

### Conversational Assistants

```python
VoiceSettings(
    stability=0.4,
    similarity_boost=0.75,
    style=0.3,
)
```

### News or Professional Delivery

```python
VoiceSettings(
    stability=0.8,
    similarity_boost=0.6,
    style=0.0,
)
```

### Character Voices

```python
VoiceSettings(
    stability=0.3,
    similarity_boost=0.8,
    style=0.5,
)
```

## Practical Tuning Guidance

- Start from defaults and change one parameter at a time.
- Lower `stability` if the read sounds flat or monotonous.
- Lower `similarity_boost` if you hear artifacts inherited from the source voice.
- Increase `style` only on supported models and only after the baseline voice is stable.
- Test with representative text from the actual use case, not a generic sample sentence.
- Flash models prioritize speed and may not honor all settings as strongly as slower models.
