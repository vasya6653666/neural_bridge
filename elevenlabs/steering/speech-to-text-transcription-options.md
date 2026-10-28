# Speech-to-Text Transcription Options

Use this file only for non-realtime transcription and transcription-quality controls such as diarization, timestamps, language hints, keyterms, or async webhook processing.

## Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | file | Audio or video file to transcribe |
| `model_id` | string | Use `scribe_v2` for batch transcription |
| `language_code` | string | Optional ISO 639-1 or ISO 639-3 language hint |
| `timestamps_granularity` | string | `none`, `word`, or `character` |
| `diarize` | boolean | Enable speaker diarization |
| `num_speakers` | integer | Maximum expected speakers |
| `diarization_threshold` | number | Sensitivity tuning for diarization |
| `keyterms` | array | Domain terms to bias recognition |
| `tag_audio_events` | boolean | Detect laughter, applause, and similar events |
| `entity_detection` | string or array | Detect categories such as `pii`, `phi`, or `pci` |
| `use_multi_channel` | boolean | Split multichannel audio into separate transcripts |
| `cloud_storage_url` | string | Transcribe a hosted file without upload |
| `webhook` | boolean | Process asynchronously and deliver results by webhook |
| `webhook_metadata` | string or object | Echo custom metadata in webhook responses |

## Examples

### Python

```python
from elevenlabs.client import ElevenLabs

client = ElevenLabs()

with open("audio.mp3", "rb") as audio_file:
    result = client.speech_to_text.convert(
        file=audio_file,
        model_id="scribe_v2",
        language_code="eng",
        timestamps_granularity="word",
        diarize=True,
        keyterms=["ElevenLabs", "Scribe"],
    )
```

### JavaScript

```javascript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createReadStream } from "node:fs";

const client = new ElevenLabsClient();

const result = await client.speechToText.convert({
  file: createReadStream("audio.mp3"),
  modelId: "scribe_v2",
  languageCode: "eng",
  timestampsGranularity: "word",
  diarize: true,
  keyterms: ["ElevenLabs", "Scribe"],
});
```

### cURL

```bash
curl -X POST "https://api.elevenlabs.io/v1/speech-to-text" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "file=@audio.mp3" \
  -F "model_id=scribe_v2" \
  -F "language_code=eng" \
  -F "timestamps_granularity=word" \
  -F "diarize=true"
```

## Response Shape

```json
{
  "text": "The complete transcribed text from the audio file.",
  "language_code": "eng",
  "language_probability": 0.98,
  "words": [
    {
      "text": "The",
      "start": 0.0,
      "end": 0.15,
      "type": "word",
      "speaker_id": "speaker_0"
    }
  ]
}
```

## Supported Inputs

- Audio: MP3, WAV, M4A, FLAC, OGG, WebM, AAC, AIFF, Opus
- Video: MP4, AVI, MKV, MOV, WMV, FLV, WebM, MPEG, 3GPP
- Maximum file size: 3 GB
- Maximum duration: 10 hours

## Common Workflows

- Enable `diarize=true` for meetings, interviews, and support calls.
- Use `timestamps_granularity="word"` for subtitles, captions, and transcript alignment.
- Pass `keyterms` for product names, proper nouns, and jargon.
- Use `cloud_storage_url` when the media already lives in object storage.
- Use `webhook=true` for long media or asynchronous backends.

## Language Guidance

Use ISO codes such as `eng`, `spa`, `fra`, `deu`, `ita`, `por`, `jpn`, `kor`, or `zho`. Provide a language hint when the language is known to reduce ambiguity.
