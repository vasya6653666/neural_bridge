# Flow Discover-and-Execute Workflow

This is the core Flow workflow. Use it every time the user needs to read from or act in a connected enterprise system (SAP, Oracle, JD Edwards).

## The four-step pattern

1. **Understand the business intent.** What transaction does the user want completed? What system holds the data? Don't jump to function names — start with the outcome.

2. **Discover the right function.** Call the appropriate Flow MCP discovery tool for the target system.
   - For SAP: `search_sap` (returns candidate functions — both standard BAPIs and custom Z-functions — ranked by relevance)
   - For Oracle / JDE: use the equivalent discovery tool exposed by Flow for that system
   Present the top candidates to the user with one-line descriptions and ask them to confirm the choice. Never execute on an unconfirmed guess.

3. **Inspect the schema.** Once a function is selected, examine its parameter schema:
   - **Import parameters** (inputs the function expects)
   - **Export parameters** (what it returns)
   - **Table parameters** (bulk input/output structures, if any)
   - **Mandatory vs optional** — mandatory parameters MUST be supplied; optional ones can be omitted

   Ask the user for values for every mandatory parameter. Offer sensible defaults for optional ones but confirm before applying them.

4. **Execute.** Call `execute_function` (or the system-specific equivalent) with the selected function, the user-supplied parameters, and any relevant context. Return the enterprise-system response to the user in a readable format — not raw XML or SAP's native error codes.

## Rules

- **Never skip discovery.** Even if the user "just wants to call BAPI_X," run `search_sap` to confirm the exact function name, package, and signature. The cost of one discovery call is nothing compared to a Work Unit spent on a wrong execution.
- **Never execute without user confirmation.** Show the selected function, the parameter values, and what will happen. Wait for explicit approval.
- **Never guess parameter values.** If a mandatory parameter's value isn't obvious from context, ask the user. Do not fabricate IDs, dates, or codes.
- **Handle errors diagnostically, not by retrying.** If `execute_function` returns an error, surface the enterprise system's message to the user and ask for guidance. Don't silently retry with different parameters — that burns Work Units and may cause data inconsistency.