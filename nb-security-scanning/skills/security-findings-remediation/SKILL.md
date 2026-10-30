---
name: "security-findings-remediation"
description: "How to fix what the sec_* scanners found: rotate leaked secrets before cleaning them up, upgrade vulnerable dependencies to the fixed version, fix misconfigurations and code findings, suppress false positives in a reviewable way, then re-run the same scan to confirm. Use after a scan, or when the user asks to fix a CVE, a leaked secret or a scanner finding."
metadata:
  author: "NeuralBridge"
  version: "1.0.0"
---
# Fixing security findings
Fix in this order: leaked secrets, then critical and high vulnerabilities that have a fixed version, then
misconfigurations and code findings. Ask the user before changes that go beyond the files of the project (rotating
credentials, rewriting git history, pushing).
## Leaked secrets
1. Treat every finding as real until the user says otherwise. Open the file at the reported line to see the context, but
   never repeat the value in chat, commit messages or new files.
2. A secret that reached a commit must be **rotated** (revoked and reissued by whoever issued it). Deleting it from the
   file does not help: it stays in history and in every clone. Tell the user which credential to rotate. Rotation is
   theirs to do.
3. Move the value out of the code: an environment variable, the project's secret store, or a local file listed in
   `.gitignore`. Leave a placeholder or an example file (`.env.example`) without real values.
4. Rewriting git history (`git filter-repo` and similar) is destructive and affects everyone who has a clone. Suggest it only
   after rotation and only if the user asks; never run it yourself without explicit approval.
5. For a confirmed false positive (test fixture, public sample key), add its fingerprint from the `sec_gitleaks` answer to
   `.gitleaksignore`, or a `gitleaks:allow` comment on that line, so the decision is visible in review.
## Vulnerable dependencies
1. Upgrade to the fixed version reported by Trivy, or the nearest later version, by editing the manifest and refreshing the
   lock file with the project's package manager. Check the changelog for breaking changes when the major version changes.
2. A transitive dependency is fixed by upgrading the direct dependency that pulls it in, or with the package manager's
   override mechanism when no such upgrade exists yet.
3. "no fixed version" means nothing can be upgraded yet. Tell the user and check whether the vulnerable code path is used.
   Do not hide the finding.
4. Suppress an accepted risk only with the user's agreement, in `.trivyignore` with the CVE id and a comment that gives the
   reason and a review date.
## Misconfigurations and code findings
Fix the configuration or code at the reported file and line, following the check's message (run as non-root, pin image
tags, parameterize queries, use a strong hash, …). For a false positive in Semgrep, prefer a `nosemgrep: <rule-id>`
comment with a short reason over disabling the rule for the whole project.
## Confirm
Re-run the same tool with the same arguments (scanners, rules, severity) and compare the counts with the first run. Report
what was fixed, what remains and why, and what the user still has to do outside the code, such as rotating credentials.
