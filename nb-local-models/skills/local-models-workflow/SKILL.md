---
name: "local-models-workflow"
description: "Safe order of work with the lm_* tools on models the user runs with Ollama or llama.cpp llama-server: detect the servers, list and inspect models, run a prompt or embeddings, free memory, and download or delete Ollama models only through a plan the user approved. Use whenever the user asks about their local models, wants to try a prompt on one, compare models, compute embeddings, or pull, remove or unload a model."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Working with local models
The power's MCP server talks to model servers the user already runs, over HTTP: Ollama and llama-server from llama.cpp.
It never starts a server, installs software or downloads anything on its own. Work in this order.
## 1. Find the servers
Call `lm_detect` first. It shows, for each server, the address, whether it is local or **remote**, and whether it answers.
- If a server does not answer, tell the user how to start it (the Ollama app or `ollama serve`; `llama-server -m
  <model.gguf>`) or which variable to set (`OLLAMA_HOST`, `NB_LLAMACPP_URL`) and to restart the IDE. Do not guess other
  addresses and do not try to start anything yourself.
- llama-server answering "model still loading" just needs time; try again shortly.
- An HTTP 401 from llama-server means it was started with `--api-key`: the user sets `NB_LLAMACPP_API_KEY`.
- If an address is remote, keep in mind that prompts you send leave the user's machine. Mention it once when you first use
  it.
## 2. Know the models
`lm_list_models` lists Ollama models on disk and those loaded in memory (with VRAM share and unload time), and the
model llama-server serves. Use the exact names it returns. `lm_show_model` gives an Ollama model's context length,
capabilities (for example `tools`, `vision`, `embedding`) and default parameters; check it before relying on a long
context or a capability.
## 3. Run a prompt or embeddings
- `lm_chat` sends one non-streaming request. Pass `backend` and, for Ollama, `model`. Keep prompts self-contained; the
  server keeps no history, so include earlier turns in `messages` when needed. Use `format: "json"` or a JSON schema when
  you need structured output, and still validate what comes back.
- With Ollama, the first request to a model that is not in memory loads it, which can take from seconds to minutes and
  uses RAM/VRAM. Warn the user before loading a large model, and use `keepAlive` (for example `"0"`) when they want memory
  freed right after.
- The metrics line (tokens, time, tokens per second) is useful when the user compares models; report it.
- `lm_embed` returns a preview of each vector (dimension, norm, first numbers). Ask for `full: true` only when the user
  needs the numbers themselves. llama-server embeds only when started with `--embeddings`.
- Do not paste secrets or private files into prompts unless the user asked you to, especially on a remote server.
## 4. Free memory
`lm_unload` removes a model from Ollama memory; the files stay on disk and the next request loads it again. It is safe to
call when the user wants RAM/VRAM back.
## 5. Download or delete a model (plan first)
These change the user's disk, so always go through the plan:
1. Call `lm_pull_plan` or `lm_delete_plan` with the model name.
2. Show the plan to the user in your own words: which model, which server, and
   - for a download: that the size is unknown in advance and may be many GB, and whether an older copy exists;
   - for a deletion: the size, date and digest, and that it cannot be undone.
3. Wait for an explicit "yes". Only then call `lm_pull_apply` / `lm_delete_apply` with the plan id. Never call an apply tool
   on your own initiative, and never with an id you did not get from the matching plan tool in this conversation.
A download can run for a long time; the tool waits up to 2 hours. If it fails part-way, make a new plan and, with the
user's approval, pull again: Ollama resumes from where it stopped.
If an apply tool refuses (plan not found, used, expired, made for another server, or the model changed), do not work
around it: make a fresh plan and ask the user again.
## Reporting back
The user does not see raw API output. Summarise: which server and model you used, the answer or the result, and the
metrics if relevant. API keys and passwords never appear in tool output; do not ask the user to paste them into the chat.
