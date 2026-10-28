# On-Prem — Application Security

Build security into how software is written, built, and deployed for self-hosted applications. The practices are
largely platform-independent; the difference is you run the build/registry/scanning infrastructure yourself.

## Shift Security Left

- Provide secure defaults, vetted internal libraries, and paved-road pipelines.
- Threat-model new features and significant changes.
- Give developers fast feedback in code review and CI.

## Secure the Software Development Lifecycle

- **SAST** on source in CI (SonarQube, Semgrep, etc.).
- **SCA / dependency scanning** (OWASP Dependency-Check, Trivy, Grype) against a controlled internal artifact
  repository (Nexus, Artifactory) — proxy and vet third-party packages rather than pulling straight from the
  internet.
- **Secret scanning** on every commit and image build (gitleaks, trufflehog); rotate anything exposed.
- **DAST** (OWASP ZAP) against staging.
- Validate/sanitize input, use parameterized queries, and encode output to prevent injection and XSS.

## Secure the Pipeline & Artifacts

- Self-hosted CI/CD (Jenkins, GitLab, etc.) hardened and patched; scope build-agent credentials tightly.
- Protect source with branch protection, required reviews, and signed commits.
- **Sign artifacts/images** and verify signatures before deploy; scan images in your private registry.
- Keep build secrets in a **vault**, injected at runtime — never in pipeline definitions or logs.
- Scan IaC/config (Terraform, Ansible, Kubernetes manifests) for misconfigurations before deploy.
- Promote signed, scanned artifacts through environments rather than rebuilding per stage.

## Runtime Protection

- Front web apps with a **WAF/reverse proxy**; enforce authN/authZ at the app edge.
- Apply rate limiting and bot controls on public endpoints.
- Log application security events to the central SIEM.
- Run applications with least privilege (non-root, dedicated service accounts, restricted file/network access).

## Checklist

- [ ] Threat modeling for new features/major changes.
- [ ] SAST, SCA, secret scanning, and IaC scanning in CI; DAST against staging.
- [ ] Dependencies pulled via a vetted internal repository (proxying trusted sources).
- [ ] Artifacts/images signed and verified; scanned in a private registry.
- [ ] Build secrets in a vault, never in pipeline configs/logs; scoped build-agent credentials.
- [ ] Source protected with reviews/branch protection/signed commits.
- [ ] WAF + authN/authZ protecting apps; apps run least-privilege; events logged to SIEM.

## References
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- OWASP SAMM: https://owaspsamm.org/
