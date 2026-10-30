---
name: "security-scan-workflow"
description: "Safe order of a security scan with the sec_* tools: detect installed scanners, look for leaked secrets first, then vulnerable dependencies and misconfigurations with Trivy, code patterns with Semgrep, container images on request, and report findings without secret values. Use whenever the user asks to check a project, a dependency update or an image for security issues."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Security scan workflow
The power's MCP server runs Trivy, Semgrep and Gitleaks on the user's machine. None of the tools changes project files.
Every tool that takes `dir` needs the **absolute** path of the directory to scan, usually the workspace root. Work in this
order.
## 1. Find out what is installed
Call `sec_detect`. It lists each scanner with its version, or says it is missing and which variable (`NB_SEC_TRIVY`,
`NB_SEC_SEMGREP`, `NB_SEC_GITLEAKS`) points to a custom binary. Use what is installed; if the scanner the user asked for is
missing, tell them how to install it and stop there. Never try to download or install a scanner yourself, and never
run the scanners through the terminal to bypass these tools: the terminal output would contain secret values.
## 2. Secrets first
Call `sec_gitleaks` with `mode: "dir"`. It works offline and is cheap. When the project is a git repository and the user
cares about history (before open-sourcing, after a suspected leak), also run `mode: "git"`: it finds secrets that were
removed from the files but are still in old commits.
## 3. Dependencies and configuration
Call `sec_trivy_fs`. The default scanners are `vuln`, `misconfig` and `secret`; add `license` only when the user asks about
licenses. Trivy downloads its vulnerability database on the first run and when it is outdated. If the answer starts with
a download line, mention it once. If the user is offline or asks not to use the network, pass `offline: true`; it fails
when the database was never downloaded. In that case, say so instead of retrying.
For a large report, narrow it rather than paging through it: `severity: ["CRITICAL", "HIGH"]` and `ignoreUnfixed: true`
show what can be fixed now.
## 4. Code patterns
Call `sec_semgrep`. If the project has `.semgrep.yml` or `.semgrep/`, it is used automatically. Otherwise ask which
rules to use, or suggest a registry ruleset that fits the language (`p/default`, `p/owasp-top-ten`, `p/python`,
`p/javascript`, …) and say that the rules are downloaded from the Semgrep registry. `auto` is not available.
Errors listed under "Errors" (parse failures in vendored or generated files) are normal. Mention them only when they
cover the user's own code.
## 5. Container images, on request
Call `sec_trivy_image` only when the user names an image or asks to check what a Dockerfile builds. It may pull the image
from its registry. Pass `localOnly: true` when the user wants to scan only an image they built locally.
## 6. Report
Start with the counts by severity, then group findings by what fixes them:
- **Secrets**: file and line, rule, and for git history the commit. Never print, guess or reconstruct the value, even if
  you open the file. Say that a committed secret must be rotated, not only deleted (see the
  `security-findings-remediation` skill).
- **Dependencies**: package, installed → fixed version, CVE ids. Several CVEs fixed by one upgrade are one task.
- **Misconfigurations and code findings**: file, line, check or rule id, message.
Say plainly what was not scanned (missing scanner, no rules, offline without a database). Do not call a project
"secure" because the scans found nothing; say which scanners ran and with which rules.
## When a tool fails
- "not found on PATH": the scanner is not installed; see step 1.
- "must be an absolute path" or "Directory not found": pass the absolute workspace path.
- Timeouts on very large trees: scan a subdirectory (for example the service the user is working on).
- Registry or network errors: report them as they are, offer the `offline` option for Trivy or local rules for
  Semgrep, and do not retry in a loop.
