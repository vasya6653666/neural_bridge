# Azure — Detection

Gain visibility into activity and threats across your Azure estate and act on them.

## Foundational Logging

- **Azure Activity Log** — subscription-level control-plane events (who did what).
- **Resource/diagnostic logs** — enable **diagnostic settings** on resources and route to a central
  **Log Analytics workspace** (and/or a storage account with immutability, or Event Hub).
- Centralize logs in a dedicated, access-controlled workspace/subscription; apply retention and immutability.
- **NSG flow logs** / **VNet flow logs** for network visibility; **Entra ID sign-in and audit logs** for identity.

## Posture & Threat Protection

- **Microsoft Defender for Cloud** — posture management (Secure Score, recommendations) plus workload
  protection (Defender plans for servers, storage, SQL, containers, Key Vault, App Service).
- Enable relevant **Defender plans** for the workloads you run.
- Map compliance via the regulatory compliance dashboard (Microsoft Cloud Security Benchmark, CIS, PCI).

## SIEM / SOAR

- **Microsoft Sentinel** — cloud-native SIEM/SOAR built on Log Analytics.
  - Ingest Azure, Entra, Microsoft 365, and third-party logs.
  - Analytics rules for threat detection; **automation rules + playbooks (Logic Apps)** for response.

## From Signal to Action

- Alert on security-relevant changes (role assignments, NSG/firewall changes, Key Vault access, policy changes)
  via Azure Monitor alerts and Sentinel analytics.
- Trigger **Logic App playbooks** to auto-respond; route prioritized alerts to on-call.

## Checklist

- [ ] Activity Log + diagnostic settings routed to a central Log Analytics workspace with retention/immutability.
- [ ] NSG/VNet flow logs and Entra sign-in/audit logs collected.
- [ ] Defender for Cloud enabled with relevant Defender plans; Secure Score monitored.
- [ ] Microsoft Sentinel deployed with analytics rules and response playbooks.
- [ ] Alerts on RBAC/NSG/Key Vault/policy changes; on-call routing tuned to severity.

## References
- Microsoft Defender for Cloud: https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction
- Microsoft Sentinel: https://learn.microsoft.com/azure/sentinel/overview
