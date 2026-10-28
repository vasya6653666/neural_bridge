---
name: compliance-scan
description: Run a compliance-focused security scan mapped to a specific framework (CIS AWS Foundations, HIPAA, SOC 2, PCI DSS, or AWS FSBP). Only triggered when the user explicitly requests a compliance scan or names a framework.
---

# Compliance Security Scan

**When to use**: Only when the user explicitly asks for a compliance scan or mentions a specific framework by name (e.g., "run a CIS scan", "check HIPAA compliance", "PCI DSS assessment", "SOC 2 audit", "FSBP scan").

**Do NOT use for**: General security scans. If the user just says "run a security scan" or "check my account security", use the `scan` skill instead (General Security Scan).

---

## Supported Frameworks

| Framework | Trigger Keywords | Focus |
|-----------|-----------------|-------|
| CIS AWS Foundations Benchmark v3.0.0 | "CIS", "CIS benchmark", "CIS scan" | Identity, logging, monitoring, networking |
| HIPAA Security Rule (45 CFR Part 164) | "HIPAA", "HIPAA compliance", "health data" | Encryption, access control, audit, ePHI protection |
| SOC 2 Type II | "SOC 2", "SOC2", "trust services" | Security, availability, confidentiality |
| PCI DSS v4.0.1 | "PCI", "PCI DSS", "payment card", "cardholder" | Network security, encryption, access, monitoring |
| AWS FSBP | "FSBP", "foundational security", "security best practices" | AWS-native best practices across all services |

---

## Step 1: Validate AWS session
- Run `aws sts get-caller-identity` via `aws-mcp` to confirm credentials are valid.
- If expired, instruct the user to re-authenticate.
- Record account ID and default region.

## Step 2: Identify target framework(s)
- Determine which framework(s) the user wants from their request.
- If ambiguous, ask: "Which compliance framework do you want to assess against? Options: CIS, HIPAA, SOC 2, PCI DSS, FSBP (or multiple, e.g., 'CIS and HIPAA')."
- Record selected framework(s).

## Step 3: Confirm scan scope
- Load `.neuralbridge/security-analyzer.json` if it exists. Otherwise ask for:
  - Target region(s)
  - Output directory (default `./security-reports`)
- Save scope.

## Step 4: Determine relevant checks
Based on the selected framework, identify ONLY the checks that map to that framework from `steering/checks-catalog.md` § "Compliance Framework Mappings":

### CIS AWS Foundations Benchmark v3.0.0 — 37 official controls

