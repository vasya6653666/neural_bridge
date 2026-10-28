---
name: connect-n8n
description: "Set up and verify the n8n MCP connection before using n8n tools. Run on the first turn touching n8n, when resuming from a context summary, or when tools are missing, OAuth fails, a request times out, or the instance changes. Uses public-client OAuth and NeuralBridge's native MCP settings."
compatibility: Requires Node.js 22+, local NeuralBridge IDE, n8n 2.43.7+, and instance-level MCP enabled. All NeuralBridge versions are accepted; no version has a recorded live acceptance yet, so every detected or undetected version warns and setup continues.
metadata:
  author: n8n
  version: "1.0.0"
---

# Connect to n8n

Tools come from a native NeuralBridge MCP connection. Apply the preflight before the
first n8n tool call, when switching instances, and after connection or access
failures. Reuse a verified connection for subsequent operations.

## Verify the intended connection

1. Identify the intended instance and native MCP server. Inspect existing
   connections first; preserve user-created OAuth and token connections. The
   helper defaults to `n8n-<host>-<hash>`; custom names are also valid.
2. Confirm its endpoint, configuration scope and observed NeuralBridge status. Clarify
   ambiguous instances before workflow operations; never pick production by order.
3. Use the cheapest advertised read tool and its actual schema, such as a small
   workflow search. If none is available, report only discovery as verified.
   Never probe with a write. Settings, a browser success page and tool counts
   alone do not prove an authenticated read or an empty instance.

Keep workflow-level permissions separate from the OAuth grant. A workflow's
returned `scopes` can describe the user's permissions; they do not prove that
this connection can write. Respect the consented OAuth scopes and advertised
tools, and never switch connections to bypass a missing permission.

If setup is needed, read [Commands and Authorization](../../docs/setup-helper.md#commands)
before configuring anything. For failures or missing tools/workflows, read the
relevant [Troubleshooting](../../docs/setup-helper.md#troubleshooting) entry.
For migration, removal or token fallback, read
[Configuration safety and removal](../../docs/setup-helper.md#configuration-safety-and-removal).
Keep these setup details out of an already connected workflow task.

## Load and reuse shared guidance

The build/debug entry skill selects the bundled router and initial capability.
Resolve shared names to `references/n8n-skills/skills/<name>/SKILL.md` relative
to this installed skill; resolve each reference relative to its owning file.
These are local references, with no separate plugin or upstream session/tool hooks.

If NeuralBridge does not supply the installed path, look under
`~/.neuralbridge/powers/installed/` and match `plugin.json`'s `name` to
`n8n-workflow-dev`. The directory is usually named after the power (`n8n`).
Do not use the checkout cache under `~/.neuralbridge/powers/repos/` or another installed
power to resolve these references.

In NeuralBridge, invoking a shared skill means applying its guidance. Each time a
build/debug entry is loaded, read the router and core guide named in that entry
with NeuralBridge's file-reading capability. These two reads are required even if an
earlier turn or context summary says the guides were loaded. Load other relevant
guides on first use, then reuse their contents for subsequent operations.
Re-read if context compaction removed them, the installed snapshot changed, or a
needed rule is unclear. A context summary naming a guide or saying it was loaded
does not contain that guide's rules. When resuming from a summary, re-read this
entry and the router/task guides whose full contents are missing before workflow
operations; do not wait for a separate compaction notification.
This policy takes precedence over shared instructions to invoke or re-read a
skill on every operation. Still apply the relevant rules on
every operation; this does not cache live workflow state or verification results.

Follow the router's triggers to load specialists as the task needs them. Do not
load all 14 skills or their references upfront. The read-only preflight above is
the exception to loading guidance before MCP calls; load it before subsequent
workflow operations. When supported, `skillsUsed` names only guides whose files
have been read and whose rules were applied since the last successful create/update.
Reused guidance still in context counts; reset that reporting window after success.

Use the bundled snapshot consistently; do not mix it with a separately installed
n8n skills pack. Shared plugin/version or README Drift references mean this
power's version and pinned snapshot. Update through this power's update process;
never edit or `git pull` inside the snapshot. Missing files mean an incomplete
installation, not a reason to silently substitute another pack.

## NeuralBridge execution checks

Use the native connection's live tool names and schemas. If required nested
fields are missing, report the limitation and stop that operation; do not guess
arguments or switch to the n8n REST API for workflow operations.

If NeuralBridge repeatedly omits required `pinData` from `test_workflow`, stop retrying
that tool and report pinned testing as unavailable for that attempt. When its live schema supports
`manual` execution, `execute_workflow` can run the draft instead. Apply the graph,
pin and effects checks below: this path can run real integrations and needs
authorization for their effects. Do not publish a workflow to bypass the failure.

Before each test, inspect the current pin map and unpinned nodes, including Code
I/O, commands, file operations and sub-workflows. Obtain authorization for real
effects unless already authorized. Read the final result; an execution ID alone
is not success. Report simulated nodes; a simulated pass leaves those integrations
unverified. Identify pins from the execution's pin data; an empty trigger output
or zero-duration node does not prove it was simulated.
Distinguish an edited draft from published behavior. Publish only when
authorized for that workflow. Check effects before changing settings on a published workflow because
the change can reactivate it. These checks apply alongside the shared guidance.
