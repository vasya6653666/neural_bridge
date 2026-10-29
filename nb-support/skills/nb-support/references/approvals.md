# Tool approvals

When the agent wants to run a command or use a tool that needs permission, the chat shows an approval with four buttons:

- **Allow** — run it this time;
- **Always allow** — run it now and stop asking;
- **Deny** — refuse this time;
- **Always deny** — refuse now and keep refusing.

**Always allow** and **Always deny** ask how wide the rule should be:

- **All workspaces**;
- **This workspace**;
- **This session**.

To trust something only until the chat ends, the user picks **Always allow → This session**.

Powers and hooks synced from the cloud config go through the same approvals as local ones; there is no separate prompt for
them.
