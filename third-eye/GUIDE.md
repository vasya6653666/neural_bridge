# Third Eye — Complete Guide

A full explanation of **what Third Eye does**, **how it works**, and **how to use it**.

---

## 1. What It Is

Third Eye is a NeuralBridge Power that acts as a **security watchdog for your codebase**. It gives NeuralBridge two things:

1. **Security knowledge** — well-architected security guidance for four platforms (AWS, GCP, Azure, on-prem),
   organized into seven focus areas each.
2. **A review engine** — workflows that check your code and infrastructure against *your own* security rules
   and produce a dated **Red / Amber / Green** report.

It is a **Knowledge Base Power**: pure documentation and workflows, with no MCP server and no cloud credentials.
It reviews your *code and IaC in the repo* — it does not connect to or scan a live cloud account.

---

## 2. What It Does

- **Reviews code against your rules.** You define design principles and security constraints once; Third Eye
  checks the codebase against them and reports pass/fail with cited evidence.
- **Produces a daily reviewer summary.** It looks at what changed in the repo (a delta, not a full scan) and
  rates each change 🔴 Red / 🟠 Amber / 🟢 Green so a human reviewer can keep up with AI-assisted change volume.
- **Keeps an audit trail.** Every daily review is written to a dated report file
  (`reports/<ProjectName>_Review_MMDDYYYY.md`) recording what was flagged and what a reviewer accepted anyway.
- **Answers security questions** with platform-specific, principle-backed guidance.
- **Onboards you fast** with ready-made rule packs so you never start from a blank page.

**The problem it solves:** when a team ships code quickly (especially with AI assistants), review volume grows
and security regressions slip through. Third Eye gives a reviewer a fast, rule-driven, logged picture of risk.

---

## 3. How It Works

### 3.1 The pieces

```
POWER.md                     # Metadata + overview + onboarding entry point
steering/
  getting-started.md         # First-run onboarding workflow
  manage-rules.md            # Add/edit/remove rules in plain language
  custom-review.md           # On-demand full review workflow
  daily-review.md            # Daily delta review + RAG report workflow
  aws/ gcp/ azure/ on-prem/  # 7 focus-area security guides per platform
templates/
  security-template.md       # The fillable ruleset you copy into your project
  rule-packs/                # Ready-made rule sets (Baseline, Web App, etc.)
```

- **POWER.md** is loaded when NeuralBridge detects relevant keywords (security review, cloud security, etc.). It tells
  NeuralBridge what the power is and which steering file to read for a given task.
- **Steering files** are loaded on demand. Workflow files drive behavior; platform folders provide the security
  baseline for the project's platform.
- **The template** (`.neuralbridge/security-template.md`, copied into *your* project) is the authoritative ruleset for
  your codebase. Your rules come first; the platform baseline fills any gaps.

### 3.2 The ruleset (security-template.md)

Lives in your project at `.neuralbridge/security-template.md`. It holds:
- **Project Context** — app name, platform(s), stack, data sensitivity, compliance targets.
- **Design Principles (DP-*)** — the guiding "why."
- **Security Constraints (SC-*)** — pass/fail rules, each with a severity (BLOCKER / HIGH / MEDIUM / LOW).
- **Scope** — include/exclude globs.
- **Output preferences, RAG rules, daily-report settings, and a watchlist.**

Because it lives in your repo, you commit it and the whole team reviews against the same rules.

### 3.3 The review logic

For each constraint, NeuralBridge inspects in-scope code/IaC and assigns a status:
- **PASS** — evidence it's satisfied.
- **FAIL** — a concrete violation (cited file:line).
- **PARTIAL** — satisfied in some places, not others.
- **NOT APPLICABLE** — doesn't apply here.
- **NEEDS REVIEW** — can't be determined automatically; flagged for a human.

Findings map to a traffic-light rating:
- 🔴 **Red** — a BLOCKER/HIGH constraint is violated.
- 🟠 **Amber** — a minor violation, a PARTIAL, or a NEEDS REVIEW.
- 🟢 **Green** — no violations found.

Two guarantees: **uncertainty is never hidden** (anything unverifiable is marked NEEDS REVIEW rather than
asserted as a pass), and waived rules are shown as **WAIVED**, not silently dropped.

### 3.3a Governed baseline + local exceptions

Baseline rules are usually owned by a **central security team** and live in a **separate repo/URL**. Third Eye
**fetches the latest baseline at review time** (see the `baseline-rules` workflow) so every project reviews
against the current org standard — not a stale local copy. Projects can't change the baseline; they can only:

