---
name: "third-eye"
displayName: "Third Eye"
description: "A security watchdog for your codebase across AWS, GCP, Azure, and on-prem. Reviews application code and infrastructure against your custom rules plus a well-architected security baseline, and produces a daily Red/Amber/Green review log so nothing risky merges unnoticed."
keywords: ["third eye", "security review", "code review", "cloud security", "aws security", "gcp security", "azure security", "on-prem security", "well-architected", "daily review log"]
author: "Bharat Lohra, FDE @ Accenture"
---

# Third Eye

## Overview

**Third Eye** is a security watchdog for your codebase. It packages well-architected security best practices across **four platforms — AWS, GCP, Azure, and on-premises** — and puts them to work: reviewing architectures and code, checking changes against your own custom rules, and producing a daily Red/Amber/Green review log so a human reviewer can keep up even when a team ships fast with NeuralBridge.

The guidance is grounded in the major cloud security frameworks (AWS Well-Architected Security Pillar, Google Cloud Architecture Framework, Microsoft Azure Well-Architected Framework) and, for on-prem, industry baselines like the CIS Controls and NIST CSF. All four share the same seven-part structure and a common set of design principles, so the review experience is consistent regardless of where your workloads run. This power turns those principles into actionable guidance, decision checklists, and concrete platform-specific service recommendations so that security is applied consistently rather than as an afterthought.

Use this power when designing new systems, reviewing existing ones, hardening infrastructure-as-code, threat-modeling a feature, or answering "is this secure and how do I make it better?" questions. Pick the steering folder for your platform (`aws/`, `gcp/`, `azure/`, or `on-prem/`); the underlying principles (least privilege, defense in depth, encryption everywhere, traceability) transfer across all of them.

## The Seven Security Design Principles

These principles underpin every recommendation in this power:

1. **Implement a strong identity foundation** — Enforce least privilege and separation of duties with appropriate authorization. Centralize identity management and eliminate reliance on long-term static credentials.
2. **Maintain traceability** — Monitor, alert, and audit actions and changes in real time. Integrate logs and metrics with systems that automatically investigate and take action.
3. **Apply security at all layers** — Use defense in depth. Apply controls to the network edge, VPC, load balancing, every compute instance, operating system, application, and code.
4. **Automate security best practices** — Automated, software-based mechanisms improve your ability to securely scale rapidly and cost-effectively. Build security into templates and pipelines.
5. **Protect data in transit and at rest** — Classify data by sensitivity and use mechanisms such as encryption, tokenization, and access control where appropriate.
6. **Keep people away from data** — Reduce or eliminate direct access and manual processing of data to lower the risk of mishandling, modification, and human error.
7. **Prepare for security events** — Have an incident management and investigation process aligned to your requirements. Run simulations and use tooling with automation to increase detection, investigation, and recovery speed.

## The Seven Focus Areas

Security work is organized into seven focus areas, the same across every platform:

1. **Security foundations** — governance, account/resource structure, shared responsibility, org guardrails.
2. **Identity and access management** — human and machine identity, least privilege, federation, temporary credentials.
3. **Detection** — logging, monitoring, threat detection, and audit.
4. **Infrastructure protection** — network and compute defense in depth, edge protection.
5. **Data protection** — classification, encryption at rest and in transit, key and secrets management.
6. **Incident response** — preparation, investigation, forensics, and automated response.
7. **Application security** — secure SDLC, code/dependency scanning, secrets hygiene, pipeline security.

Each focus area has a dedicated steering file **per platform**, with concrete service recommendations and examples for that platform.

## Onboarding (First Use)

When this power is first used in a workspace and no `.neuralbridge/security-template.md` exists yet — or when the user
asks to "set up" or "configure security rules" — start the **getting-started** onboarding flow. NeuralBridge should:

1. Offer to set up the user's security rules (so they don't face a blank file).
2. Ask which **platform(s)** the project targets — AWS, GCP, Azure, or on-prem — so reviews pull the right
   guidance folder and service recommendations.
3. Present the pre-built **rule packs** (Baseline, Web Application, Data Privacy, PCI DSS, Infrastructure as
   Code) and merge the ones the user picks into `.neuralbridge/security-template.md`.
4. Invite additional custom rules in plain language.
5. Ask what else the user wants the daily review to explicitly track and log (the Watchlist).
6. Confirm log settings and recommend committing the template so the whole team shares one ruleset.

See the **getting-started** steering file for the full script.

## Available Steering Files

