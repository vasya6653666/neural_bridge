# Report Output — Consolidated Markdown + HTML

Write BOTH files to the `outputDir` from `.neuralbridge/security-analyzer.json` (default `./security-reports`).

---

## Report Modes

This power produces reports in **two modes** depending on which skill triggered the scan:

| Mode | Triggered By | Filename Pattern | Compliance Columns |
|------|-------------|------------------|-------------------|
| **General** | `scan` skill | `security-report-<accountId>-<YYYYMMDD-HHMM>.md/.html` | None |
| **Compliance** | `compliance-scan` skill | `compliance-<framework>-<accountId>-<YYYYMMDD-HHMM>.md/.html` | Framework-specific |

---

## Mode 1: General Security Report

### Filenames
`security-report-<accountId>-<YYYYMMDD-HHMM>.md` and `.html`

### Markdown structure (.md)

```markdown
# AWS Security Posture Report

| Field | Value |
|-------|-------|
| Account | 123456789012 |
| Regions | us-east-1, ap-south-1 |
| Generated | 2026-08-14T10:30:00Z |
| Scan Mode | General Security |
| Trusted Advisor | available / unavailable |
| Risk Score | 42 (H×3 + M×2 + L×1) |

## Executive Summary

| Metric | Count |
|--------|-------|
| FAIL | N |
| WARN | N |
| PASS | N |
| Accepted (suppressed) | N |
| By Severity | H: N, M: N, L: N |

## Findings — [Category Name]

| Check | ID | Sev | Status | Region | Resource ARN | Resource Name | Resource ID | Evidence | Recommendation | Docs |
|-------|-----|-----|--------|--------|--------------|---------------|-------------|----------|----------------|------|
```

### General mode columns (NO compliance columns)
- **Check**: Human-readable check name
- **ID**: Check ID from catalog
- **Sev**: H / M / L
- **Status**: PASS / WARN / FAIL
- **Region**: AWS region or "global"
- **Resource ARN**: Full ARN
- **Resource Name**: Human-friendly name
- **Resource ID**: AWS-assigned ID
- **Evidence**: What was found (concise)
- **Recommendation**: How to fix
- **Docs**: AWS documentation link

**NOT included in general mode**: Compliance, WAF Mapping columns.

### Resource identification columns
Every finding MUST include these three resource-identity columns:
- **Resource ARN**: Full Amazon Resource Name (e.g., `arn:aws:ec2:us-east-1:123456789012:security-group/sg-0abc123`). For account-level findings use `arn:aws:iam::<accountId>:root`.
- **Resource Name**: Human-friendly name — Name tag, bucket name, function name, role name, cluster name, etc. Falls back to resource ID if no name exists.
- **Resource ID**: AWS-assigned unique identifier — `sg-0abc123`, `i-0def456`, `AKIAIOSFODNN7EXAMPLE`, etc. For account-level findings use the account ID.

When a single check flags multiple resources, either:
- List one row per resource (preferred for ≤5 resources), OR
- Combine in a single row with comma-separated values in each column (for >5 resources, truncate at 10 and note "... and N more").

### Category order
IAM → EC2/Network → EBS → S3 → RDS → KMS → Lambda → API Gateway → SNS/SQS → DynamoDB → CloudFront → ELB/ALB → Secrets Manager → WAF → VPC → OpenSearch → EFS → ElastiCache → Redshift → SageMaker → AMI → Containers → Detective Controls → Access Analyzer → Inspector → Security Hub → Compute Optimizer → Athena → Glue → MSK → Kinesis → Step Functions → AWS Backup → CloudWatch → EventBridge → AppSync → Cognito → Systems Manager → Network Firewall → Transit Gateway → Global Accelerator → Route 53 → Trusted Advisor

### Sorting
Within each category: severity (H→M→L) then status (FAIL→WARN→PASS).

### Skipped categories
For categories skipped during the scan (no resources or not selected by user), include a row:
```
| — | — | — | SKIPPED | — | — | — | — | No resources detected / not selected | — | — |
```

### Accepted risks section
Separate section listing all suppressed findings with owner, reason, review date, and expiry status.

### Footer
- Scan is read-only — no resources were modified.
- Scan mode: General Security
- Check catalog version, power version, MCP servers used.

---

## Mode 2: Compliance Report

### Filenames
- Single framework: `compliance-<framework>-<accountId>-<YYYYMMDD-HHMM>.md/.html`
  - Framework codes: `cis`, `hipaa`, `soc2`, `pci-dss`, `fsbp`
- Multiple frameworks: `compliance-multi-<accountId>-<YYYYMMDD-HHMM>.md/.html`

