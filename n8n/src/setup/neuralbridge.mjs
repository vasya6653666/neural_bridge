// Detects the locally installed NeuralBridge IDE and builds its native MCP entry.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { promisify, stripVTControlCharacters } from 'node:util';
import { fail } from './errors.mjs';
import { SCOPES } from './discovery.mjs';

// NeuralBridge IDE versions with a recorded live acceptance of this helper. None yet: every
// detected version warns and setup continues (see docs/release-checklist.md).
export const TESTED_NEURALBRIDGE_VERSIONS = [];

// The `applicationName` NeuralBridge IDE writes into its product.json.
const APPLICATION_NAME = 'neuralbridge';

// Where a NeuralBridge IDE installation keeps its product.json, per platform. Windows and macOS
// are probed under both the short and the long product name; Linux relies on `neuralbridge` in PATH.
export function productJsonCandidates(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    const base = env.LOCALAPPDATA ? path.win32.join(env.LOCALAPPDATA, 'Programs') : undefined;
    return base ? ['NeuralBridge', 'NeuralBridge IDE'].map(dir => path.win32.join(base, dir, 'resources', 'app', 'product.json')) : [];
  }
  if (platform === 'darwin') {
    return ['NeuralBridge.app', 'NeuralBridge IDE.app'].map(app => path.posix.join('/Applications', app, 'Contents', 'Resources', 'app', 'product.json'));
  }
  return [];
}

export async function detectNeuralBridgeVersion({ platform = process.platform, env = process.env, read = readFile, exec = promisify(execFile) } = {}) {
  for (const file of productJsonCandidates(platform, env)) {
    try {
      const product = JSON.parse(await read(file, 'utf8'));
      if (product.applicationName === APPLICATION_NAME && typeof product.version === 'string') return product.version;
    } catch { /* Try the next location, then the application in PATH. */ }
  }
  try {
    const { stdout } = await exec(APPLICATION_NAME, ['--version'], { timeout: 10000, maxBuffer: 4096, windowsHide: true });
    return stdout.match(/^\d+\.\d+\.\d+$/m)?.[0];
  } catch { return undefined; }
}

export function neuralbridgeVersionWarnings(version, tested = TESTED_NEURALBRIDGE_VERSIONS) {
  if (tested.includes(version)) return [];
  // Strip escape sequences and remaining controls before displaying detected text.
  const displayVersion = typeof version === 'string' ? stripVTControlCharacters(version).replace(/[\u0000-\u001f\u007f-\u009f]/g, '') : '';
  const detected = displayVersion ? `NeuralBridge IDE ${displayVersion} has not been tested with this helper.` : 'The NeuralBridge IDE version could not be detected.';
  const list = tested.length ? tested.join(', ') : 'none yet';
  return [`Warning: ${detected} Tested versions: ${list}. Setup will continue. Authenticate in NeuralBridge and verify a read-only workflow search.`];
}

export async function availablePort(port = 0) {
  if (!Number.isInteger(port) || (port !== 0 && (port < 1024 || port > 65535))) {
    fail('CALLBACK_PORT', 'Choose a callback port between 1024 and 65535.');
  }
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(Object.assign(new Error('Callback port is unavailable. Choose another --callback-port.'), { code: 'CALLBACK_PORT' })));
    server.listen(port, 'localhost', () => {
      const selected = server.address().port;
      server.close(error => error ? reject(error) : resolve(selected));
    });
  });
}

export function callbackUri(port) { return `http://localhost:${port}/oauth/callback`; }

export function connectionConfig(endpoint, clientId, port) {
  return {
    url: endpoint, timeout: 300000,
    // NeuralBridge keys stored OAuth credentials by URL + headers, ignoring oauth.clientId.
    // A public identifier isolates grants after repair and from other clients.
    headers: { 'X-N8N-NeuralBridge-Connection': createHash('sha256').update(clientId).digest('hex') },
    oauth: { clientId, redirectUri: `localhost:${port}` },
    // Requested scopes; the consent screen remains authoritative.
    oauthScopes: SCOPES,
  };
}