- add their **own project rules** (in the local template), and
- record **local, time-boxed exceptions** (waivers) against specific baseline rules — scoped, approved, and with
  an expiry. Waivers appear in every report; expired waivers automatically re-enable the rule (fail-safe).

The **effective ruleset** for a review is: fetched governed baseline − valid local waivers + the project's own
rules. If the fetch fails, Third Eye falls back to an offline cache or the bundled starter packs and says so in
the report.

### 3.4 The daily report

The daily workflow: refresh git → find changes in the window (default last 24h) → review only those in-scope
changes against the template → rate each Red/Amber/Green → write the report. The report is always saved to
`reports/<ProjectName>_Review_MMDDYYYY.md` (created if missing; repeat runs append a timestamped section).

---

## 4. How to Use It

### 4.1 Install

Install the power from the **Powers** panel in NeuralBridge IDE.

### 4.2 Set up (first run)
Say **"set up my security rules"**. NeuralBridge will:
1. Ask which **platform(s)** you're on (AWS / GCP / Azure / on-prem).
2. Ask for your **governed baseline source** (a security team's URL/repo) to fetch the latest baseline from —
   or use the built-in baseline if you don't have one.
3. Offer **rule packs** (Baseline recommended, plus Web App / Data Privacy / PCI DSS / IaC as they apply) and
   merge your picks into `.neuralbridge/security-template.md`.
4. Let you add **custom rules** in plain language.
5. Ask what else to **track** in the daily report (the watchlist).
6. Confirm report settings and nudge you to commit the template.

You can also record baseline **exceptions** anytime:
`waive BL-12 for legacy/** until 2026-12-31 because <reason>, approved by <name>`.

### 4.3 Add or change rules (plain language)
- `add a rule: no public storage buckets`
- `change SC-4 to a BLOCKER`
- `remove SC-7`
- `list our rules`
- Or jot rough rules into the template's **Quick Add** box and say `process quick add`.

NeuralBridge assigns the ID, category, and severity — you never edit the markdown tables by hand.

### 4.4 Run a review
- **Full review:** `run a security review` → status per constraint, cited evidence, remediation, and an overall
  verdict.
- **Daily reviewer summary:** `run the daily security review` → Red/Amber/Green summary of recent changes,
  written to `reports/<ProjectName>_Review_MMDDYYYY.md`. Optionally wire a one-click `userTriggered` hook so a
  reviewer runs it each morning.

### 4.5 Ask questions
Ask things like "how should I store these credentials on GCP?" — NeuralBridge reads the matching platform steering file
and gives a principle-backed, platform-specific answer.

---

## 5. Example Session

```
You:  set up my security rules
NeuralBridge: Which platform — AWS, GCP, Azure, or on-prem?
You:  AWS, and we handle payment data
NeuralBridge: Added Baseline + PCI DSS packs to .neuralbridge/security-template.md. Anything custom?
You:  add a rule: no public S3 buckets
NeuralBridge: Added SC-11 (Data Protection, BLOCKER). Commit the template so your team shares it.
...
You:  run the daily security review
NeuralBridge: Overall 🔴 1 Red · 🟠 2 Amber · 🟢 5 Green. Wrote reports/Payments_API_Review_07282026.md
      🔴 infra/iam.tf:42 — wildcard IAM policy (SC-1, BLOCKER)
      🟠 src/api/orders.ts:88 — input not validated on new endpoint (SC-8)
```

---

## 6. FAQ

- **Does it need cloud credentials?** No. It reviews code/IaC in the repo, not a live account.
- **Where do rules live?** Baseline rules are governed centrally and fetched from a remote source (your security
  team's repo/URL). Your project's own rules and local exceptions live in `.neuralbridge/security-template.md` — commit
  it to share with the team.
- **Can a project change the baseline?** No — it's read-only for projects. A project can only add its own rules
  and record local, time-boxed, approved exceptions (waivers), which are shown in every report and auto-expire.
- **Can a reviewer still accept a risky change?** Yes — the rating is advisory, but the risk is recorded in the
  dated report, so nothing merges silently.
- **Multiple platforms in one repo?** Yes — list them in Project Context; Third Eye pulls guidance from each.
- **Does it change my code automatically?** No. It reports findings; it only edits code if you ask it to fix them.

---

## 7. Design Principles Behind Third Eye

- **User rules first, baseline second.**
- **Every finding is actionable** (cited location + remediation).
- **No false confidence** (uncertainty → NEEDS REVIEW).
- **Reviewer stays in control** (advises and records; the human decides).
- **Plain language throughout** (describe rules; NeuralBridge formats them).
