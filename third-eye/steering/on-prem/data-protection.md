# On-Prem — Data Protection

Classify data and protect it at rest, in transit, and in backups, while minimizing direct human access.

## Data Classification

- Define classification levels (public, internal, confidential, restricted) and label data accordingly.
- Inventory where sensitive data lives (file shares, databases, endpoints); use DLP tooling to discover and
  monitor it.
- Drive controls (encryption, access, retention, egress) from classification.

## Encryption at Rest

- **Full-disk encryption** on servers and especially laptops/removable media (BitLocker, LUKS, dm-crypt).
- **Database encryption** (TDE) for sensitive databases; application-level or column encryption for the most
  sensitive fields.
- **File/share encryption** for confidential data at rest.
- Manage keys centrally with a **KMS/HSM** (FIPS 140-2/3 validated); never store keys next to the data they
  protect; separate key admins from data users.

## Encryption in Transit

- Enforce **TLS 1.2+** for all application and management traffic; disable SSL/early TLS and weak ciphers.
- Use internal PKI / certificate management; automate issuance and renewal; monitor for expiry.
- Encrypt replication, backup, and inter-site links (IPsec/TLS).

## Secrets Management

- Store secrets in a dedicated **secrets manager/vault** (e.g., HashiCorp Vault, CyberArk); issue short-lived,
  audited credentials where possible.
- Never hardcode secrets in scripts, config files, or images; inject at runtime.
- Rotate secrets and keys on a schedule and on personnel changes; scan repos/images for leaks.

## Backups & Data Integrity

- Follow a **3-2-1 backup** strategy; encrypt backups; test restores regularly.
- Keep at least one **offline/immutable/air-gapped** copy to survive ransomware.
- Protect backup systems with strong, separate credentials and monitoring.

## Keeping People Away from Data

- Minimize standing human access to production/sensitive data; use just-in-time, logged, time-boxed access.
- Prefer tooling/automation that operates on data on the user's behalf over granting broad direct access.
- Enforce secure disposal/destruction of media and decommissioned drives.

## Checklist

- [ ] Classification scheme applied; sensitive data inventoried (DLP where available).
- [ ] Full-disk encryption on servers/endpoints; TDE/field encryption for sensitive DBs.
- [ ] Central KMS/HSM key management; keys separated from data; admin/user separation.
- [ ] TLS 1.2+ enforced; internal PKI with automated renewal; encrypted replication/links.
- [ ] Secrets in a vault, injected at runtime; rotation; none hardcoded.
- [ ] 3-2-1 backups, encrypted, with an offline/immutable copy and tested restores.
- [ ] Direct access to sensitive data minimized; secure media disposal.

## References
- CIS Control 3 (Data Protection): https://www.cisecurity.org/controls
- NIST SP 800-57 (Key Management): https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final
