# Rule Packs

Ready-made sets of security rules you can adopt as-is. Each pack is a curated list of design principles (DP-*)
and security constraints (SC-*) with sensible severities, drawn from well-architected security guidance and
common compliance needs.

> **Note:** If your org has a **centrally-governed baseline** (a security team's repo/URL), configure it in the
> template's *Baseline Rules Source* — that fetched baseline is the source of truth. These bundled packs are
> **starter content and offline fallback**, useful when no governed baseline is configured or the fetch fails.

**How to use them:**
- During setup, tell NeuralBridge which packs you want (e.g., "add the baseline and web-app packs").
- NeuralBridge merges the chosen packs into your `.neuralbridge/security-template.md`, renumbering IDs so they're unique.
- You can then tweak, remove, or add rules in plain language ("remove SC-7", "add a rule: ...").
- Commit `.neuralbridge/security-template.md` to your repo so the whole team shares the same ruleset.

**Available packs:**

| Pack | File | Best for |
|------|------|----------|
| Baseline | `baseline.md` | Every project — platform-neutral core essentials (AWS/GCP/Azure/on-prem) |
| Web Application | `web-app.md` | Public-facing apps and APIs |
| Data Privacy | `data-privacy.md` | Apps handling PII / sensitive data (GDPR-minded) |
| PCI DSS | `pci-dss.md` | Payment / cardholder data workloads |
| Infrastructure as Code | `iac.md` | Terraform / CloudFormation / CDK repos |

Packs are additive — combine as many as apply to your project.
