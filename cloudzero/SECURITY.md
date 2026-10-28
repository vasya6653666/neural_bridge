# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email security@cloudzero.com with:

- A description of the vulnerability
- Steps to reproduce the issue
- Any potential impact

We will acknowledge receipt within 48 hours and provide an initial assessment within 5 business days.

## Scope

This project is a configuration-only NeuralBridge Power that connects to CloudZero's remote MCP server. Security concerns may include:

- Malicious modifications to steering documents that could manipulate agent behavior
- Changes to `mcp.json` that redirect the MCP connection to an unauthorized endpoint
- Exposure of sensitive data patterns in documentation or examples

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |
