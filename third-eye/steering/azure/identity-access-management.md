# Azure — Identity and Access Management

Identity is the primary security perimeter in Azure. Get it right first.

## Human Identity

- **Microsoft Entra ID** is the identity plane; federate/SSO from your IdP or use Entra as the source of truth.
- Enforce **MFA** for everyone; prefer phishing-resistant methods (FIDO2 keys, Windows Hello, passkeys) for admins.
- Use **Conditional Access** policies to require MFA, compliant devices, and trusted locations, and to block
  legacy authentication.
- Assign access to **groups**, not individuals.

## Privileged Access

- Use **Privileged Identity Management (PIM)** for just-in-time, time-bound, approval-gated elevation to
  privileged roles — no standing global admin.
- Keep the number of Global Administrators small; define **emergency/break-glass** accounts (excluded from CA,
  heavily monitored).

## Machine Identity

- Use **managed identities** (system- or user-assigned) for Azure resources to call Azure APIs — no secrets.
- For workloads outside Azure or federated CI (GitHub Actions, other clouds), use **Workload Identity
  Federation** to avoid client secrets/certs.
- Avoid app registration **client secrets**; if unavoidable, store in Key Vault and rotate. Disable/limit secret
  creation where possible.

## Least Privilege (Azure RBAC)

- Grant **built-in roles** scoped to the narrowest scope (resource > resource group > subscription > management
  group). Avoid `Owner`/`Contributor` at broad scopes.
- Create **custom roles** when built-ins grant too much.
- Use **Attribute-Based Access Control (ABAC)** conditions where supported (e.g., storage blob access by tag).
- Review access with **access reviews**; remove unused assignments.

## Anti-Patterns to Flag

- Standing Global Administrator / Owner assignments (use PIM instead).
- App client secrets in code or pipelines (use managed identities / federation).
- Broad `Contributor`/`Owner` at subscription or management-group scope.
- Legacy authentication protocols enabled.
- Missing MFA / Conditional Access on privileged accounts.

## Checklist

- [ ] Entra ID with MFA enforced; Conditional Access requires MFA/compliant devices, blocks legacy auth.
- [ ] PIM for just-in-time privileged access; minimal Global Admins; break-glass accounts defined.
- [ ] Managed identities / Workload Identity Federation instead of secrets.
- [ ] RBAC scoped narrowly; custom roles where needed; ABAC conditions where useful.
- [ ] Periodic access reviews; unused assignments removed.

## References
- Azure RBAC: https://learn.microsoft.com/azure/role-based-access-control/overview
- Privileged Identity Management: https://learn.microsoft.com/entra/id-governance/privileged-identity-management/
