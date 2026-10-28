# Rule Pack: Baseline (platform-neutral)

Core security essentials that apply on any platform — AWS, GCP, Azure, or on-prem. Recommended for every
project. The constraints are written generically; when reviewing, NeuralBridge maps each one to the concrete control on
the project's platform (from Project Context) using the matching `steering/<platform>/` guidance. Examples of
that mapping are in the notes column.

## Design Principles
| ID  | Principle | Notes |
|-----|-----------|-------|
| DP-1 | Enforce least privilege for every human and machine identity. | |
| DP-2 | Encrypt all data at rest and in transit (TLS 1.2+). | |
| DP-3 | Use no long-lived static credentials; prefer short-lived tokens / managed identities. | |
| DP-4 | Apply defense in depth — never rely on a single control. | |
| DP-5 | Maintain traceability — log and monitor security-relevant actions. | |

## Security Constraints

### Identity & Access
| ID  | Constraint | Severity | Platform mapping (examples) |
|-----|-----------|----------|-----------------------------|
| SC-1 | No identity policy grants unrestricted (wildcard) actions on all resources. | BLOCKER | AWS `Action:"*"/Resource:"*"`; GCP primitive Owner/Editor; Azure Owner at broad scope |
| SC-2 | No long-lived static credential keys in code or config. | BLOCKER | AWS access keys; GCP SA keys; Azure client secrets |
| SC-3 | MFA required for privileged human access. | HIGH | AWS/GCP/Azure MFA; on-prem MFA on VPN/PAM |

### Data Protection
| ID  | Constraint | Severity | Platform mapping (examples) |
|-----|-----------|----------|-----------------------------|
| SC-4 | Data stores encrypt at rest. | HIGH | AWS S3/RDS/EBS; GCP CMEK; Azure SSE/TDE; on-prem FDE/TDE |
| SC-5 | Secrets come from a secrets manager/vault at runtime, never hardcoded. | BLOCKER | AWS Secrets Manager/SSM; GCP Secret Manager; Azure Key Vault; on-prem Vault |
| SC-6 | TLS 1.2+ enforced for data in transit; plaintext transport denied. | HIGH | HTTPS-only endpoints; deny non-TLS access |

### Detection
| ID  | Constraint | Severity | Platform mapping (examples) |
|-----|-----------|----------|-----------------------------|
| SC-7 | Audit logging is enabled and cannot be disabled by app code/roles. | HIGH | AWS CloudTrail; GCP Cloud Audit Logs; Azure Activity Log; on-prem SIEM/syslog |

### Application
| ID  | Constraint | Severity | Platform mapping (examples) |
|-----|-----------|----------|-----------------------------|
| SC-8 | No secrets, tokens, or keys committed to the repository. | BLOCKER | secret scanning in CI |
| SC-9 | Dependencies are pinned and free of known critical vulnerabilities. | HIGH | SCA / dependency scanning |

> When merged into a project's template, NeuralBridge keeps the constraint text generic but reviews against the concrete
> control for the selected platform. The "Platform mapping" column is guidance only and does not need to be
> copied into the template.
