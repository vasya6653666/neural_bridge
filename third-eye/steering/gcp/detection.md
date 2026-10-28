# GCP — Detection

Gain visibility into activity and threats across your Google Cloud organization, and turn signals into action.

## Foundational Logging

- **Cloud Audit Logs** — record admin activity, data access, and system events.
  - Admin Activity logs are always on; **enable Data Access logs** for sensitive services (they're off by default).
  - Aggregate logs at the organization level and route with **log sinks** to a dedicated, locked-down logging
    project (and optionally to BigQuery for analysis or a bucket with retention/lock for immutability).
- **VPC Flow Logs** — network traffic metadata for investigation and anomaly detection.
- **Firewall Rules Logging** and **Cloud DNS logging** for network-layer visibility.
- Ship application/OS logs via the **Ops Agent** to **Cloud Logging**.

## Posture & Threat Detection

- **Security Command Center (SCC)** — central posture and threat management.
  - Security Health Analytics flags misconfigurations (public buckets, open firewalls, missing encryption).
  - **Event Threat Detection** analyzes logs for threats (credential abuse, crypto-mining, data exfiltration).
  - Container Threat Detection and VM Threat Detection for runtime threats.
- **Google SecOps (Chronicle)** for large-scale threat detection, investigation, and threat hunting.

## Compliance & Monitoring

- Use SCC compliance dashboards mapped to CIS, PCI, and other benchmarks.
- **Cloud Monitoring** alerting policies on security-relevant metrics and log-based metrics
  (e.g., IAM policy changes, firewall changes, root/owner grants).

## From Signal to Action

- Route findings via **Pub/Sub** → **Cloud Functions** / **Cloud Run** to automate response
  (quarantine, revoke, snapshot, notify).
- Send prioritized alerts to on-call; tune to actionable severity to avoid fatigue.

## Checklist

- [ ] Cloud Audit Logs aggregated org-wide; Data Access logs enabled for sensitive services.
- [ ] Log sinks deliver to a locked-down logging project with retention/immutability.
- [ ] VPC Flow Logs and firewall logging enabled.
- [ ] Security Command Center enabled with Health Analytics + Event Threat Detection.
- [ ] Log-based metric alerts on IAM/firewall/owner changes.
- [ ] Findings routed via Pub/Sub to automated response; alerts tuned to severity.

## References
- Cloud Audit Logs: https://cloud.google.com/logging/docs/audit
- Security Command Center: https://cloud.google.com/security-command-center/docs
