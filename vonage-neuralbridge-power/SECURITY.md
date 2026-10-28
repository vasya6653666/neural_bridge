# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (`main`) | Yes |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

This project handles Vonage API credentials. If you discover a security vulnerability — including exposed credentials, insecure defaults, or anything that could compromise a user's Vonage account — please report it privately.

### How to report

Email **devrel@vonage.com** with the subject line `[SECURITY] vonage-neuralbridge-power`.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested remediation, if you have one

### What to expect

- We will acknowledge your report within **3 business days**.
- We will keep you informed of our progress toward a fix.
- We will publicly credit you in the release notes unless you prefer to remain anonymous.

## Credential Safety

This project's `mcp.json` contains placeholder values for Vonage API credentials. **Never commit real credentials.** Use environment variables or a local credentials file that is excluded by `.gitignore`. See [README.md](README.md#configuration) for details.