**Platform-agnostic workflows** (top level of `steering/`) — how Third Eye actually operates:

- **getting-started** — First-run onboarding: asks which platform(s) apply, captures the governed baseline source, offers pre-built rule packs, gathers custom rules, and sets up the daily report and watchlist.
- **baseline-rules** — Fetches the latest centrally-governed baseline from a remote source (URL/repo) at review time and applies the project's local, time-boxed exceptions/waivers.
- **manage-rules** — Add, edit, remove, or list project rules in plain language, and record local exceptions to baseline rules; NeuralBridge handles IDs, categories, and severities so no one edits markdown tables by hand.
- **custom-review** — Review application code against the effective ruleset (fetched baseline + local rules − waivers) and generate a structured findings report.
- **daily-review** — Summarize recent repo changes and rate each Red/Amber/Green against the effective ruleset, written to a dated audit report.

**Platform security guidance** — the seven focus areas, one folder per platform. Read the file for the platform in play (`aws/`, `gcp/`, `azure/`, `on-prem/`):

- `aws/` — AWS Well-Architected Security (Organizations/SCPs, IAM, CloudTrail/GuardDuty/Security Hub, VPC/WAF/Shield, KMS/Secrets Manager, incident response, supply-chain).
- `gcp/` — Google Cloud (Resource hierarchy/Org Policy, Cloud IAM/Workload Identity, Audit Logs/SCC/Chronicle, VPC/Cloud Armor, Cloud KMS/Secret Manager, Binary Authorization).
- `azure/` — Microsoft Azure (Management groups/Azure Policy, Entra ID/PIM/managed identities, Defender for Cloud/Sentinel, NSG/Azure Firewall/WAF, Key Vault, Defender for DevOps).
- `on-prem/` — Self-hosted / data center (CIS Controls & NIST CSF, AD/LDAP/PAM, SIEM/EDR, network segmentation/hardening, disk/DB encryption & vaults, forensics, secure SDLC).

Each folder contains: `security-foundations.md`, `identity-access-management.md`, `detection.md`, `infrastructure-protection.md`, `data-protection.md`, `incident-response.md`, `application-security.md`.

Call action "readSteering" with the relevant path (e.g., `aws/data-protection.md` or `azure/identity-access-management.md`) to load detailed guidance.

## Custom Security Review

Beyond the reference guidance, this power can actively **review your code against a governed baseline plus your
own rules**. Org-wide **baseline rules are governed centrally and fetched from the web** (a security team's
repo/URL) so every project reviews against the latest standard; a project adds its **own rules** and records
**local, time-boxed exceptions** to baseline rules. NeuralBridge reviews the codebase against this effective ruleset and
produces a findings report.

