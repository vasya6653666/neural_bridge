<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-orbital-dark.png">
  <img src="assets/hero-orbital-light.png" alt="AWS Security Analyzer — NeuralBridge Power" width="100%">
</picture>

<h1 align="center">AWS Security Analyzer</h1>

<p align="center">
  A <a href="https://neuralbridge.ru/powers">NeuralBridge Power</a> that runs a read-only AWS security posture scan from your IDE —<br>
  <b>194 checks</b> across <b>43 services</b>, with <b>3 scan modes</b>: General, Compliance, and Well-Architected.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/checks-194-ff9900?style=flat-square">
  <img src="https://img.shields.io/badge/services-43-ff9900?style=flat-square">
  <img src="https://img.shields.io/badge/scan%20modes-3-4dd0e1?style=flat-square">
  <img src="https://img.shields.io/badge/frameworks-5-4dd0e1?style=flat-square">
  <img src="https://img.shields.io/badge/MCP%20servers-4-4dd0e1?style=flat-square">
  <img src="https://img.shields.io/badge/license-MIT-666?style=flat-square">
</p>

---

> **Read-only by design.** The `aws-mcp` proxy runs with `--read-only` and the IAM server with `--readonly`, so write-capable tools are hidden — every call is `describe` / `list` / `get`. Nothing is created, modified, or deleted. Sensitive metadata is handled carefully: IAM policy documents are summarized (not pasted), Lambda env-var **values** and secret values are never emitted, and the report stays on your machine.

## 3 Scan Modes

| Mode | Trigger | What It Does |
|------|---------|--------------|
| **General Security Scan** | "run a security scan" | Discovers account resources, asks which to scan, runs 194 best-practice checks, produces PASS/WARN/FAIL report with risk score. No compliance mapping. |
| **Compliance Scan** | "run a CIS scan" / "check HIPAA compliance" / "PCI DSS assessment" | Only when you explicitly name a framework. Runs relevant checks, maps to framework controls, produces compliance rate (%). |
| **Well-Architected Security** | "run well-architected security assessment" | Assesses against the AWS Well-Architected Security Pillar using the dedicated MCP server. |

### General Security Scan (default)

```
run the AWS security scan
scan my AWS account security
check my account for security issues
```

- Discovers what resources exist in your account first
- Presents a summary and **asks you which categories to scan**
- Only runs checks against services you actually use
- No compliance framework mapping — just security best practices
- Output: `security-report-<account>-<timestamp>.md/.html`

### Compliance Scan (only when asked)

```
run a CIS benchmark scan
check my account for HIPAA compliance
PCI DSS assessment against us-east-1
run SOC 2 audit
FSBP compliance check
```

- Only triggered when you explicitly mention a framework
- Runs only the checks mapped to that framework
- Binary PASS/FAIL per control (no WARN)
- Produces compliance rate: X/Y controls passing (Z%)
- Output: `compliance-<framework>-<account>-<timestamp>.md/.html`

### Well-Architected Security Assessment

```
run well-architected security assessment
assess my security pillar posture
```

- Uses the `well-architected-security-mcp-server` directly
- Checks service coverage, findings, compliance posture
- Produces prioritized recommendations aligned to WAF best practices

## Install

Install the power from the **Powers** panel in NeuralBridge IDE.

**Prerequisites:** AWS CLI ≥ 2.32.0 · `uvx` · a working `aws sts get-caller-identity`.

## Coverage (43 services, 194 checks)

**Identity & governance** — IAM (key rotation, wildcard policies, MFA, root hygiene, boundaries), KMS, Secrets Manager, Cognito, Systems Manager.

**Data protection** — S3, RDS, DynamoDB, EBS, EFS, ElastiCache, Redshift, Athena, Glue, Kinesis, MSK, AWS Backup.

**Network & edge** — EC2/VPC (IMDSv2, 0.0.0.0/0 ingress, flow logs), ELB/ALB/NLB, CloudFront, API Gateway, WAF, Network Firewall, Transit Gateway, Global Accelerator, Route 53.

**Compute & app** — Lambda, EKS/ECS/ECR, OpenSearch, SNS/SQS, SageMaker, AMI, AppSync, Step Functions.

**Detective & monitoring** — GuardDuty, CloudTrail, Security Hub, Inspector, IAM Access Analyzer, Compute Optimizer, CloudWatch, EventBridge, Trusted Advisor.

## Compliance Frameworks (only in Compliance Scan mode)

| Framework | Controls Mapped |
|-----------|----------------|
| CIS AWS Foundations Benchmark v3.0 | 27+ |
| AWS Foundational Security Best Practices (FSBP) | 50+ |
| HIPAA | 25+ |
| PCI DSS v4.0 | 20+ |
| SOC 2 Type II | 18+ |

## Skills

| Skill | What it does |
|-------|--------------|
| `scan` | General Security Scan — resource discovery, user-confirmed scope, best-practice checks |
| `compliance-scan` | Compliance Scan — framework-specific assessment (CIS/HIPAA/SOC2/PCI/FSBP) |
| `iam-deep-dive` | Policy simulation, inline policy audit, Access Analyzer findings |
| `well-architected-assessment` | WA Security Pillar — coverage, compliance, recommendations |
| `report` | Regenerate Markdown + HTML from existing findings |

## MCP servers

| Server | Purpose |
|--------|---------|
| `aws-mcp` | All AWS API calls (read-only) |
| `iam-mcp-server` | Deep IAM analysis (read-only) |
| `well-architected-security-mcp-server` | WA Security Pillar assessment |
| `aws-documentation-mcp-server` | Remediation references + docs |

## Layout

```
├── plugin.json · mcp.json
├── skills/
│   ├── scan/                    General Security Scan
│   ├── compliance-scan/         Compliance Framework Scan
│   ├── iam-deep-dive/           Deep IAM Analysis
│   ├── well-architected-assessment/  WA Security Pillar
│   └── report/                  Report Generation
├── steering/
│   ├── scan-workflow.md         Execution phases (44 phases)
│   ├── checks-catalog.md       All 194 checks + compliance mappings
│   └── report-output.md        Report format (general + compliance modes)
└── context-templates/
    ├── scan-scope.json          Scan configuration template
    └── exceptions.csv           Accepted-risk suppressions
```

---

[MIT](LICENSE) © 2026 Venkata Pavan Vishnu Rachapudi

---

## Privacy & Support

- **Privacy Policy**: [Privacy Policy](https://github.com/aquavis12/power-aws-security-analyzer/blob/main/PRIVACY.md)
- **Support**: [GitHub Issues](https://github.com/aquavis12/power-aws-security-analyzer/issues) or rachapudivishnu9@gmail.com
