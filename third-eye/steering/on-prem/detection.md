# On-Prem — Detection

Gain visibility into activity and threats across on-premises systems and networks, and act on them.

## Centralized Logging

- Ship logs from all systems to a **central log platform / SIEM** (Splunk, Elastic, Microsoft Sentinel,
  Wazuh, Graylog) via syslog/agents — never rely on local logs an attacker can wipe.
- Collect: OS security logs (auth, privilege use), directory logs (AD authentication, Kerberos), firewall and
  network device logs, application logs, and DNS/DHCP logs.
- Protect the log store: restrict access, enable **write-once/immutable** retention, and set retention per policy.
- Synchronize time (NTP) across all systems so correlated timelines are accurate.

## Network Detection

- **IDS/IPS** (e.g., Suricata, Zeek) at zone boundaries and the perimeter.
- **NetFlow / packet capture** for investigation and anomaly detection.
- Monitor east-west (internal) traffic, not just north-south, to catch lateral movement.

## Endpoint & Integrity

- Deploy **EDR / antivirus** on servers and workstations with central management and alerting.
- **File Integrity Monitoring (FIM)** on critical system and config files.
- Watch for new local admin accounts, service creation, scheduled tasks, and unexpected persistence.

## Correlate & Alert

- Build SIEM detections for high-value signals: repeated auth failures, privileged group changes, off-hours
  admin activity, disabled logging/AV, and known attack patterns (e.g., pass-the-hash, Kerberoasting).
- Tune alerts to actionable severity and route to on-call; avoid fatigue.
- Establish detection use cases mapped to a framework like **MITRE ATT&CK**.

## Checklist

- [ ] All systems ship logs to a central SIEM; log store access-controlled and immutable.
- [ ] NTP time sync across the estate.
- [ ] IDS/IPS and NetFlow at boundaries; internal (east-west) traffic monitored.
- [ ] EDR/AV centrally managed on servers and workstations; FIM on critical files.
- [ ] SIEM detections for auth anomalies, privilege changes, persistence, and ATT&CK techniques.
- [ ] Alerts tuned to severity and routed to on-call.

## References
- CIS Control 8 (Audit Log Management): https://www.cisecurity.org/controls
- MITRE ATT&CK: https://attack.mitre.org/
