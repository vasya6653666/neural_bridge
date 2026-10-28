# Azure — Data Protection

Classify data and protect it at rest and in transit, while minimizing direct human access.

## Data Classification

- Classify and label data with **Microsoft Purview** (Information Protection sensitivity labels; data
  discovery and governance across stores).
- Apply classification tags to resources; let them drive encryption, location, retention, and access controls.

## Encryption at Rest

- Azure encrypts data at rest by default (**Storage Service Encryption**, Transparent Data Encryption for SQL).
- For control, use **customer-managed keys (CMK)** in **Azure Key Vault** or **Managed HSM** (FIPS 140-2 L3).
- Enable **key rotation**; separate key administration from key usage via RBAC and Key Vault access policies.
- Enforce CMK/encryption requirements via Azure Policy.

## Encryption in Transit

- Enforce **TLS 1.2+**; disable older protocols.
- Use **HTTPS-only** on App Service/Storage; redirect HTTP.
- Manage certificates via **Key Vault**; automate renewal.
- Use private, encrypted channels for service-to-service where possible.

## Secrets Management

- Store secrets, keys, and certs in **Azure Key Vault**; access via **managed identities**; reference at runtime.
- Never hardcode secrets or place them in app settings in plaintext; use Key Vault references.
- Enable rotation and logging (Key Vault diagnostic logs); scan repos/images for leaked secrets.

## Storage Hardening & Keeping People Away from Data

- Disable **public blob access** at the storage account level (org-wide via Azure Policy).
- Use **Private Endpoints** and firewall rules to restrict access to data stores.
- Minimize direct human access to production data; where needed, make it just-in-time, logged, time-boxed.
- Enable **soft delete**, versioning, and **immutable (WORM) storage** for critical/compliance data.

## Checklist

- [ ] Classification/labels via Microsoft Purview.
- [ ] CMK in Key Vault / Managed HSM for sensitive data; rotation; admin/user separation.
- [ ] TLS 1.2+ enforced; HTTPS-only; certs managed in Key Vault.
- [ ] Secrets in Key Vault accessed via managed identities; none hardcoded.
- [ ] Public blob access disabled; Private Endpoints + firewall on data stores.
- [ ] Soft delete/versioning/immutable storage on critical data.

## References
- Azure Key Vault: https://learn.microsoft.com/azure/key-vault/general/overview
- Microsoft Purview: https://learn.microsoft.com/purview/purview
