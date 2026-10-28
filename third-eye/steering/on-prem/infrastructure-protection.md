# On-Prem — Infrastructure Protection

Apply defense in depth to on-premises networks and hosts.

## Network Protection

- **Segment** the network into VLANs/zones (DMZ, app, data, management, restricted) with **firewalls** enforcing
  least connectivity between them.
- Place internet-facing services in a **DMZ**; never expose internal systems directly.
- Use **Network Access Control (NAC)** to authenticate devices joining the network (802.1X).
- Consider **micro-segmentation** for east-west control between workloads.
- Terminate remote access through hardened **VPN** with MFA; restrict management interfaces to a dedicated
  management network.

## Perimeter & Edge

- Next-generation firewalls with IPS at the perimeter and between high-value zones.
- **WAF** in front of web applications; DDoS mitigation (appliance or upstream/ISP scrubbing).
- Filter outbound (egress) traffic and DNS to known-good destinations to limit exfiltration and C2.

## Host Hardening

- Apply **CIS Benchmarks** (or DISA STIGs) to OS and platform builds; manage with configuration management
  (Ansible, Puppet, Chef, GPO).
- Remove/disable unnecessary services, ports, and default accounts; close unused listening ports.
- Enforce host-based firewalls and, where supported, application allow-listing.
- Administer via **jump/bastion hosts**; no direct admin from user workstations; disable direct root/administrator
  remote login.

## Patch & Vulnerability Management

- Run authenticated **vulnerability scans** regularly (e.g., Nessus, OpenVAS, Qualys).
- Patch on a risk-based SLA (critical fastest); track coverage and exceptions.
- Maintain golden images and rebuild rather than letting servers drift.

## Automate & Enforce

- Use configuration management to enforce hardening and detect/correct drift.
- Validate changes against baseline before deployment.

## Checklist

- [ ] Network segmented into zones with firewalls; DMZ for public services; NAC (802.1X) on the LAN.
- [ ] Management network isolated; remote access via MFA VPN; egress/DNS filtered.
- [ ] IPS at perimeter/high-value zones; WAF for web apps; DDoS mitigation available.
- [ ] OS/platform hardened to CIS/STIG via config management; unused services/ports disabled.
- [ ] Admin via jump hosts; direct root/admin remote login disabled.
- [ ] Regular authenticated vuln scans; risk-based patch SLAs; golden images.

## References
- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks
- CIS Controls 4 & 12 (Secure Config & Network): https://www.cisecurity.org/controls
