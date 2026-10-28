# GCP — Security Foundations

Governance and organizational controls for Google Cloud, aligned with the Google Cloud Architecture Framework
(Security pillar). Establish these before hardening individual workloads.

## Shared Responsibility & Shared Fate

Google secures the underlying infrastructure; you secure what you build on it — configuration, identity, data,
and access. Google's "shared fate" model adds opinionated blueprints, guardrails, and Assured Workloads to make
the secure path the default. Confirm which side owns a control before assuming it's handled (more is managed for
you with serverless/managed services than with Compute Engine).

## Resource Hierarchy

Structure resources so policy inherits cleanly and blast radius is contained:
- **Organization** (root) → **Folders** (by department/environment) → **Projects** (isolation boundary) → resources.
- Use **projects as the primary isolation boundary** — separate prod, staging, and dev, and separate workloads
  by blast radius.
- Keep dedicated projects for shared concerns: centralized logging, security tooling, and shared VPC/networking.

## Organization Policy Service

Org policies are guardrails applied across the hierarchy — they constrain what can be configured, regardless of
IAM grants. Common constraints to enforce:
- Restrict resource locations to approved regions.
- Disable service account key creation (`iam.disableServiceAccountKeyCreation`).
- Enforce uniform bucket-level access and block public IPs on VMs.
- Require OS Login; restrict which external identities can be granted access (`iam.allowedPolicyMemberDomains`).
- Require Shielded VMs.

## Foundational Controls

- **Cloud Identity / Google Workspace** as the identity source; centralize via SSO federation.
- **Security Command Center (SCC)** enabled at the organization level for posture and threat visibility.
- **Assured Workloads** where compliance/data-residency regimes apply.
- Consistent **labels** for ownership, environment, and data classification to drive automated policy.
- Secure the **super admin** accounts: enforce MFA (hardware keys), limit membership, alert on use.

## Foundational Checklist

- [ ] Organization + folder/project hierarchy with prod/dev isolation.
- [ ] Dedicated projects for logging, security tooling, and shared networking.
- [ ] Org policies enforce region limits, no SA keys, no public IPs, OS Login, Shielded VMs.
- [ ] Cloud Identity federated via SSO; super admins protected with MFA and alerting.
- [ ] Security Command Center enabled org-wide.
- [ ] Consistent labeling for ownership, environment, and classification.

## References
- Google Cloud Architecture Framework — Security: https://cloud.google.com/architecture/framework/security
- Organization Policy Service: https://cloud.google.com/resource-manager/docs/organization-policy/overview
