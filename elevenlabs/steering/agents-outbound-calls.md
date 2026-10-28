# Agents Outbound Calls

Use this file only for agent-initiated phone calls through a Twilio-linked ElevenLabs number.

## Prerequisites

- An existing ElevenLabs agent
- A configured `agent_phone_number_id` linked to Twilio
- `ELEVENLABS_API_KEY`
- Destination phone numbers in E.164 format

## Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `agent_id` | string | Agent to place the call |
| `agent_phone_number_id` | string | Linked outbound phone number ID |
| `to_number` | string | Destination number in E.164 format |
| `conversation_initiation_client_data` | object | Optional per-call overrides |

## JavaScript

```javascript
const response = await client.conversationalAi.twilio.outboundCall({
  agentId: "your-agent-id",
  agentPhoneNumberId: "your-phone-number-id",
  toNumber: "+1234567890",
  conversationInitiationClientData: {
    conversationConfigOverride: {
      agent: {
        firstMessage: "Hello! This is a reminder about your appointment tomorrow.",
        language: "en",
      },
      tts: {
        voiceId: "JBFqnCBsd6RMkjVDRZzb",
      },
    },
    dynamicVariables: {
      customer_name: "John",
      appointment_time: "2:00 PM",
    },
  },
});
```

## Python

```python
response = client.conversational_ai.twilio.outbound_call(
    agent_id="your-agent-id",
    agent_phone_number_id="your-phone-number-id",
    to_number="+1234567890",
    conversation_initiation_client_data={
        "conversation_config_override": {
            "agent": {
                "first_message": "Hello! This is a reminder about your appointment tomorrow.",
                "language": "en",
            },
            "tts": {
                "voice_id": "JBFqnCBsd6RMkjVDRZzb",
            },
        },
        "dynamic_variables": {
            "customer_name": "John",
            "appointment_time": "2:00 PM",
        },
    },
)
```

## Override Areas

| Area | Typical use |
|------|-------------|
| `agent.first_message` | Personalize the opening line |
| `agent.language` | Change spoken language per call |
| `tts.voice_id` | Swap the speaking voice |
| `prompt` | Apply call-specific instructions |
| `dynamic_variables` | Inject customer-specific data |

Reference `dynamic_variables` in the prompt using `{{variable_name}}`.

## Response Shape

```json
{
  "success": true,
  "message": "Call initiated successfully",
  "conversation_id": "conv_abc123",
  "callSid": "CA1234567890abcdef"
}
```

## Best Practices

- Personalize the opening line and variables per recipient.
- Keep outbound prompts narrow and task-specific.
- Validate phone-number formatting before placing calls.
- Use call-specific overrides instead of mutating the base agent for one-off campaigns.
