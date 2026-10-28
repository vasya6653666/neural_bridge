# Azure — Infrastructure Protection

Apply defense in depth to networks and compute in Azure.

## Network Protection

- **Virtual Networks (VNets)** with subnets segmented by tier; workloads in private subnets.
- **Network Security Groups (NSGs)** — default-deny, allow the minimum; prefer **Application Security Groups**
  and service tags over raw IP ranges.
- **Azure Firewall** — centralized, stateful filtering with threat intelligence and FQDN/application rules.
- **Private Endpoints / Private Link** to reach PaaS services (Storage, SQL, Key Vault) over the private network;
  disable public network access on those services.
- Restrict public exposure; front services with load balancers / gateways only.

## Edge Protection

- **Azure Web Application Firewall (WAF)** on **Application Gateway** or **Front Door** — OWASP managed rules,
  rate limiting, geo-filtering.
- **Azure DDoS Protection** (Network/IP Protection) for public endpoints.

## Compute Protection

- **Azure Bastion** for RDP/SSH without public IPs; no open 22/3389 to the internet.
- **Just-in-Time VM access** (Defender for Cloud) to open management ports only when needed.
- Keep images hardened and patched with **Azure Update Manager**; use **Azure Automation**/DSC for config.
- Prefer managed/serverless (App Service, Container Apps, Functions, AKS with managed add-ons) to reduce surface.
- For AKS: private clusters, Azure CNI network policies, Workload Identity, and Defender for Containers.

## Automate Protection

- Bake controls into **Bicep/ARM/Terraform** templates.
- Enforce with **Azure Policy** (deny public IPs/blob access, require private endpoints, require encryption);
  detect drift via Defender for Cloud recommendations.

## Checklist

- [ ] VNet segmentation; workloads private; NSGs default-deny scoped by ASG/service tag.
- [ ] Azure Firewall for centralized egress/ingress control.
- [ ] Private Endpoints for PaaS; public network access disabled on those services.
- [ ] WAF on App Gateway/Front Door; DDoS Protection on public endpoints.
- [ ] Bastion + Just-in-Time access; no public RDP/SSH.
- [ ] Update Manager patching; managed/serverless preferred.
- [ ] Controls enforced via IaC + Azure Policy; drift caught by Defender for Cloud.

## References
- Azure Firewall: https://learn.microsoft.com/azure/firewall/overview
- Azure WAF: https://learn.microsoft.com/azure/web-application-firewall/overview
