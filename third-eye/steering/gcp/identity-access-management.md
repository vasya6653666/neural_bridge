# GCP — Identity and Access Management

Control who and what can act on your Google Cloud resources. Most incidents trace back to identity, so this is
the highest-leverage area.

## Human Identity

- Use **Cloud Identity** or **Google Workspace** as the identity source; federate from your existing IdP
  (Okta, Entra ID) via SAML/OIDC so there's a single front door.
- Enforce **MFA** for all users, phishing-resistant (security keys / Titan) for admins.
- Grant access to **groups**, not individuals; manage membership in the IdP.

## Machine Identity (Service Accounts)

- Attach **service accounts** to workloads for API access; never embed keys.
- **Do not create service account keys.** Use:
  - **Workload Identity Federation** for workloads outside GCP (AWS, Azure, on-prem, GitHub Actions) — exchange
    external credentials for short-lived tokens, no keys.
  - **Workload Identity** for GKE pods.
  - Attached service accounts + the metadata server for GCE/Cloud Run/Functions.
- If a key is unavoidable, rotate it automatically and store it in Secret Manager.
- Disable SA key creation org-wide via org policy; audit existing keys.

## Least Privilege

- Prefer **predefined roles** over primitive roles (`Owner`/`Editor`/`Viewer` are too broad — avoid in prod).
- Create **custom roles** when predefined roles grant more than needed.
- Use **IAM Conditions** to constrain by resource, request time, or attributes.
- Use the **IAM Recommender** (policy insights) to remove unused permissions automatically.
- Apply **VPC Service Controls** to create a service perimeter that limits data exfiltration even for
  authorized identities.

## Separation of Duties & Review

- Split powerful capabilities across roles (deployer ≠ approver; key user ≠ key admin).
- Review access regularly; act on IAM Recommender findings.
- Alert on grants of broad roles (Owner/Editor) and on external-domain principals.

## Anti-Patterns to Flag

- Service account JSON keys committed to code or CI.
- Primitive `Owner`/`Editor` roles granted broadly in production.
- `allUsers` / `allAuthenticatedUsers` bindings (public access) on resources.
- Long-lived keys where Workload Identity Federation would work.
- Missing MFA on privileged users.

## Checklist

- [ ] Identity federated via Cloud Identity/Workspace; MFA enforced (keys for admins).
- [ ] Access granted to groups; predefined/custom roles, not primitive roles.
- [ ] No service account keys; Workload Identity (Federation) used instead.
- [ ] IAM Conditions and VPC Service Controls constrain access and data movement.
- [ ] IAM Recommender findings actioned; regular access reviews.
- [ ] No `allUsers`/`allAuthenticatedUsers` bindings unless explicitly intended.

## References
- GCP IAM overview: https://cloud.google.com/iam/docs/overview
- Workload Identity Federation: https://cloud.google.com/iam/docs/workload-identity-federation