**To use it:**
1. Copy `templates/security-template.md` into your project as `.neuralbridge/security-template.md` (NeuralBridge will scaffold
   it for you automatically if it's missing).
2. Add your rules the easy way — just tell NeuralBridge **"add a rule: no public S3 buckets"** (or jot rough rules in
   the template's **Quick Add** box and say "process quick add"). NeuralBridge assigns the ID, category, and severity;
   you never edit the tables by hand. You can also "list our rules", "change SC-4 to a BLOCKER", or "remove SC-7".
   See the **manage-rules** steering file.
3. Ask NeuralBridge to "run a security review" — it reads the template, reviews in-scope code, and returns a
   status per constraint (PASS/FAIL/PARTIAL/NEEDS REVIEW) with cited evidence, remediation, and an overall verdict.

If no template exists, NeuralBridge will offer to scaffold one. See the **custom-review** steering file for the full workflow.

## Daily Reviewer Summary (Red / Amber / Green)

When a team ships code with NeuralBridge, change volume rises and manual review gets hard. This power gives a
**human reviewer** a daily summary of what changed in the repository, rated **🔴 Red / 🟠 Amber / 🟢 Green**
against the security template:

- 🔴 **Red** — a BLOCKER/HIGH constraint is violated; should not merge without action.
- 🟠 **Amber** — a minor violation, partial pass, or something that needs human review.
- 🟢 **Green** — no violations found in the change.

The power always reports the rating and calls out risky changes with cited evidence. The reviewer stays in
control — they may still accept (pass) an item — but nothing risky merges silently. **Every review is written
to a date-stamped report file in a `reports/` folder** (default: `reports/<ProjectName>_Review_MMDDYYYY.md`,
e.g., `reports/Payments_API_Review_07282026.md`) so there is a persistent audit trail of what was flagged and
what was accepted.

**To use it:** ask NeuralBridge to "run the daily security review." It reads `.neuralbridge/security-template.md`, inspects
repo changes in the configured window (default: last 24h), returns a RAG summary, and writes the dated log
file. It can also be wired to a one-click `userTriggered` hook. See the **daily-review** steering file for the
full workflow.

## How to Use This Power

**First, identify the platform** (AWS, GCP, Azure, or on-prem) so you read from the right steering folder.

**When reviewing an architecture or design:**
1. Start with the seven design principles as a lens.
2. Walk the focus areas most relevant to the workload (identity and data protection apply almost always).
3. Read the matching steering file for the platform (e.g., `gcp/identity-access-management.md`).
4. Flag gaps against least privilege, encryption, traceability, and blast-radius reduction.

**When writing infrastructure-as-code:**
1. Default to encryption enabled, public access blocked, and scoped identities.
2. Pull the relevant platform steering file (e.g., `azure/infrastructure-protection.md` for NSGs, `aws/data-protection.md` for S3/RDS).
3. Prefer automated guardrails (SCPs / Org Policy / Azure Policy / config management) over manual review.

**When answering a security question:**
1. Identify the platform and which focus area the question maps to.
2. Read that platform's steering file and give a principle-backed answer with a concrete, platform-specific recommendation.

## Quick-Reference Security Checklist (universal)

A fast, platform-neutral triage list. Deeper, platform-specific checks live in each focus-area steering file.

- [ ] Privileged/root/global-admin identities have MFA and are not used for daily work.
- [ ] Identity is centralized and federated; no shared or long-lived static credentials/keys.
- [ ] Permissions follow least privilege; broad wildcard/owner grants are justified.
- [ ] Audit logging is enabled, centralized, and tamper-resistant.
- [ ] Threat detection / posture monitoring is enabled across the environment.
- [ ] All data stores encrypt at rest; TLS 1.2+ enforced in transit.
- [ ] Public access to storage/data is blocked unless explicitly reviewed.
- [ ] Secrets live in a secrets manager/vault, never in code or plaintext config.
- [ ] Network follows defense in depth: private segments, least-open rules, WAF/edge protection.
- [ ] A documented, rehearsed incident response runbook exists with defined roles and access.
- [ ] Guardrails are automated (org policy / config rules / config management), not just documented.

## Best Practices for Applying This Power

- **Lead with principles, back with services.** Explain the "why" (design principle) then the "how" (the specific control on the relevant platform).
- **Match the platform.** Give AWS answers for AWS, GCP for GCP, etc. — don't recommend an AWS service for an Azure workload.
- **Default to secure.** When generating code or config, choose the secure option by default and call out any deviation.
- **Reduce blast radius.** Prefer smaller accounts/projects/subscriptions, scoped roles, and segmented networks.
- **Automate over document.** A guardrail that enforces a rule beats a wiki page describing it.
- **Never invent credentials or secrets.** Use placeholders and point to the platform's secrets manager/vault.

## References

- AWS Well-Architected — Security Pillar: https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html
- Google Cloud Architecture Framework — Security: https://cloud.google.com/architecture/framework/security
- Azure Well-Architected Framework — Security: https://learn.microsoft.com/azure/well-architected/security/
- CIS Controls: https://www.cisecurity.org/controls · NIST CSF: https://www.nist.gov/cyberframework

Content synthesized from public framework documentation (AWS, Google Cloud, Microsoft, CIS, NIST) and rephrased for compliance with licensing restrictions.

## License and support

**License:** MIT — see the [LICENSE](https://github.com/bharatlohra-byte/Third_Eye/blob/main/LICENSE) file in
the repository for full terms. This power is documentation and workflow guidance provided "as is", without
warranty of any kind.

**Support:**
- **Documentation:** [GUIDE.md](https://github.com/bharatlohra-byte/Third_Eye/blob/main/GUIDE.md) — full
  explanation of what this power does, how it works, and how to use it.
- **Issues and questions:** [open an issue](https://github.com/bharatlohra-byte/Third_Eye/issues) on the
  GitHub repository.
- **Repository:** https://github.com/bharatlohra-byte/Third_Eye
- **Maintainer:** Bharat Lohra, FDE @ Accenture

**Note:** Third Eye is advisory. It reviews code and infrastructure-as-code in your repository against your
configured rules and does not connect to live cloud accounts. Findings are recommendations for human review,
not a substitute for a formal security assessment or compliance audit.
