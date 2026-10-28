# Azure — Security Foundations

Governance and organizational controls for Microsoft Azure, aligned with the Azure Well-Architected Framework
(Security pillar) and the Cloud Adoption Framework.

## Shared Responsibility

Microsoft secures the physical infrastructure and, increasingly, the platform for managed/PaaS and SaaS
services; you own identity, data, configuration, and access. The division shifts by service type
(IaaS → you own OS/patching; PaaS/serverless → Microsoft owns more). Confirm ownership per service.

## Resource Hierarchy

- **Management groups** → **Subscriptions** → **Resource groups** → resources.
- Use **management groups** to apply governance broadly and **subscriptions** as strong isolation/billing
  boundaries. Separate prod, non-prod, and by blast radius.
- Adopt **Azure Landing Zones** (Cloud Adoption Framework) for a governed, multi-subscription baseline with
  platform subscriptions for identity, management, and connectivity.

## Azure Policy

Azure Policy enforces guardrails across the hierarchy (audit or deny). Common policies:
- Restrict resource locations to approved regions.
- Require encryption, HTTPS-only, and private endpoints.
- Deny public IPs / public blob access.
- Enforce required tags and allowed SKUs.
- Deploy **initiatives** (policy sets) mapped to CIS, PCI, or Microsoft Cloud Security Benchmark.

## Foundational Controls

- **Microsoft Entra ID** (formerly Azure AD) as the identity foundation; federate/SSO from your IdP.
- **Microsoft Defender for Cloud** enabled across subscriptions for posture (Secure Score) and workload protection.
- **Microsoft Cloud Security Benchmark** as the baseline; track via Defender for Cloud.
- Consistent **tags** for ownership, environment, and data classification.
- Protect **Global Administrator** accounts: enforce MFA, minimize count, use emergency/break-glass accounts.

## Foundational Checklist

- [ ] Management group + subscription hierarchy with prod/non-prod isolation (ideally Landing Zones).
- [ ] Azure Policy initiatives enforce regions, encryption, HTTPS, no public access, tagging.
- [ ] Entra ID federated/SSO; Global Admins protected with MFA; break-glass accounts defined.
- [ ] Defender for Cloud enabled; Secure Score monitored against the Cloud Security Benchmark.
- [ ] Consistent tagging for ownership, environment, classification.

## References
- Azure Well-Architected — Security: https://learn.microsoft.com/azure/well-architected/security/
- Cloud Adoption Framework — Landing Zones: https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/
