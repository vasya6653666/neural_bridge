# Contributing

Thanks for your interest in contributing to the **JFrog power for NeuralBridge**.

## Before you contribute

### 1) Sign the JFrog Contributor License Agreement (CLA)

All contributions require a signed CLA.

- JFrog CLA: https://jfrog.com/cla/

Our GitHub checks will guide you through the signing process on your first pull request.

## How to contribute

### Reporting issues

- Use GitHub Issues to report bugs or request enhancements.
- Include clear reproduction steps, expected vs actual behavior, and any relevant logs or screenshots.

### Submitting pull requests

1. Fork the repo and create a feature branch.
2. Make your change with a clear, focused scope.
3. Update documentation as needed (README/POWER docs).
4. Open a pull request with:
   - What changed and why
   - How you tested (or why no test applies)

## Testing local changes

The power ships JFrog knowledge as `steering/` files, **generated from the embedded `skills/` tree**. Two
things to know before testing.

### Local folder import ≠ catalog install

NeuralBridge adds a power in two ways, and they are not equivalent:

- **Local folder import** (Powers → Add Custom Power → *Import from a folder*): NeuralBridge references the power
  **in place** from your path. It does **not** copy files into `~/.neuralbridge/powers/installed/`, so the
  `neuralbridge_powers` activation tool fails with "Power not installed" — this is **expected** for local imports,
  not a bug. Use this mode for **fast iteration**.
- **Catalog install** (Powers → Available → JFrog): NeuralBridge **copies** the power folder into
  `~/.neuralbridge/powers/installed/jfrog/`, and activation works. Use this for **production-style testing**.

### Iterating on steering without a full install

1. Add the power via *Import from a folder* pointed at your checkout.
2. In a NeuralBridge chat, load the steering manually: `#jfrog` (foundational) or `#jfrog-references` (deep
   API/AQL). This uses the exact content the power ships.
3. Edit `steering/` (or the generators — see below), reload NeuralBridge, and re-test with `#jfrog`.
4. Before opening a PR, do a **catalog install** of your branch to confirm activation works end-to-end.

Optional local dev workaround to make `neuralbridge_powers` activation work without a catalog install — stage
the installed dir to mirror one:

```bash
mkdir -p ~/.neuralbridge/powers/installed/jfrog
cp POWER.md mcp.json ~/.neuralbridge/powers/installed/jfrog/
rm -rf ~/.neuralbridge/powers/installed/jfrog/steering && cp -R steering ~/.neuralbridge/powers/installed/jfrog/
# then fully quit & reopen NeuralBridge
```

### Changing skills or steering

- **`skills/` is vendored** from [`jfrog/jfrog-skills`](https://github.com/jfrog/jfrog-skills) at a pinned
  tag. To pick up new upstream content, bump the pin (see [VENDOR.md](./VENDOR.md)).
- **Do not hand-edit `steering/`** — it is generated. Run `npm run gen-steering` and commit the result.
- After any pin bump: `npm run sync-skills`, then
  `npm run gen-steering`, and commit both `skills/` and `steering/`.
- Before pushing: `npm test` and `npm run validate` must pass; `npm run verify-install` checks your
  local `jf` CLI + server prerequisites.

## Releasing

Every merge to `main` releases, so **every** PR to `main` must bump `.version` in
[`package.json`](package.json) — including docs- and CI-only changes. That manifest is the only
place the version lives.

Every push to `main` compares the version against the latest release tag: if the version is newer,
a release proceeds; if it matches the latest tag, the workflow fails with a clear "already released"
error; if it is older, it fails with a revert warning.

A merge without a bump therefore turns `Release` red. That is by design, not a bug to work around:
the bump is reviewed in the PR that makes it, and failing loudly beats silently skipping a release
or re-tagging a shipped version. The PR that introduced this flow bumps past the newest release tag
for the same reason — so its first run on `main` publishes a real release instead of tripping the
"already released" guard.

The same applies to any long-lived branch: a version that was still unreleased when the branch was
opened may have shipped since. Merge `main` in and re-bump above the latest `vX.Y.Z` tag before
merging, or Release fails with "already released".

The release workflow runs the full test and validate suite plus the steering and vendoring drift
checks, and publishes a GitHub Release (creating the `vX.Y.Z` tag atomically via
`gh release create --target`, so a failed run can't leave a tag behind with no release attached to
it). The rollback step that deletes a partially published release only runs when the version gate
itself passed: a gate failure means the version was already released by an earlier run, and
deleting that release would destroy something already shipped.

## Security issues

If you discover a security vulnerability, please do **not** open a public issue.
Follow [JFrog’s responsible disclosure process](https://jfrog.com/trust/report-vulnerability/) (or contact your JFrog security point-of-contact).

## License

By contributing, you agree that your contributions will be licensed under the project license (Apache-2.0).