### Markdown structure (.md)

```markdown
# AWS Compliance Report — [Framework Name]

| Field | Value |
|-------|-------|
| Account | 123456789012 |
| Regions | us-east-1 |
| Generated | 2026-08-14T10:30:00Z |
| Scan Mode | Compliance |
| Framework | CIS AWS Foundations Benchmark v3.0.0 |
| Compliance Rate | 76% (28/37 controls passing) |

## Compliance Summary

| Metric | Count |
|--------|-------|
| Controls Assessed | 37 |
| Controls Passing | 28 |
| Controls Failing | 9 |
| Compliance Rate | 76% |

## Non-Compliant Controls

| Control | Section | Status | Resource ARN | Resource Name | Resource ID | Evidence | Remediation |
|---------|---------|--------|--------------|---------------|-------------|----------|-------------|
| Ensure MFA is enabled for root | CIS 1.5 | FAIL | arn:aws:iam::123...:root | Account | 123... | Root has no MFA | Enable MFA... |

## All Controls Assessed

| Control | Section | Status | Resources Checked | Passing | Failing |
|---------|---------|--------|-------------------|---------|---------|
```

### Compliance mode columns
- **Control**: Framework control description
- **Section**: Framework reference (e.g., "CIS 1.5", "HIPAA §164.312(d)", "PCI 8.3")
- **Status**: PASS / FAIL (binary — no WARN in compliance mode)
- **Resource ARN**: Full ARN of non-compliant resource
- **Resource Name**: Human-friendly name
- **Resource ID**: AWS-assigned ID
- **Evidence**: What violates the control
- **Remediation**: Steps to become compliant + AWS docs link

### Compliance scoring
- A control is **PASS** only if ALL mapped checks for ALL resources pass.
- A control is **FAIL** if ANY mapped check for ANY resource fails.
- Compliance rate = `(passing controls / total controls assessed) × 100%`

### Multiple frameworks
If the user requested multiple frameworks (e.g., "CIS and HIPAA"), produce separate sections per framework in one report:
```markdown
## Framework: CIS AWS Foundations Benchmark v3.0
(compliance rate, findings table)

## Framework: HIPAA
(compliance rate, findings table)
```

### Footer
- Framework version assessed
- Scan is read-only
- Power version, MCP servers used

---

## HTML report (.html)

Self-contained (inline CSS, no external assets) so it opens offline in any browser.

### General mode HTML includes:
1. **Header** — account, regions, timestamp, scan mode, TA availability, MCP servers used.
2. **Executive summary cards** — total FAIL / WARN / PASS and risk score; severity breakdown (H/M/L). Use colored cards (red/amber/green).
3. **Findings tables** — grouped by category (same order as Markdown), sorted by severity then status. Columns: Check, ID, Severity, Status, Region, Resource ARN, Resource Name, Resource ID, Evidence, Recommendation, Docs Link. Row colors: FAIL=red, WARN=amber, PASS=green, `PASS (accepted)`=grey.
4. **Skipped categories** — listed with reason.
5. **Accepted risks table** — separate section for suppressed findings.
6. **Footer** — scan is read-only, scan mode, power version.

### Compliance mode HTML includes:
1. **Header** — account, regions, timestamp, framework name + version.
2. **Compliance scorecard** — large compliance rate percentage, passing/failing control counts. Color: green ≥90%, amber 70–89%, red <70%.
3. **Non-compliant controls table** — sorted by severity, with resource ARNs, evidence, remediation. Row color: all red (FAIL).
4. **All controls table** — full list showing pass/fail per control with resource counts.
5. **Remediation priority list** — top 5 controls to fix first (highest impact).
6. **Footer** — framework version, read-only note, power version.

---

## Scoring rules

### General mode
- `riskScore` = sum of FAIL weights (H=3, M=2, L=1). Findings with status `PASS (accepted)` are EXCLUDED from the risk score.
- Findings suppressed via `security-context/exceptions.csv` carry `status: "PASS (accepted)"` plus `acceptedReason` and `acceptedOwner`.
- One finding entry per resource per check.

### Compliance mode
- No risk score — use compliance rate instead.
- Binary PASS/FAIL per control (no WARN).
- Compliance rate = passing / total controls × 100%.

## Writing the files

1. Build findings data in memory during the scan.
2. Render the `.md` file (always — lightweight, version-controllable).
3. Render the `.html` file (always — self-contained, color-coded, opens offline).
4. Print the absolute paths of both files to the user and offer to open the HTML.
5. Do NOT upload anywhere unless the user explicitly asks.
