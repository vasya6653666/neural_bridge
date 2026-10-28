#!/usr/bin/env node
// (c) JFrog Ltd. (2026)
// Additive install of the JFrog skills and the JFrog MCP entry for NeuralBridge (IDE and neuralbridge-cli).
// Copies the JFrog skills into ~/.neuralbridge/skills/ so they are available as slash commands
// (`/jfrog`, `/jfrog-init`, …) in every NeuralBridge chat, and adds the `jfrog` server to the
// NeuralBridge user MCP config ~/.neuralbridge/settings/mcp.json (never overwriting an existing entry).
//
// Run from the installed power folder or any checkout of it:
//   node scripts/install-neuralbridge.mjs               # skills + MCP -> ~/.neuralbridge (global)
//   node scripts/install-neuralbridge.mjs --workspace   # skills + MCP -> ./.neuralbridge
//
// Options / env:
//   --workspace                  install into ./.neuralbridge instead of ~/.neuralbridge
//   NEURALBRIDGE_HOME=<dir>      custom NeuralBridge home instead of ~/.neuralbridge (ignored with --workspace)
//   JFROG_POWER_SRC=<dir>        install from a specific power folder instead of this one (offline/testing)
//   JFROG_PLATFORM_URL=<host>    JFrog Platform hostname; without it the MCP entry keeps the
//                                `${JFROG_PLATFORM_URL}` placeholder that /jfrog-init fills in later
import { promises as fs, realpathSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

// The url the power's own mcp.json ships with; /jfrog-init substitutes the real host from `jf config`.
export const PLACEHOLDER_MCP_URL = 'https://${JFROG_PLATFORM_URL}/mcp';

// Expand a leading `~` (env vars are not shell-expanded) and resolve to an absolute path.
export function expandHome(p, home = os.homedir()) {
  if (p === '~') return home;
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(home, p.slice(2));
  return path.resolve(p);
}

// Workspace scope always wins (explicit --workspace on the command line). Otherwise NEURALBRIDGE_HOME
// wins over the default ~/.neuralbridge.
export function resolveNeuralBridgeDest({ workspace, cwd = process.cwd(), env = process.env, home = os.homedir() }) {
  if (workspace) return path.join(cwd, '.neuralbridge');
  if (env.NEURALBRIDGE_HOME) return expandHome(env.NEURALBRIDGE_HOME, home);
  return path.join(home, '.neuralbridge');
}

// Copy every skill dir under skillsSrc into <dest>/skills (replacing each dir). Idempotent: a re-run
// yields identical files. Returns the skill names it wrote.
export async function installAdditive({ skillsSrc, dest }) {
  const skillsDest = path.join(dest, 'skills');
  const skills = (await fs.readdir(skillsSrc, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  if (skills.length === 0) throw new Error(`no skills found in ${skillsSrc}`);
  await fs.mkdir(skillsDest, { recursive: true });
  for (const name of skills) {
    const to = path.join(skillsDest, name);
    await fs.rm(to, { recursive: true, force: true });
    await fs.cp(path.join(skillsSrc, name), to, { recursive: true });
  }
  return { skills, skillsDest };
}

// Resolve the skills source directory: JFROG_POWER_SRC env override, or skills/ next to this script.
function resolveSkillsSrc(env = process.env) {
  if (env.JFROG_POWER_SRC) {
    console.log(`Using local source: ${env.JFROG_POWER_SRC}`);
    return path.join(env.JFROG_POWER_SRC, 'skills');
  }
  return path.join(repoRoot, 'skills');
}

// Only a bare host[:port] is accepted — no path, no userinfo, no shell metacharacters.
// bootstrap.sh applies the identical rule so both installers write the same MCP url.
const HOST_RE = /^[A-Za-z0-9.-]+(?::\d{1,5})?$/;

// Resolve JFROG_PLATFORM_URL into a full MCP url, or null if it isn't a valid bare host[:port]. Keeps
// an explicit http:// scheme (defaults to https otherwise) instead of always forcing https.
export function resolvePlatformUrl(rawUrl) {
  const match = /^(https?):\/\//i.exec(rawUrl);
  const scheme = match ? match[1].toLowerCase() : 'https';
  const host = rawUrl.slice(match ? match[0].length : 0).replace(/\/+$/, '');
  return HOST_RE.test(host) ? `${scheme}://${host}/mcp` : null;
}

// Write `content` to `file` atomically (temp file + rename), keeping an existing file's mode.
async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const real = await fs.realpath(file).catch(() => file);
  const mode = await fs.stat(real).then((s) => s.mode & 0o777).catch(() => 0o600);
  const tmp = `${real}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, content, { flag: 'wx', mode });
    await fs.rename(tmp, real);
  } finally {
    await fs.rm(tmp, { force: true });
  }
}

// Add `mcpServers.jfrog` to <dest>/settings/mcp.json (the NeuralBridge MCP config for that scope).
// Additive only: other servers are kept, an existing `jfrog` entry is left untouched, and a file
// that is not a JSON object is refused rather than rewritten. Returns one of:
//   'added'                — entry written with the resolved platform url
//   'added-placeholder'    — entry written with the ${JFROG_PLATFORM_URL} placeholder
//   'skipped'              — a jfrog entry already exists
//   'invalid-platform-url' — JFROG_PLATFORM_URL is set but is not a bare host[:port]; nothing written
//   'invalid-config'       — the existing file is not a usable JSON object; nothing written
export async function provisionMcp({ dest, env = process.env }) {
  const file = path.join(dest, 'settings', 'mcp.json');
  let url = PLACEHOLDER_MCP_URL;
  if (env.JFROG_PLATFORM_URL) {
    url = resolvePlatformUrl(env.JFROG_PLATFORM_URL);
    if (!url) return { status: 'invalid-platform-url', file };
  }
  const raw = await fs.readFile(file, 'utf8').catch((err) => {
    if (err.code === 'ENOENT') return null;
    throw err;
  });
  let config = {};
  if (raw !== null && raw.trim() !== '') {
    try {
      config = JSON.parse(raw);
    } catch {
      return { status: 'invalid-config', file };
    }
    if (config === null || typeof config !== 'object' || Array.isArray(config)) return { status: 'invalid-config', file };
  }
  if (config.mcpServers === undefined || config.mcpServers === null) config.mcpServers = {};
  if (typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers)) return { status: 'invalid-config', file };
  if (Object.hasOwn(config.mcpServers, 'jfrog')) return { status: 'skipped', file };
  config.mcpServers.jfrog = { url };
  await atomicWrite(file, JSON.stringify(config, null, 2) + '\n');
  return { status: url === PLACEHOLDER_MCP_URL ? 'added-placeholder' : 'added', file, url };
}

async function main() {
  const workspace = process.argv.slice(2).includes('--workspace');
  const dest = resolveNeuralBridgeDest({ workspace });
  const skillsSrc = resolveSkillsSrc();
  const stat = await fs.stat(skillsSrc).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`skills/ missing in source (${skillsSrc})`);
  }
  console.log(`Installing skills -> ${path.join(dest, 'skills')}`);
  const { skills } = await installAdditive({ skillsSrc, dest });
  for (const name of skills) console.log(`  skill     ${name} -> ${path.join(dest, 'skills', name)}`);

  const mcp = await provisionMcp({ dest });
  if (mcp.status === 'added') {
    console.log(`  mcp       jfrog -> ${mcp.url} (OAuth) in ${mcp.file}`);
  } else if (mcp.status === 'added-placeholder') {
    console.log(`  mcp       jfrog -> ${mcp.url} in ${mcp.file} — run /jfrog-init to fill in your platform host`);
  } else if (mcp.status === 'skipped') {
    console.log(`  mcp       jfrog skipped — entry already exists in ${mcp.file}, leaving it untouched`);
  } else if (mcp.status === 'invalid-platform-url') {
    console.log(`  mcp       jfrog skipped — JFROG_PLATFORM_URL ("${process.env.JFROG_PLATFORM_URL}") is not a valid host; set it to just the platform hostname (e.g. my.jfrog.io) and re-run`);
  } else {
    console.log(`  mcp       jfrog skipped — ${mcp.file} is not a JSON object with an "mcpServers" object; fix the file, then re-run`);
  }
  console.log('\ndone. Reload the NeuralBridge window, then ask a JFrog question or run /jfrog-init.');
}

// Only run main() when executed directly (not when imported by tests). realpathSync resolves symlinks.
if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  await main();
}
