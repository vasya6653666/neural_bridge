# Organization Context Workflow

Use this workflow when the user needs to manage their organization context or switch between organizations.

## Steps

1. **List organizations** - Call `get_user_organizations` to see which organizations the user has access to.
2. **Get current context** - Call `get_org_context` to see the active organization configuration.
3. **Set context** - Call `set_org_context` to switch organization or configure query context.
4. **Check versions** - Call `get_org_context_versions` to see available context versions.

## Best Practices

- Always call `get_org_context` at the start of a session to understand which organization is active.
- If the user has access to multiple organizations, confirm which one they want to work with before running cost queries.
- Use `get_org_context_versions` when the user needs to compare different context configurations or revert to a previous version.
- Organization context affects all subsequent queries, so set it correctly before running cost analysis.

## Security Considerations

- Never switch organization context without explicit user confirmation.
- When a user has access to multiple organizations, default to their current active organization rather than assuming a different one.
- If a query or workflow requires a context switch, clearly inform the user before calling `set_org_context` and explain which organization will become active.
- After switching context, confirm the change was intentional before proceeding with queries against the new organization.
