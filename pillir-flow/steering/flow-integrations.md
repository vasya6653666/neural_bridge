# Flow Integrations — Supported Enterprise Systems

Pillir Flow executes directly against these enterprise systems. The NeuralBridge agent can discover and invoke functions in any of them through the Flow MCP server without writing custom integration code.

## SAP

- **What Flow reaches:** Standard BAPIs, custom Z-functions, RFC-enabled function modules
- **No ABAP needed:** Flow calls functions directly; you don't write or deploy ABAP code
- **No OData needed:** Flow doesn't layer OData on top; it speaks to SAP's function interface directly
- **Discovery tool:** `search_sap`
- **Typical flow:** Ask Flow to find the function → inspect import/export/table params → execute with user-supplied values → return SAP response

## Oracle

- **What Flow reaches:** Oracle ERP functions, stored procedures, and database-level operations
- **Direct execution:** No connector code, no API gateway, no middleware layer
- **Discovery:** Use the Flow-provided Oracle discovery tool to find the right function/procedure

## JD Edwards (JDE)

- **What Flow reaches:** JDE business functions and orchestrations
- **Direct execution:** No custom integration code needed
- **Discovery:** Use the Flow-provided JDE discovery tool

## General rules

- **Credentials live in Flow, not in NeuralBridge.** The user configures their ERP connections in their Flow workspace. NeuralBridge's role is to invoke those connections via the Flow MCP server — never to handle ERP passwords or connection strings directly.
- **One function per execution.** Flow's execution model is transactional. If the user's goal requires multiple function calls, run them in sequence and confirm each one; don't try to batch unrelated calls into a single execution.
- **Never suggest writing custom integration code.** If Flow can reach the system, use Flow. If Flow can't reach the system, tell the user honestly — don't fall back to "write a REST adapter" as a default.