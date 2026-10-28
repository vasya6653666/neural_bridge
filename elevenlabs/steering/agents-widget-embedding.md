# Agents Widget Embedding

Use this file only for embedding the ElevenLabs conversation widget into a website or app.

## Basic Embed

```html
<elevenlabs-convai agent-id="your-agent-id"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

This creates a floating widget button. Public agents without auth are the simplest path. For authenticated sessions, provide a signed URL from your backend.

## Important Attributes

| Attribute | Purpose |
|-----------|---------|
| `agent-id` | Public agent identifier |
| `signed-url` | Authenticated alternative to `agent-id` |
| `variant` | `compact` or `expanded` |
| `avatar-image-url` | Avatar image |
| `avatar-orb-color-1` | Primary orb color |
| `avatar-orb-color-2` | Secondary orb color |
| `action-text` | Hover or CTA text |
| `server-location` | Region selection |

## Signed URL Flow

### Frontend

```html
<elevenlabs-convai id="widget" agent-id="your-agent-id"></elevenlabs-convai>

<script>
  async function startAuthenticatedConversation() {
    const response = await fetch("/api/get-signed-url");
    const { signedUrl } = await response.json();

    const widget = document.getElementById("widget");
    widget.setAttribute("signed-url", signedUrl);
    widget.startConversation();
  }
</script>
```

### Backend

```python
@app.get("/api/get-signed-url")
def get_signed_url():
    signed_url = client.conversational_ai.conversations.get_signed_url(
        agent_id="your-agent-id"
    )
    return {"signedUrl": signed_url.signed_url}
```

## Programmatic Control

```html
<elevenlabs-convai id="my-widget" agent-id="your-agent-id"></elevenlabs-convai>

<script>
  const widget = document.getElementById("my-widget");
  widget.startConversation();
  widget.endConversation();
</script>
```

## Framework Integration

### React

```jsx
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  return <elevenlabs-convai agent-id="your-agent-id"></elevenlabs-convai>;
}
```

### Next.js

```jsx
import Script from "next/script";

export default function Page() {
  return (
    <>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="lazyOnload"
      />
      <elevenlabs-convai agent-id="your-agent-id"></elevenlabs-convai>
    </>
  );
}
```

## Troubleshooting

- If the widget does not appear, verify the script loaded and the agent ID is correct.
- If audio fails, ensure the page is served over HTTPS and the browser has microphone permission.
- If authenticated sessions fail, check the allowlist and signed URL generation.
- If the widget is hidden, inspect page CSS and z-index conflicts.
