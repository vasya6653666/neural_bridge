# GCP — Incident Response

Prepare to detect, investigate, and recover from security events in Google Cloud.

## Prepare

- Maintain an incident response plan with per-scenario playbooks (compromised service account, exposed bucket,
  crypto-mining, data exfiltration).
- Define roles (incident commander, investigators, comms) and escalation paths, including Google Cloud Support.
- **Pre-provision an IR role** with the access responders need; keep break-glass access secured (MFA, alerting).
- Centralize and protect logs (see detection) in a dedicated logging project so evidence survives compromise.
- Label resources with owners and classification for fast impact assessment.

## Detect & Analyze

- Route high-severity **Security Command Center** / Event Threat Detection findings to on-call.
- Investigate with **Google SecOps (Chronicle)** to build the timeline and scope of an incident.
- Preserve evidence: snapshot disks, export relevant logs (Cloud Logging → BigQuery/bucket) before changes.

## Contain, Eradicate, Recover

- **Contain:** disable/rotate compromised service accounts and keys, tighten firewall rules, isolate instances,
  revoke sessions.
- **Eradicate:** remove attacker persistence (unexpected SAs, IAM bindings, resources) and fix the root cause.
- **Recover:** rebuild from known-good images/IaC, validate integrity, resume with heightened monitoring.

## Automate Response

- Use **SCC → Pub/Sub → Cloud Functions/Run** to trigger runbooks: quarantine a VM, disable a service account
  key, snapshot a disk, notify the IC.

## Simulate & Iterate

- Run game days / tabletop exercises; practice with the actual tooling.
- Hold blameless post-incident reviews and feed lessons back into detections, org policies, and playbooks.

## Checklist

- [ ] IR plan with per-scenario playbooks, roles, and escalation paths.
- [ ] Pre-provisioned IR role; secured break-glass access.
- [ ] Centralized, protected logs in a dedicated project.
- [ ] SCC findings routed to on-call; Chronicle available for investigation.
- [ ] Evidence-preservation steps defined before remediation.
- [ ] Automated containment via Pub/Sub + Cloud Functions.
- [ ] Regular game days and blameless post-incident reviews.

## References
- Google Cloud incident response: https://cloud.google.com/architecture/framework/security/incident-response
