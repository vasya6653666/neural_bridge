# Azure — Incident Response

Prepare to detect, investigate, and recover from security events in Azure.

## Prepare

- Maintain an IR plan with per-scenario playbooks (compromised identity, exposed storage, crypto-mining,
  data exfiltration).
- Define roles and escalation paths, including Microsoft support and your CSIRT.
- **Pre-provision an IR role** (scoped, activated via PIM) with the access responders need; secure break-glass
  accounts with monitoring.
- Centralize and protect logs in a dedicated Log Analytics workspace so evidence survives compromise.
- Tag resources with owners/classification for rapid impact assessment.

## Detect & Analyze

- Route high-severity **Defender for Cloud** alerts and **Microsoft Sentinel** incidents to on-call.
- Investigate in **Sentinel** (investigation graph, hunting queries) to establish timeline and scope.
- Preserve evidence: snapshot disks, export logs, capture NSG flow data before remediation.

## Contain, Eradicate, Recover

- **Contain:** disable compromised accounts/sessions (Entra), rotate secrets/keys, tighten NSGs/firewall,
  isolate VMs.
- **Eradicate:** remove attacker persistence (rogue app registrations, role assignments, resources); fix root cause.
- **Recover:** rebuild from known-good images/IaC, validate, resume with heightened monitoring.

## Automate Response

- Use **Sentinel automation rules + Logic App playbooks** to auto-respond: disable a user, isolate a VM,
  revoke sessions, snapshot a disk, notify the IC.

## Simulate & Iterate

- Run game days/tabletops; practice with Sentinel and Defender tooling.
- Hold blameless post-incident reviews; feed lessons into analytics rules, Azure Policy, and playbooks.

## Checklist

- [ ] IR plan with playbooks, roles, escalation paths.
- [ ] PIM-activated IR role; secured break-glass accounts.
- [ ] Centralized, protected logs in a dedicated workspace.
- [ ] Defender/Sentinel alerts routed to on-call; Sentinel for investigation.
- [ ] Evidence-preservation steps defined before remediation.
- [ ] Automated containment via Sentinel playbooks.
- [ ] Regular game days and blameless post-incident reviews.

## References
- Microsoft Sentinel SOAR: https://learn.microsoft.com/azure/sentinel/automation
