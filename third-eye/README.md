<img src="icon-512.png" alt="Third Eye" width="128" align="right" />

# Third Eye

A security watchdog for your codebase — a NeuralBridge Power covering **AWS, GCP, Azure, and on-premises**, grounded in
each platform's well-architected security guidance (AWS Well-Architected, Google Cloud Architecture Framework,
Azure Well-Architected) and industry baselines (CIS Controls, NIST CSF).

Third Eye reviews application code and infrastructure against your own custom rules (layered on the baseline for
your platform) and produces a **daily Red / Amber / Green review log**, so a human reviewer can keep up even
when a team ships fast with NeuralBridge. Nothing risky merges unnoticed — and if a reviewer accepts a risk anyway, it's
recorded.

## What's Inside

- **Security guidance** across seven focus areas (foundations, identity, detection, infrastructure, data
  protection, incident response, application security) for **each platform** — AWS, GCP, Azure, and on-prem.
- **Custom rules** — define your own design principles and security constraints in plain language.
- **Daily reviewer summary** — a delta review of recent repo changes, rated Red/Amber/Green, written to a
  date-stamped audit log.
- **Rule packs** — ready-made rule sets (Baseline, Web App, Data Privacy, PCI DSS, Infrastructure as Code).
- **Guided onboarding** — NeuralBridge walks you through setup on first use.

## Installation

### From this repository
1. Open the NeuralBridge Powers panel.
2. Click **Add Custom Power** → **Git Repository**.
3. Enter this repository's URL and install.

### From a local copy
1. Clone or download this repository.
2. Open the NeuralBridge Powers panel → **Add Custom Power** → **Local Directory**.
3. Point it at the repository folder (the one containing `POWER.md`).

## Full Guide

See **[GUIDE.md](GUIDE.md)** for a complete explanation of what Third Eye does, how it works, and how to use it.

## Getting Started

After installing, in a project workspace just say:

- "set up my security rules" — NeuralBridge offers rule packs and scaffolds `.neuralbridge/security-template.md`.
- "add a rule: no public S3 buckets" — add rules in plain language.
- "run the daily security review" — get a Red/Amber/Green summary and a dated log.

## Structure

```
POWER.md                  # metadata + overview + onboarding
steering/
  getting-started.md      # onboarding workflow
  manage-rules.md         # add/edit rules in plain language
  custom-review.md        # on-demand review workflow
  daily-review.md         # daily Red/Amber/Green log workflow
  aws/                    # AWS security guidance (7 focus areas)
  gcp/                    # GCP security guidance (7 focus areas)
  azure/                  # Azure security guidance (7 focus areas)
  on-prem/                # on-prem security guidance (7 focus areas)
templates/
  security-template.md    # the fillable ruleset users copy into their project
  rule-packs/             # ready-made rule sets
```

## Author

Bharat Lohra, FDE @ Accenture
