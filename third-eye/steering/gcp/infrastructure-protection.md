# GCP — Infrastructure Protection

Apply defense in depth to networks and compute in Google Cloud.

## Network Protection

- **VPC design:** put workloads in private subnets; use **Shared VPC** to centralize network administration.
- **Firewall rules / hierarchical firewall policies:** default-deny, then allow the minimum. Prefer
  **network tags** and **service accounts** as targets/sources over broad IP ranges.
- **Private Google Access** and **Private Service Connect** to reach Google APIs without public IPs.
- **VPC Service Controls** to build a service perimeter that mitigates data exfiltration.
- Avoid external IPs on VMs (enforce via org policy); expose services through load balancers only.

## Edge Protection

- **Cloud Armor** — WAF and DDoS protection at the global load balancer (managed WAF rules, OWASP protections,
  rate limiting, geo controls, adaptive protection).
- **Cloud CDN** + Cloud Armor for cached public content behind protection.
- **Cloud DNS** with DNSSEC.

## Compute Protection

- **Shielded VMs** (secure boot, vTPM, integrity monitoring) — enforce via org policy.
- **OS Login** with IAM-controlled SSH; avoid managing SSH keys manually; no open SSH to the internet
  (use **IAP TCP forwarding** for admin access instead of public bastions).
- Use hardened/minimal images; keep them current with **OS patch management** (VM Manager).
- Prefer managed/serverless (Cloud Run, Cloud Functions, GKE Autopilot) to shrink the patching surface.
- For GKE: private clusters, Workload Identity, network policies, and shielded nodes.

## Automate Protection

- Bake controls into Terraform/Deployment Manager templates.
- Enforce configuration via **Organization Policies**; detect drift with SCC Health Analytics and remediate.

## Checklist

- [ ] Private subnets; no external IPs on VMs (org policy enforced).
- [ ] Default-deny firewall rules scoped by tag/service account.
- [ ] Private Google Access / PSC; VPC Service Controls perimeter for sensitive data.
- [ ] Cloud Armor (WAF + DDoS) on public load balancers.
- [ ] Shielded VMs + OS Login; admin access via IAP, not public SSH/RDP.
- [ ] Patch management in place; managed/serverless preferred where possible.
- [ ] Controls enforced via IaC and org policy; drift detected via SCC.

## References
- Cloud Armor: https://cloud.google.com/armor/docs/security-policy-overview
- VPC Service Controls: https://cloud.google.com/vpc-service-controls/docs/overview
