# GCP — Application Security

Build security into how software is written, built, and deployed on Google Cloud.

## Shift Security Left

- Provide secure defaults, vetted libraries, and paved-road pipelines.
- Threat-model new features and significant changes.
- Give developers fast feedback in code review and CI.

## Secure the Supply Chain

- **Artifact Registry** with **Artifact Analysis** (container/OS/language vulnerability scanning).
- **Binary Authorization** — only allow deployment of images that meet policy (signed, scanned, from trusted
  builders) to GKE/Cloud Run.
- Adopt **SLSA**-aligned build provenance; use **Cloud Build** with least-privilege service accounts.
- Pin dependencies from trusted sources; watch for typosquatting and known CVEs.

## Code & Runtime Scanning

- **SAST** and **secret scanning** in CI (Cloud Build / GitHub / GitLab integrations).
- **Web Security Scanner** (in SCC) for DAST against App Engine, Compute Engine, and GKE web apps.
- Validate and sanitize input; use parameterized queries; encode output to prevent XSS.
- Apply least privilege to the app's service account.

## Secure the Pipeline

- Protect source with branch protection and required reviews.
- Scope Cloud Build/CI service accounts tightly; no broad Owner/Editor.
- Keep build secrets in Secret Manager, injected at runtime — never in build configs or logs.
- Scan IaC (Terraform) for misconfigurations before apply.
- Promote signed, scanned artifacts through environments rather than rebuilding per stage.

## Runtime Protection

- Front web apps with **Cloud Armor** (WAF + rate limiting).
- Use **Identity-Aware Proxy (IAP)** for context-aware access to apps and admin interfaces.
- Log application security events into Cloud Logging / SCC.

## Checklist

- [ ] Threat modeling for new features/major changes.
- [ ] Artifact Analysis scanning images; Binary Authorization enforcing deploy policy.
- [ ] SAST, secret scanning, and IaC scanning in CI; Web Security Scanner for DAST.
- [ ] Input validation, parameterized queries, output encoding.
- [ ] App/service-account least privilege; scoped Cloud Build permissions.
- [ ] Build secrets in Secret Manager, never in configs/logs.
- [ ] Cloud Armor + IAP protecting running apps.

## References
- Binary Authorization: https://cloud.google.com/binary-authorization/docs
- Software supply chain security: https://cloud.google.com/software-supply-chain-security/docs
