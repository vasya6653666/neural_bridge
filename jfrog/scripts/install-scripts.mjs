#!/usr/bin/env node
// (c) JFrog Ltd. (2026)
// ON-DEMAND, scripts-only — install ONLY the JFrog skills' runnable helper scripts (login /
// environment-check) into ~/.neuralbridge/jfrog-scripts/ (or ./.neuralbridge/jfrog-scripts with
// --workspace, or $NEURALBRIDGE_HOME/jfrog-scripts when NEURALBRIDGE_HOME is set).
//
// WHY scripts-only: the JFrog knowledge already ships as steering bundled in the power, so the ONLY
// thing a user can be missing is the runnable helper scripts. We deliberately do NOT install SKILL.md
// (that would register a second `jfrog` skill and duplicate the steering in context) and do NOT
// install references/ (they ship as the #<name>-references steering). The shipped steering points the
// agent at ~/.neuralbridge/jfrog-scripts/<skill>/<script>.
//
//   node scripts/install-scripts.mjs             # -> ~/.neuralbridge/jfrog-scripts   (global, recommended)
//   node scripts/install-scripts.mjs --workspace # -> ./.neuralbridge/jfrog-scripts
//
// SOURCE: the bundled skills tree of this power (skills/<skill>/scripts), the same pinned version the
// steering was generated from — no network access. JFROG_POWER_SRC=<dir> installs from another power
// folder instead. Idempotent: re-running replaces each skill's scripts dir.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

// Copy each skill's scripts/ directory from a skills tree into <dest>/<skill>/.
// Writes ONLY scripts — never SKILL.md or references. Idempotent (replaces each dir). Returns the
// skill names whose scripts were installed.
export async function installScripts({ srcSkillsDir, dest }) {
  const skills = (await fs.readdir(srcSkillsDir, { withFileTypes: true }).catch(() => []))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const installed = [];
  await fs.mkdir(dest, { recursive: true });
  for (const name of skills) {
    const scriptsDir = path.join(srcSkillsDir, name, 'scripts');
    const entries = await fs.readdir(scriptsDir).catch(() => []);
    if (entries.length === 0) continue; // this skill has no scripts
    const to = path.join(dest, name);
    await fs.rm(to, { recursive: true, force: true });
    await fs.cp(scriptsDir, to, { recursive: true });
    installed.push(name);
  }
  return installed;
}

// Where the scripts go: ./.neuralbridge/jfrog-scripts with --workspace, else
// $NEURALBRIDGE_HOME/jfrog-scripts, else ~/.neuralbridge/jfrog-scripts.
export function resolveScriptsDest({ workspace, cwd = process.cwd(), env = process.env, home = os.homedir() }) {
  if (workspace) return path.join(cwd, '.neuralbridge', 'jfrog-scripts');
  if (env.NEURALBRIDGE_HOME) {
    const h = env.NEURALBRIDGE_HOME;
    const base = h === '~' ? home : h.startsWith('~/') || h.startsWith('~\\') ? path.join(home, h.slice(2)) : path.resolve(h);
    return path.join(base, 'jfrog-scripts');
  }
  return path.join(home, '.neuralbridge', 'jfrog-scripts');
}

async function main() {
  const workspace = process.argv.includes('--workspace');
  const dest = resolveScriptsDest({ workspace });
  const srcRoot = process.env.JFROG_POWER_SRC ? path.resolve(process.env.JFROG_POWER_SRC) : repoRoot;
  const srcSkillsDir = path.join(srcRoot, 'skills');
  console.log(`Installing JFrog helper scripts from ${srcSkillsDir} …`);
  const installed = await installScripts({ srcSkillsDir, dest });
  if (installed.length === 0) throw new Error(`no skill scripts found in ${srcSkillsDir}`);
  for (const name of installed) console.log(`  scripts  ${name} -> ${path.join(dest, name)}`);
  console.log(`done. JFrog helper scripts installed into ${dest}`);
}

// Only run when executed directly (not when imported by tests). Fail GRACEFULLY: print a calm,
// actionable note and set a non-zero exit code — no stack trace. Re-running retries.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(
      `\nCould not install JFrog helper scripts: ${err.message}\n` +
        'This step is optional — the JFrog steering still works without the scripts. ' +
        'Re-run `npm run install-scripts` from the power folder, or the next time a script is needed.'
    );
    process.exitCode = 1;
  });
}
