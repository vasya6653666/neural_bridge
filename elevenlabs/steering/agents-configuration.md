# Agents Configuration

Use this file only when creating, updating, syncing, or governing conversational agent configuration.

## Core Configuration Areas

| Area | Purpose |
|------|---------|
| `conversation_config.agent` | First message, language, response length |
| `conversation_config.tts` | Voice, model, stability, latency tuning |
| `conversation_config.asr` | Realtime recognition model and keyterms |
| `conversation_config.turn` | Turn-taking mode, silence threshold, interruption sensitivity |
| `prompt` | System instructions, model, temperature, tool strictness |
| `platform_settings` | Auth, privacy, and limits |

## Create An Agent

```python
agent = client.conversational_ai.agents.create(
    name="My Agent",
    conversation_config={
        "agent": {
            "first_message": "Hello! How can I help you today?",
            "language": "en",
            "max_tokens_agent_response": 500,
        },
        "tts": {
            "voice_id": "JBFqnCBsd6RMkjVDRZzb",
            "model_id": "eleven_flash_v2_5",
            "stability": 0.5,
            "similarity_boost": 0.75,
            "optimize_streaming_latency": 3,
        },
        "asr": {
            "model_id": "scribe_v2_realtime",
            "keyterms": ["ElevenLabs", "TechCorp"],
        },
        "turn": {
            "mode": "server_vad",
            "silence_threshold_ms": 500,
            "interrupt_sensitivity": 0.5,
        },
    },
    prompt={
        "prompt": "You are a helpful customer service agent.",
        "llm": "gpt-4o-mini",
        "temperature": 0.7,
        "max_tokens": 500,
        "tools_strict_mode": True,
    },
)
```

## Prompt and Model Guidance

- Use `gpt-4o-mini` when latency and cost matter.
- Raise `temperature` only when creativity is useful.
- Keep prompts explicit about tone, safety, escalation behavior, and tool usage.
- Enable `tools_strict_mode` when tool parameter correctness matters.

## Platform Settings

```python
platform_settings={
    "auth": {
        "enable_auth": True,
        "allowlist": ["https://example.com"],
    },
    "privacy": {
        "record_conversation": False,
        "retention_days": 30,
    },
    "call_limits": {
        "max_call_duration_secs": 600,
        "max_concurrent_calls": 10,
    },
}
```

## Knowledge Base

```python
doc = client.conversational_ai.knowledge_base.upload(
    file=open("product_guide.pdf", "rb"),
    name="Product Guide",
)
```

Attach uploaded documents to the agent when the assistant should answer from reference material instead of only from prompt instructions.

## CLI Workflow

Use the CLI when the user wants local agent config files, templates, push or pull workflows, or a Git-friendly agent lifecycle.

```bash
elevenlabs agents init
elevenlabs agents add "Support Bot" --template customer-service
elevenlabs agents push --dry-run
elevenlabs agents push
elevenlabs agents pull --update
```

## CRUD Reference

### List

```python
agents = client.conversational_ai.agents.list()
```

### Get

```python
agent = client.conversational_ai.agents.get(agent_id="your-agent-id")
```

### Update

Only send the fields that should change.

```python
client.conversational_ai.agents.update(
    agent_id="id",
    prompt={"prompt": "New instructions.", "llm": "claude-3-5-sonnet"},
)
```

### Delete

```python
client.conversational_ai.agents.delete(agent_id="your-agent-id")
```

## Best Practices

- Use Flash TTS models for low-latency conversations.
- Tune turn-taking before tuning prompt wording if interruptions feel wrong.
- Keep auth enabled for production SDK sessions and signed URLs.
- Use CLI `push --dry-run` before pushing large agent changes.