Scope the scan to the **37 Security Hub CSPM controls** that make up CIS AWS Foundations
Benchmark v3.0.0 (source: [AWS docs](https://docs.aws.amazon.com/securityhub/latest/userguide/cis-aws-foundations-benchmark.html)).
Map each to this power's checks via `steering/checks-catalog.md` § "CIS AWS Foundations
Benchmark v3.0.0". The 37 controls and their CIS requirement numbers:

- **IAM (1.x):** IAM.4 (1.4 root access key), IAM.9 (1.5 root MFA), IAM.6 (1.6 root hardware MFA), IAM.15 (1.8 password length ≥14), IAM.16 (1.9 password reuse), IAM.5 (1.10 user MFA), IAM.22 (1.12 unused creds 45d), IAM.3 (1.14 access key rotation 90d), IAM.2 (1.15 no policies on users), IAM.18 (1.17 support role), IAM.26 (1.19 expired SSL/TLS certs), IAM.28 (1.20 Access Analyzer), IAM.27 (1.22 no AWSCloudShellFullAccess)
- **Account:** Account.1 (1.2 security contact info)
- **Storage (2.x):** S3.5 (2.1.1 SSL-only), S3.20 (2.1.2 MFA delete), S3.1/S3.8 (2.1.4 block public access), EC2.7 (2.2.1 EBS default encryption), RDS.3 (2.3.1 RDS encryption at rest), RDS.13 (2.3.2 RDS minor upgrades), RDS.2 (2.3.3 RDS no public access), EFS.1 (2.4.1 EFS KMS encryption), S3.22 / S3.23 (object-level write/read logging)
- **Logging (3.x):** CloudTrail.1 (3.1 multi-Region trail), CloudTrail.4 (3.2 log file validation), Config.1 (3.3 AWS Config), CloudTrail.7 (3.4 trail bucket access logging), CloudTrail.2 (3.5 trail encryption at rest), KMS.4 (3.6 KMS key rotation), EC2.6 (3.7 VPC flow logs)
- **Networking (5.x):** EC2.21 (5.1 NACL admin ports), EC2.53 (5.2 SG IPv4 admin ports), EC2.54 (5.3 SG IPv6 admin ports), EC2.2 (5.4 default SG restricts all), EC2.8 (5.6 IMDSv2)

**Not scored in v3.0.0** (CIS removed / manual only): all CloudWatch metric-filter &
alarm controls (root usage, unauthorized API calls, IAM/config/SG/NACL/gateway/route/VPC
changes), CloudTrail.5 (CloudWatch Logs integration), CloudTrail.6 (bucket not public),
password complexity/expiry (IAM.11–14, IAM.17), IAM.1 (full admin), IAM.8, IAM.20. Do not
count these toward the CIS v3.0.0 score.

Relevant scan phases to execute (mapped to the controls above):
- Phase 2: IAM (checks 1–6, 42–48)
- Phase 6: Detective Controls — CloudTrail (checks 24–27)
- Phase 3: EC2/Network (checks 7–9 + NACL admin-port check)
- Phase 4: S3 (checks 12, 13, 16, 17)
- Phase 7: KMS (check 29)
- Phase 17: VPC (check 98)
- Phase 19: IAM Access Analyzer (check 48)
- Phase 5: RDS (checks 19, 20)
- Phase 21: EBS (check 106 — default encryption)
- Phase 22: EFS (check 109 — encryption at rest)
- Phase 46: AWS Config (check 46)

### HIPAA Security Rule (45 CFR Part 164, Subpart C)

HIPAA is **not** a Security Hub standard. AWS aligns to HIPAA through the **AWS Config
"Operational Best Practices for HIPAA Security" conformance pack**, which maps AWS Config
managed rules to HIPAA Security Rule safeguard citations (source: [AWS Config HIPAA best
practices](https://docs.aws.amazon.com/config/latest/developerguide/operational-best-practices-for-hipaa_security.html)).
Map this power's checks to the same safeguards via `steering/checks-catalog.md` §
"HIPAA Security Rule". Group findings by safeguard family:

- **Access Control §164.312(a):** MFA (`mfaActive`, `rootMfaActive`), no root access keys, least-privilege policies, block public access to S3/RDS/Lambda/Redshift/SageMaker/EKS.
- **Audit Controls §164.312(b):** CloudTrail enabled, VPC flow logs, ELB/Redshift/S3 object-level logging.
- **Integrity §164.312(c):** CloudTrail log-file validation.
- **Person/Entity Authentication §164.312(d):** MFA enabled.
- **Transmission Security §164.312(e):** TLS/SSL enforcement, in-transit encryption (ElastiCache, MSK, Redshift, OpenSearch), valid certificates.
- **Encryption at rest §164.312(a)(2)(iv):** S3, RDS, EBS, EFS, Redshift, ElastiCache, OpenSearch, KMS key rotation.
- **Contingency Plan §164.308(a)(7):** RDS backups, DynamoDB PITR, AWS Backup plans/coverage.
- **Security Management §164.308(a)(1):** GuardDuty, Inspector, SSM patch compliance, supported runtimes/versions.

> **HIPAA scoring caveat (must include in the report):** these checks provide *technical-
> safeguard evidence* only. HIPAA compliance is an organizational/legal determination that
> also requires BAAs, policies, workforce training, and physical safeguards. Report HIPAA
> results as "technical evidence toward safeguards," never as a definitive compliance verdict.

Relevant scan phases to execute:
- Phase 2: IAM (checks 2, 5, 6)
- Phase 4: S3 (checks 12, 13, 15, 16 + object-level logging 17b/17c)
- Phase 5: RDS (checks 19, 20, 21, 22a)
- Phase 6: Detective Controls (checks 23, 24, 26a)
- Phase 7: KMS (check 29)
- Phase 9: Lambda (checks 53, 58)
- Phase 11: SNS/SQS (checks 68, 71)
- Phase 14: ELB (check 85)
- Phase 15: Secrets Manager (check 92)
- Phase 17: VPC (check 98)
- Phase 10: API Gateway (checks 61, 62)
- Phase 34: AWS Backup (checks 158, 159)
- Phase 21: EBS (checks 105, 106)
- Phase 22: EFS (check 109)
- Phase 23: ElastiCache (checks 113, 114)
- Phase 24: Redshift (checks 117, 118, 121)
- Phase 27: Inspector (check 128)
- Phase 31: MSK (checks 142, 143)
- Phase 35: CloudWatch (checks 160, 162)
- Phase 38: Cognito (check 171)
- Phase 39: Systems Manager (check 178)

### SOC 2 Type II — Relevant Phases:
- Phase 2: IAM (checks 3, 4, 5, 6)
- Phase 3: EC2/Network (check 8)
- Phase 4: S3 (checks 15, 16)
- Phase 5: RDS (checks 18, 21)
- Phase 6: Detective Controls (checks 23, 24)
- Phase 7: KMS (check 29)
- Phase 9: Lambda (check 53)
- Phase 12: DynamoDB (check 75)
- Phase 14: ELB (check 85)
- Phase 17: VPC (check 98)
- Phase 21: EBS (check 107)
- Phase 26: AMI (check 126)
- Phase 22: EFS (check 112)
- Phase 27: Inspector (check 129)
- Phase 28: Security Hub (check 131)
- Phase 29: Athena (check 134)
- Phase 30: Glue (check 137)
- Phase 32: Kinesis (check 147)
- Phase 34: AWS Backup (checks 155, 158)
- Phase 35: CloudWatch (check 162)
- Phase 36: EventBridge (check 165)
- Phase 37: AppSync (check 167)
- Phase 38: Cognito (checks 171, 175)
- Phase 40: Network Firewall (check 180)
- Phase 41: Transit Gateway (check 184)

### PCI DSS v4.0.1

Scope to the **AWS Security Hub CSPM PCI DSS v4.0.1** standard (source: [PCI DSS in
Security Hub CSPM](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-standards-pcidss.html)).
Map this power's checks to the official v4.0.1 control IDs via `steering/checks-catalog.md`
§ "PCI DSS v4.0.1". Group by PCI DSS requirement family:

- **Req 1 (network security):** SG/NACL admin-port rules (EC2.13/21/53/54), default SG (EC2.2), no public EBS snapshots (EC2.1).
- **Req 2 (secure config):** IMDSv2 (EC2.8).
- **Req 3 (protect stored data):** encryption at rest — S3 KMS (S3.17), RDS.3, EBS, Redshift, ElastiCache, EKS secrets (EKS.3); KMS key rotation (KMS.4); secrets rotation (SecretsManager.1/4).
- **Req 4 (encrypt transmission):** SSL/TLS enforcement (S3.5), CloudFront.3, ELB.8/ELB.1, Redshift.2, ElastiCache.5, MSK.1, ES.3.
- **Req 6 (secure systems):** supported runtimes (Lambda.2), RDS minor upgrades (RDS.13), EKS supported version (EKS.2), image scanning (ECR.1), patch compliance (SSM.2/3), WAF (WAF.1/11).
- **Req 7/8 (access control + auth):** MFA (IAM.5/6/9), key rotation (IAM.3), unused creds (IAM.8), password policy (IAM.7/16), support role (IAM.18), least privilege (IAM.1), no secrets in ECS env (ECS.8).
- **Req 10 (logging & monitoring):** CloudTrail.2/3/4/7, VPC flow logs (EC2.6), S3 object-level logging (S3.22/23), Route53.2, StepFunctions.1, Redshift.4, EKS.8, Opensearch.5.
- **Req 11 (test security):** GuardDuty.1, Inspector.1–4.

> **Out of current coverage (report as gaps):** the v4.0.1 standard includes controls this
> power does not yet evaluate — ACM.1/.2, DMS.*, DocumentDB.*, Neptune.*, RDS.20/.21/.22
> (event subscriptions), RDS.24/.25 (custom admin usernames), S3.7 (CRR), S3.15 (Object
> Lock), S3.9 (server access logging), CodeBuild.*, EMR.1/.2, Transfer.2, MQ.2,
> EC2.15/.16/.25/.51 (public-IP / NACL hygiene / VPN logging). List these under "controls
> not assessed" so the compliance rate is not overstated.

Relevant scan phases to execute:
- Phase 2: IAM (checks 2, 3, 5, 6, 44, 45, 48a)
- Phase 3: EC2/Network (checks 7, 8, 9 + NACL admin-port check)
- Phase 4: S3 (checks 13, 15, 16 + object-level logging 17b/17c)
- Phase 5: RDS (checks 19, 20, 22a)
- Phase 6: Detective Controls (checks 23, 24, 26a)
- Phase 7: KMS (check 29)
- Phase 9: Lambda (checks 53, 54, 55)
- Phase 13: CloudFront (check 78)
- Phase 14: ELB (checks 85, 88, 89)
- Phase 15: Secrets Manager (check 92)
- Phase 16: WAF (checks 95, 96)
- Phase 17: VPC (check 98)
- Phase 21: EBS (checks 105, 106, 107)
- Phase 23: ElastiCache (checks 113, 114)
- Phase 24: Redshift (checks 117, 118, 119, 121)
- Phase 27: Inspector (checks 128, 129)
- Phase 31: MSK (checks 142, 143)
- Phase 39: Systems Manager (check 178)

### AWS FSBP — Relevant Phases:
- All phases that have FSBP mappings in `steering/checks-catalog.md`. Includes EC2, S3, RDS, KMS, CloudTrail, GuardDuty, Lambda, ECR, EKS, CloudFront, ELB, OpenSearch, SQS, SNS, DynamoDB, WAF, Secrets Manager, VPC, IAM, EBS, EFS, ElastiCache, Redshift, SageMaker, AMI, Inspector, Security Hub, Compute Optimizer, Glue, Kinesis, MSK, Step Functions, Backup, CloudWatch, Cognito, AppSync, Network Firewall, Route 53, SSM, Transit Gateway, Global Accelerator.

## Step 5: Run resource discovery (Phase 0.5)
- Same as General Scan — discover resources, but only for the phases relevant to the selected framework.
- Present the discovery to the user and confirm.

## Step 6: Execute relevant checks
- Run ONLY the phases/checks that map to the selected framework.
- For each finding, evaluate as PASS / FAIL (compliance is binary — no WARN for compliance scans).
- Attach the specific framework control reference (e.g., "CIS 1.5", "HIPAA §164.312(d)", "PCI 8.3").

## Step 7: Compliance scoring
For the selected framework, calculate:
- **Total controls assessed**: Number of unique framework controls checked.
- **Controls passing**: Number where all mapped checks are PASS.
- **Controls failing**: Number where any mapped check is FAIL.
- **Compliance rate**: `(passing / total) × 100%`
- **Non-compliant controls**: List each failing control with affected resources and remediation.

## Step 8: Produce the compliance report
- Follow `steering/report-output.md` **compliance mode**.
- Report filename: `compliance-<framework>-<accountId>-<YYYYMMDD-HHMM>.md` and `.html`
- Report includes:
  - Framework name and version
  - Overall compliance rate (%)
  - Per-control pass/fail table with resource ARNs
  - Remediation priorities (grouped by severity)
  - Evidence for each failing control
  - AWS documentation links for remediation

## Step 9: Summary
Present to user:
- Framework assessed
- Compliance rate: X/Y controls passing (Z%)
- Top 5 critical non-compliant controls
- Report file paths

## Guardrails
- Read-only. Never create, modify, or delete any AWS resource.
- Only map to the framework the user explicitly requested — do NOT add other frameworks.
- If user asks for multiple frameworks (e.g., "CIS and HIPAA"), produce separate sections per framework in one report.
- Page through ALL results before scoring.
