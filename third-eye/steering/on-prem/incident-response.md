# On-Prem — Incident Response

Prepare to detect, investigate, and recover from security events in on-premises environments.

## Prepare

- Maintain an IR plan with per-scenario playbooks (ransomware, account compromise, data breach, insider misuse,
  malware outbreak).
- Stand up a **CSIRT** with defined roles (incident commander, investigators, comms, legal) and 24/7 escalation
  contacts; know notification/regulatory obligations.
- **Pre-provision responder access** and secure, monitored break-glass credentials; store them offline.
- Ensure logs are centralized and immutable (see detection) so evidence survives an attacker on the network.
- Prepare a **forensics capability**: imaging tools, a clean isolated analysis network, and chain-of-custody
  procedures.
- Keep offline copies of the plan and contacts — they must be usable when systems/AD are down.

## Detect & Analyze

- Route high-severity SIEM/EDR alerts to on-call.
- Triage scope: which accounts, hosts, segments, and data are affected.
- **Preserve evidence first:** capture memory and disk images, export relevant logs, and note timelines before
  remediation (especially if legal/regulatory action may follow).

## Contain, Eradicate, Recover

- **Contain:** isolate affected hosts/segments (network quarantine, disable switch ports), disable compromised
  accounts, rotate credentials, block C2 at the firewall/DNS.
- **Eradicate:** remove malware and persistence (services, scheduled tasks, rogue accounts, backdoors); patch the
  exploited weakness.
- **Recover:** rebuild from known-good images and restore data from clean, verified backups; validate integrity;
  return to operations with heightened monitoring. For ransomware, restore from offline/immutable backups.

## Simulate & Iterate

- Run tabletop exercises and technical game days, including a full **restore-from-backup** drill.
- Hold blameless post-incident reviews; feed lessons into detections, hardening, segmentation, and playbooks.

## Checklist

- [ ] IR plan with playbooks; CSIRT roles and 24/7 escalation defined; offline copies available.
- [ ] Pre-provisioned responder access; secured offline break-glass credentials.
- [ ] Centralized, immutable logs; forensics tooling and clean analysis network ready.
- [ ] Evidence preserved (memory/disk images, logs) before remediation with chain of custody.
- [ ] Containment, eradication, and recovery steps defined; restore-from-offline-backup validated.
- [ ] Regular tabletops/game days and blameless post-incident reviews.

## References
- NIST SP 800-61 (Incident Handling): https://csrc.nist.gov/pubs/sp/800/61/r2/final
