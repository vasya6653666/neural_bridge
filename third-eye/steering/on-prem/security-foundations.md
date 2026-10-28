# On-Prem — Security Foundations

Governance and organizational controls for on-premises / self-hosted environments (data centers, private
infrastructure). Grounded in defense in depth and frameworks like CIS Controls and NIST CSF. The Well-Architected
principles (least privilege, traceability, defense in depth, protect data, prepare for events) apply here too —
you just own more of the stack.

## You Own the Whole Stack

Unlike cloud, there is no shared responsibility split — you are responsible for physical security, hardware,
hypervisor, OS, network, application, and data. Plan controls at every layer accordingly.

## Asset Management & Governance

- Maintain an accurate **asset inventory** (hardware, VMs, software, data stores) — you cannot protect what you
  don't know about (CIS Controls 1 & 2).
- Define **ownership** for every system and data store.
- Establish a documented **security baseline** (hardening standards, patch SLAs, config standards) and enforce
  it with configuration management.
- Classify systems and data by sensitivity; drive controls from classification.

## Physical Security

- Restrict physical access to server rooms/data centers (badge access, logging, cameras).
- Protect against environmental risk (power, cooling, fire suppression).
- Secure and track removable media; enforce disposal/destruction policies for decommissioned drives.

## Network Zoning & Segmentation

- Segment the network into trust zones (DMZ, internal, management, restricted/PCI) with firewalls between them.
- Separate the **management plane** (iLO/iDRAC/IPMI, hypervisor management, switch admin) from user networks.
- Apply the principle of least connectivity between zones.

## Identity Foundation

- Centralize identity (Active Directory / LDAP); avoid per-system local accounts.
- Adopt a **tiered administration model** (Tier 0 domain controllers/identity, Tier 1 servers, Tier 2
  workstations) so credential exposure is contained.

## Foundational Checklist

- [ ] Complete, maintained asset inventory with owners.
- [ ] Documented hardening/patch/config baseline enforced by config management.
- [ ] Data/system classification scheme applied.
- [ ] Physical access controls and environmental protections in place.
- [ ] Network segmented into trust zones; management plane isolated.
- [ ] Centralized identity (AD/LDAP) with a tiered admin model.

## References
- CIS Controls: https://www.cisecurity.org/controls
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
