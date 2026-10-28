# Azure — Application Security

Build security into how software is written, built, and deployed on Azure.

## Shift Security Left

- Provide secure defaults, vetted libraries, and paved-road pipelines.
- Threat-model new features and significant changes.
- Give developers fast feedback in pull requests and CI.

## Secure the Supply Chain

- Scan container images with **Microsoft Defender for Containers** (registry and runtime).
- Use **GitHub Advanced Security** (or **Defender for DevOps** / Defender for Cloud DevOps security) for code
  scanning, secret scanning, and dependency review across Azure DevOps and GitHub.
- Pin dependencies from trusted feeds; watch for typosquatting and known CVEs.
- Establish build provenance; use least-privilege pipeline identities.

## Code & Runtime Scanning

- **SAST** and **secret scanning** in CI (GitHub Advanced Security / Azure DevOps).
- **DAST** against staging environments.
- Validate/sanitize input; use parameterized queries; encode output to prevent XSS.
- Apply least privilege to the app's managed identity.

## Secure the Pipeline

- Protect source with branch policies and required reviews.
- Scope pipeline service connections/identities tightly; avoid broad Owner/Contributor.
- Keep pipeline secrets in **Key Vault** (or secure pipeline variables), injected at runtime — never in YAML or logs.
- Scan IaC (Bicep/ARM/Terraform) for misconfigurations before deploy.
- Promote signed, scanned artifacts through environments rather than rebuilding per stage.

## Runtime Protection

- Front web apps with **Azure WAF** (Application Gateway / Front Door).
- Use **Entra ID** / **App Service Authentication (Easy Auth)** for authN/authZ; **API Management** for API
  protection and throttling.
- Log application security events to Log Analytics / Sentinel.

## Checklist

- [ ] Threat modeling for new features/major changes.
- [ ] Defender for Containers scanning images; GitHub Advanced Security / Defender for DevOps enabled.
- [ ] SAST, secret scanning, IaC scanning in CI; DAST against staging.
- [ ] Input validation, parameterized queries, output encoding.
- [ ] App managed-identity least privilege; scoped pipeline identities.
- [ ] Pipeline secrets in Key Vault, never in YAML/logs.
- [ ] WAF + Entra auth / APIM protecting running apps.

## References
- DevOps security (Defender for Cloud): https://learn.microsoft.com/azure/defender-for-cloud/defender-for-devops-introduction
- Azure WAF: https://learn.microsoft.com/azure/web-application-firewall/overview
