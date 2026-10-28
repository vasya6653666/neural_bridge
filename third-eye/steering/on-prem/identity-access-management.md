# On-Prem — Identity and Access Management

Control who and what can access on-premises systems. Credential theft and lateral movement are the dominant
attack path in on-prem environments, so identity discipline is critical.

## Centralized Identity

- Use a central directory (**Active Directory / LDAP**) as the source of truth; avoid local accounts on
  individual servers.
- Federate applications via **SSO** (SAML/OIDC/Kerberos) so access is centrally managed and revocable.
- Integrate MFA at the directory / SSO layer.

## Strong Authentication

- Enforce **MFA** for all remote access (VPN), privileged access, and sensitive applications; prefer
  phishing-resistant methods (FIDO2/smart cards) for admins.
- Enforce strong password/passphrase policy and screen against breached-password lists.
- Disable or tightly control legacy/weak protocols (NTLM, unencrypted LDAP, basic auth).

## Privileged Access Management

- Adopt a **tiered admin model**; never use domain/enterprise admin accounts for daily work.
- Use a **PAM solution** (e.g., credential vaulting, session brokering) for check-out, rotation, and session
  recording of privileged credentials.
- Use **jump/bastion hosts** (privileged access workstations) for administration; no direct admin from
  general-purpose workstations.
- Implement **just-in-time / just-enough admin** where possible.

## Service & Machine Accounts

- Use managed service accounts (e.g., gMSA) with automatic password rotation instead of static service passwords.
- Scope service accounts to the minimum rights; never share across services; deny interactive logon.
- Rotate and vault any unavoidable static credentials.

## Least Privilege & Review

- Grant via **role-based groups**; avoid direct per-user permissions.
- Review group membership and privileged access regularly; remove stale accounts promptly on offboarding.
- Monitor for privilege escalation and unusual authentication (see detection).

## Anti-Patterns to Flag

- Shared local admin passwords across machines (use a solution like LAPS to randomize local admin).
- Domain admin used for routine tasks or running services.
- Static service-account passwords stored in scripts/config.
- Remote access without MFA.
- Legacy protocols (NTLMv1, unsigned LDAP) enabled.

## Checklist

- [ ] Central directory (AD/LDAP) with SSO; local accounts minimized.
- [ ] MFA on remote, privileged, and sensitive access; weak protocols disabled.
- [ ] Tiered admin model; PAM with vaulting/rotation/session recording; jump hosts for admin.
- [ ] Managed service accounts (gMSA) / vaulted credentials; least privilege; no interactive logon.
- [ ] Role-based groups; regular access reviews; prompt offboarding.
- [ ] Local admin passwords randomized (e.g., LAPS).

## References
- CIS Controls 5 & 6 (Account & Access Management): https://www.cisecurity.org/controls
- Microsoft tiered access model / PAWs: https://learn.microsoft.com/security/privileged-access-workstations/privileged-access-access-model
