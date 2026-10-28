# Baseline Rules (governed externally, exceptions controlled locally)

Baseline security rules are usually owned by a **central security team** and live in a **separate repo or URL**,
not in each project. Third Eye fetches the **latest** governed baseline at review time so every project reviews
against the current org standard. Individual projects cannot change the baseline — they can only record
**local, time-boxed exceptions** (waivers) that are shown in the audit trail.

This gives two clean layers:
- **Governed baseline** — remote, centrally owned, fetched fresh. The source of truth for org-wide rules.
- **Local template** — project-specific rules *plus* approved exceptions to baseline rules.

## When to Use

Run this as **Step 0 of any review** (custom-review or daily-review), before evaluating code:
1. Fetch the governed baseline.
2. Apply the project's local exceptions.
3. Combine with the project's own rules.

## Step 1: Read the Baseline Source

From the template's **Baseline Rules Source** section, read:
- `baseline_source` — a URL to a rules file (raw Markdown/JSON/YAML) **or** a git repo (+ path/branch).
- Optional per-platform sources (e.g., a different file for AWS vs Azure).
- `offline_cache` — a local path used only if the fetch fails.

If no source is configured, fall back to the bundled starter packs in `templates/rule-packs/` and note in the
report that the governed baseline was not configured.

## Step 2: Fetch the Latest Baseline

- **URL source:** fetch it (web fetch / `curl`). Prefer a raw, versioned URL.
- **Git source:** shallow-clone or pull the configured repo/branch and read the rules file(s):
  ```bash
  git clone --depth 1 --branch <branch> <repo-url> .third-eye-baseline 2>/dev/null \
    || git -C .third-eye-baseline pull --quiet
  ```
  (Use a temp/ignored directory; never commit the fetched baseline into the project.)
- **On success:** parse the rules (same structure as the local template — DP-*/SC-* with severities) and record
  the baseline **version/commit and fetch timestamp** for the report.
- **On failure (offline/unreachable):** use `offline_cache` if present, else the bundled starter packs. **Clearly
  flag in the report** that a cached/fallback baseline was used and which version, so reviewers know it may be stale.

Never silently proceed as if the baseline is current when the fetch failed.

## Step 3: Apply Local Exceptions

Read the template's **Exceptions / Waivers** section. Each exception references a baseline rule ID and has a
scope, reason, approver, and expiry. For each exception:
- **If not expired and in scope:** mark that baseline rule as **WAIVED** for the matching files. A waived rule
  is reported as `WAIVED` (not PASS, not FAIL), with the reason, approver, and expiry — it is visible, not hidden.
- **If expired:** ignore the exception (the baseline rule is enforced again) and **flag the expired waiver** in
  the report so the team renews or fixes it.
- **If it references a baseline rule ID that no longer exists:** flag it as stale.

Exceptions only ever **relax** baseline rules locally; they can never add or weaken rules for other projects.

## Step 4: Combine and Hand Off to the Review

Produce the effective ruleset for this review:
1. **Governed baseline** (fetched), minus rules waived by valid local exceptions (shown as WAIVED).
2. **Project rules** from the local template (DP-*/SC-*) — these are additive and authoritative for the project.
3. On any ID conflict, the local project rule and the governed baseline are both reported; never silently drop one.

Hand this effective ruleset to the custom-review / daily-review evaluation steps.

## Reporting Requirements

Every report (full or daily) must state, near the top:
- **Baseline source** and **version/commit + fetch time** (or "cached/fallback — possibly stale" if the fetch failed).
- A short **Exceptions** summary: active waivers (with expiry) and any expired/stale waivers that need attention.

This keeps the audit trail honest: reviewers can see exactly which baseline was applied and what was waived.

## Principles

- **Baseline is remote and read-only for projects.** Central teams govern it; projects consume the latest.
- **Always fetch fresh; fall back loudly.** Never treat a stale cache as current without saying so.
- **Exceptions are local, scoped, time-boxed, and visible.** Waivers are recorded and expire; they never hide risk.
- **Expired waivers re-enable the rule.** Security fails safe.
