import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, stat, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runSetup } from '../../src/setup/setup.mjs';
import { neuralbridgeVersionWarnings, detectNeuralBridgeVersion, productJsonCandidates, TESTED_NEURALBRIDGE_VERSIONS } from '../../src/setup/neuralbridge.mjs';
import { atomicWrite, parseConfig, readSnapshot, withLock } from '../../src/setup/storage.mjs';
import { fixture } from './helpers.mjs';
import { createServer } from 'node:net';

test('configure, reuse, diagnose and remove; unrelated JSONC and credentials survive', async t => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.configPath), { recursive: true });
  await writeFile(f.configPath, '{\n // Keep this comment\n "other": 17,\n "mcpServers": {"existing": {"headers": {"Authorization": "SECRET"}},},\n}\n');
  const first = await runSetup(f.options, f.deps);
  assert.equal(first.status, 'configured_awaiting_authorization');
  assert.equal(f.count(), 1);
  const text = await readFile(f.configPath, 'utf8');
  assert.ok(text.includes('// Keep this comment'));
  const config = parseConfig(text);
  assert.equal(config.mcpServers.existing.headers.Authorization, 'SECRET');
  assert.equal(config.other, 17);
  assert.equal(config.mcpServers['n8n-test'].oauth.clientId, 'test-client-1');
  assert.equal(config.mcpServers['n8n-test'].oauth.clientSecret, undefined);
  assert.match(config.mcpServers['n8n-test'].headers['X-N8N-NeuralBridge-Connection'], /^[a-f0-9]{64}$/);
  assert.equal(config.mcpServers['n8n-test'].headers.Authorization, undefined);
  if (process.platform !== 'win32') assert.equal((await stat(f.configPath)).mode & 0o777, 0o600);
  const stateText = await readFile(f.statePath, 'utf8');
  const before = await readdir(path.dirname(f.configPath));
  assert.equal((await runSetup(f.options, f.deps)).changed, false);
  assert.equal(await readFile(f.configPath, 'utf8'), text);
  assert.equal(await readFile(f.statePath, 'utf8'), stateText);
  assert.deepEqual(await readdir(path.dirname(f.configPath)), before);
  assert.equal(f.count(), 1);
  const doctor = await runSetup({ ...f.options, command: 'doctor' }, f.deps);
  assert.equal(doctor.status, 'configured_unverified');
  assert.ok(!JSON.stringify([first, doctor]).includes('SECRET'));
  const removed = await runSetup({ ...f.options, command: 'remove' }, f.deps);
  assert.equal(removed.status, 'removed');
  assert.match(removed.next, /does not revoke/);
  assert.deepEqual(parseConfig(await readFile(f.configPath, 'utf8')), { other: 17, mcpServers: { existing: { headers: { Authorization: 'SECRET' } } } });
});

test('dry-run and doctor write no state, locks or settings and never register', async t => {
  const f = await fixture(t);
  assert.equal((await runSetup({ ...f.options, dryRun: true }, f.deps)).status, 'dry_run');
  assert.equal((await runSetup({ ...f.options, command: 'doctor' }, f.deps)).status, 'setup_required');
  assert.deepEqual(await readdir(f.root), []);
  assert.equal(f.count(), 0);
});

test('unmanaged name collision and malformed JSON stop before registration', async t => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.configPath), { recursive: true });
  for (const [text, code] of [
    ['{"mcpServers":{"n8n-test":{"url":"https://other.example"}}}', 'CONFIG_CONFLICT'],
    ['{"mcpServers": []}', 'INVALID_CONFIG'], ['{"bad":', 'INVALID_CONFIG'],
    ['{"mcpServers":{},"mcpServers":{}}', 'INVALID_CONFIG'],
  ]) {
    await writeFile(f.configPath, text);
    await assert.rejects(runSetup(f.options, f.deps), { code });
    assert.equal(await readFile(f.configPath, 'utf8'), text);
  }
  assert.equal(f.count(), 0);
});

test('custom names inherited from Object.prototype are ordinary server entries', async t => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.configPath), { recursive: true });
  await writeFile(f.configPath, '{"mcpServers":{}}');
  for (const name of ['toString', 'hasOwnProperty']) {
    const options = { ...f.options, name };
    await runSetup(options, f.deps);
    assert.equal((await runSetup(options, f.deps)).registration, 'reused');
    assert.ok(Object.hasOwn(parseConfig(await readFile(f.configPath, 'utf8')).mcpServers, name));
    assert.equal((await runSetup({ ...options, command: 'remove' }, f.deps)).status, 'removed');
  }
  assert.equal(f.count(), 2);
});

test('user changes to a managed entry are preserved by configure, repair and remove', async t => {
  const f = await fixture(t);
  await runSetup(f.options, f.deps);
  const config = parseConfig(await readFile(f.configPath, 'utf8'));
  config.mcpServers['n8n-test'].disabled = true;
  const text = JSON.stringify(config);
  await writeFile(f.configPath, text);
  for (const command of ['configure', 'repair', 'remove']) {
    await assert.rejects(runSetup({ ...f.options, command, ...(command === 'repair' ? { newRegistration: true } : {}) }, f.deps), { code: 'CONFIG_CONFLICT' });
    assert.equal(await readFile(f.configPath, 'utf8'), text);
  }
  assert.equal(f.count(), 1);
});

test('workspace override is detected before a user-level registration', async t => {
  const f = await fixture(t);
  const workspace = path.join(f.root, 'workspace with spaces ü');
  const file = path.join(workspace, '.neuralbridge/settings/mcp.json');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, '{"mcpServers":{"n8n-test":{"disabled":true}}}');
  await assert.rejects(runSetup({ ...f.options, workspace }, f.deps), { code: 'WORKSPACE_OVERRIDE' });
  assert.equal(f.count(), 0);
});

test('workspace scope writes only the selected workspace config', async t => {
  const f = await fixture(t);
  const workspace = path.join(f.root, 'workspace with spaces ü');
  await mkdir(workspace);
  const result = await runSetup({ ...f.options, workspace, scope: 'workspace' }, f.deps);
  assert.equal(result.configPath, path.join(workspace, '.neuralbridge/settings/mcp.json'));
  assert.equal(await readSnapshot(f.configPath), null);
});

test('invalid state prevents accidental duplicate registration', async t => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.statePath), { recursive: true });
  await writeFile(f.statePath, '{corrupt');
  await assert.rejects(runSetup(f.options, f.deps), { code: 'INVALID_STATE' });
  assert.equal(f.count(), 0);
});

test('a failed settings write resumes with the saved registration', async t => {
  const f = await fixture(t);
  await assert.rejects(runSetup(f.options, { ...f.deps, atomicWrite: async (file, ...args) => {
    if (file === f.configPath) throw new Error('simulated disk failure');
    return await atomicWrite(file, ...args);
  } }), /simulated disk failure/);
  assert.equal(f.count(), 1);
  await runSetup(f.options, f.deps);
  assert.equal(f.count(), 1);
  assert.equal(parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'].oauth.clientId, 'test-client-1');
});

test('failed replacement config write resumes with old entry ownership intact', async t => {
  const f = await fixture(t);
  await runSetup(f.options, f.deps);
  const originalHeader = parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'].headers['X-N8N-NeuralBridge-Connection'];
  await assert.rejects(runSetup({ ...f.options, command: 'repair', newRegistration: true }, { ...f.deps, atomicWrite: async (file, ...args) => {
    if (file === f.configPath) throw new Error('simulated disk failure');
    return await atomicWrite(file, ...args);
  } }), /simulated disk failure/);
  await runSetup(f.options, f.deps);
  assert.equal(f.count(), 2);
  assert.equal(parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'].oauth.clientId, 'test-client-2');
  assert.notEqual(parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'].headers['X-N8N-NeuralBridge-Connection'], originalHeader);
});

for (const command of ['configure', 'repair', 'remove']) {
  test(`${command} recovers after consecutive replacement config-write failures`, async t => {
    const f = await fixture(t);
    await runSetup(f.options, f.deps);
    const installed = await readFile(f.configPath, 'utf8');
    const failedWrite = { ...f.deps, atomicWrite: async (file, ...args) => {
      if (file === f.configPath) throw new Error('simulated disk failure');
      return await atomicWrite(file, ...args);
    } };
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(runSetup({ ...f.options, command: 'repair', newRegistration: true }, failedWrite), /simulated disk failure/);
      assert.equal(await readFile(f.configPath, 'utf8'), installed);
    }
    const result = await runSetup({ ...f.options, command, newRegistration: command === 'repair' }, f.deps);
    assert.equal(result.status, command === 'remove' ? 'removed' : 'configured_awaiting_authorization');
    assert.equal(f.count(), command === 'repair' ? 4 : 3);
    const entry = parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'];
    if (command === 'remove') assert.equal(entry, undefined);
    else assert.equal(entry.oauth.clientId, `test-client-${command === 'repair' ? 4 : 3}`);
  });
}

test('a rejected repair after a failed config write preserves ownership for removal', async t => {
  const f = await fixture(t);
  await runSetup(f.options, f.deps);
  await assert.rejects(runSetup({ ...f.options, command: 'repair', newRegistration: true }, {
    ...f.deps, atomicWrite: async (file, ...args) => {
      if (file === f.configPath) throw new Error('simulated disk failure');
      return await atomicWrite(file, ...args);
    },
  }), /simulated disk failure/);
  await assert.rejects(runSetup({ ...f.options, command: 'repair', newRegistration: true }, {
    ...f.deps, register: async () => { throw new Error('registration rejected'); },
  }), /registration rejected/);
  assert.equal((await runSetup({ ...f.options, command: 'remove' }, f.deps)).status, 'removed');
  assert.equal(f.count(), 2);
});

test('uncertain registration is journaled and requires explicit repair to retry', async t => {
  const f = await fixture(t);
  await assert.rejects(runSetup(f.options, { ...f.deps, register: async () => { throw new Error('simulated interrupted POST'); } }));
  await assert.rejects(runSetup(f.options, f.deps), { code: 'REGISTRATION_UNCERTAIN' });
  assert.equal(f.count(), 0);
  await runSetup({ ...f.options, command: 'repair', newRegistration: true }, f.deps);
  assert.equal(f.count(), 1);
});

test('later port use does not invalidate a reused registration or cause another POST', async t => {
  const f = await fixture(t);
  await runSetup(f.options, f.deps);
  const deps = { ...f.deps, availablePort: async () => { throw new Error('occupied'); } };
  assert.equal((await runSetup(f.options, deps)).registration, 'reused');
  assert.equal((await runSetup({ ...f.options, command: 'doctor' }, deps)).callback, 'listening_or_unavailable');
  assert.equal(f.count(), 1);
});

for (const neuralbridgeVersion of ['1.0.0', '1.0.1', '1.1.0', '9.0.0', '1.0.1-beta.1', undefined]) {
  test(`untested NeuralBridge ${neuralbridgeVersion ?? '(undetected)'} warns through dry-run, configure, reuse and repair`, async t => {
    const f = await fixture(t);
    const options = { ...f.options, neuralbridgeVersion };
    const deps = { ...f.deps, detectNeuralBridgeVersion: async () => neuralbridgeVersion };
    const warning = neuralbridgeVersion ? `NeuralBridge IDE ${neuralbridgeVersion} has not been tested` : 'version could not be detected';
    const checkWarning = result => {
      assert.ok(result.warnings.some(message => message.includes(warning) && message.includes('Setup will continue')));
    };
    const dryRun = await runSetup({ ...options, dryRun: true }, deps);
    assert.equal(dryRun.status, 'dry_run');
    checkWarning(dryRun);
    assert.deepEqual(await readdir(f.root), []);
    assert.equal(f.count(), 0);
    const configured = await runSetup(options, deps);
    assert.equal(configured.status, 'configured_awaiting_authorization');
    checkWarning(configured);
    const config = await readFile(f.configPath, 'utf8');
    assert.equal(parseConfig(config).mcpServers['n8n-test'].oauth.clientId, 'test-client-1');
    const reused = await runSetup(options, deps);
    assert.equal(reused.registration, 'reused');
    assert.equal(reused.changed, false);
    checkWarning(reused);
    assert.equal(await readFile(f.configPath, 'utf8'), config);
    assert.equal(f.count(), 1);
    const repaired = await runSetup({ ...options, command: 'repair', newRegistration: true }, deps);
    assert.equal(repaired.status, 'configured_awaiting_authorization');
    checkWarning(repaired);
    assert.equal(f.count(), 2);
    assert.equal(parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'].oauth.clientId, 'test-client-2');
  });
}

test('non-string detected versions warn and persist as unknown through setup and repair', async t => {
  for (const detectedVersion of [123, 0, true, false, {}, ['1.0.1'], null, undefined]) {
    const f = await fixture(t);
    const options = { ...f.options, neuralbridgeVersion: undefined };
    const deps = { ...f.deps, detectNeuralBridgeVersion: async () => detectedVersion };
    const checkWarnings = warnings => assert.ok(warnings.some(message =>
      message.includes('version could not be detected') && message.includes('Setup will continue')));
    checkWarnings(neuralbridgeVersionWarnings(detectedVersion));
    const dryRun = await runSetup({ ...options, dryRun: true }, deps);
    assert.equal(dryRun.status, 'dry_run');
    checkWarnings(dryRun.warnings);
    assert.equal(f.count(), 0);
    for (const operation of [options, options, { ...options, command: 'repair', newRegistration: true }]) {
      const result = await runSetup(operation, deps);
      assert.equal(result.status, 'configured_awaiting_authorization');
      checkWarnings(result.warnings);
      const records = Object.values(JSON.parse(await readFile(f.statePath, 'utf8')).connections);
      assert.equal(records.length, 1);
      assert.equal(records[0].neuralbridgeVersion, 'unknown');
    }
    assert.equal(f.count(), 2);
    assert.equal((await runSetup({ ...options, command: 'doctor' }, deps)).status, 'configured_unverified');
  }
});

test('version warnings strip terminal escapes and controls without blocking setup', async t => {
  const f = await fixture(t);
  const cases = [
    ['\u001b[31m9.0.0\u001b[0m', 'NeuralBridge IDE 9.0.0 has not been tested'],
    ['\u001b]0;fake title\u00079.0.0', '9.0.0 has not been tested'],
    ['\u001b]8;;https://example.com\u001b\\9.0.0\u001b]8;;\u001b\\', 'NeuralBridge IDE 9.0.0 has not been tested'],
    ['\u001b]8;;https://example.com/(foo)\u00079.0.0\u001b]8;;\u0007', '9.0.0 has not been tested'],
    ['\u001b]52;c;Y2xpcGJvYXJk\u00079.0.0', 'NeuralBridge IDE 9.0.0 has not been tested'],
    ['9.0.0\r\n\t\b\u0007\u007f\u0085', 'NeuralBridge IDE 9.0.0 has not been tested'],
    ['\u001b[31m1.0.1\u001b[0m', 'NeuralBridge IDE 1.0.1 has not been tested'],
    ['\u001b[31m\r\n\u0007', 'version could not be detected'],
  ];
  for (const [neuralbridgeVersion, expected] of cases) {
    const options = { ...f.options, neuralbridgeVersion };
    for (const dryRun of [true, false]) {
      const result = await runSetup({ ...options, dryRun }, f.deps);
      assert.equal(result.status, dryRun ? 'dry_run' : 'configured_awaiting_authorization');
      assert.ok(result.warnings.some(message => message.includes(expected) && message.includes('Setup will continue')), JSON.stringify(neuralbridgeVersion));
      for (const message of result.warnings) assert.doesNotMatch(message, /[\u0000-\u001f\u007f-\u009f]/);
    }
  }
  assert.equal(f.count(), 1);
});

test('doctor and remove never require version detection', async t => {
  const f = await fixture(t);
  await runSetup(f.options, f.deps);
  const options = { ...f.options, neuralbridgeVersion: undefined };
  const deps = { ...f.deps, detectNeuralBridgeVersion: () => { throw new Error('unexpected detection'); } };
  assert.equal((await runSetup({ ...options, command: 'doctor' }, deps)).status, 'configured_unverified');
  assert.equal((await runSetup({ ...options, command: 'remove' }, deps)).status, 'removed');
});

test('invalid callback ports still fail before registration', async t => {
  const f = await fixture(t);
  await assert.rejects(runSetup({ ...f.options, neuralbridgeVersion: '9.0.0', callbackPort: 0 }, f.deps), { code: 'CALLBACK_PORT' });
  assert.equal(f.count(), 0);
});

// No NeuralBridge version has a recorded live acceptance yet, so these cases inject the tested list.
for (const neuralbridgeVersion of ['1.0.1', '1.1.0']) {
  test(`detected tested NeuralBridge ${neuralbridgeVersion} configures a public client with the registered callback`, async t => {
    const f = await fixture(t);
    const result = await runSetup({ ...f.options, neuralbridgeVersion: undefined }, { ...f.deps, testedVersions: [neuralbridgeVersion], detectNeuralBridgeVersion: async () => neuralbridgeVersion });
    const registration = f.requests.find(request => request.method === 'POST').body;
    const config = parseConfig(await readFile(f.configPath, 'utf8')).mcpServers['n8n-test'];
    assert.equal(result.status, 'configured_awaiting_authorization');
    assert.ok(!result.warnings.some(message => message.startsWith('Warning:')));
    assert.equal(registration.token_endpoint_auth_method, 'none');
    assert.deepEqual(registration.redirect_uris, [result.callbackUri]);
    assert.equal(config.oauth.clientId, 'test-client-1');
    assert.equal(config.oauth.clientSecret, undefined);
    assert.equal(`http://${config.oauth.redirectUri}/oauth/callback`, result.callbackUri);
  });

  test(`upgrading to NeuralBridge ${neuralbridgeVersion} reuses the existing registration and settings`, async t => {
    const f = await fixture(t);
    await runSetup(f.options, f.deps);
    const config = await readFile(f.configPath, 'utf8');
    const result = await runSetup({ ...f.options, neuralbridgeVersion }, { ...f.deps, testedVersions: [neuralbridgeVersion] });
    assert.equal(result.registration, 'reused');
    assert.equal(result.changed, false);
    assert.equal(f.count(), 1);
    assert.equal(await readFile(f.configPath, 'utf8'), config);
  });
}

test('atomic writes reject concurrent changes and preserve the external edit', async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'settings.json'), 'new');
  await assert.rejects(atomicWrite(path.join(f.root, 'settings.json'), 'old', 'replacement'), { code: 'CONCURRENT_EDIT' });
  assert.equal(await readFile(path.join(f.root, 'settings.json'), 'utf8'), 'new');
});

test('unchanged writes still detect a concurrent edit', async t => {
  const f = await fixture(t);
  const file = path.join(f.root, 'settings.json');
  await writeFile(file, 'external edit');
  await assert.rejects(atomicWrite(file, 'old', 'old'), { code: 'CONCURRENT_EDIT' });
  assert.equal(await readFile(file, 'utf8'), 'external edit');
});

test('oversized writes are rejected by UTF-8 byte size before creating files or backups', async t => {
  const f = await fixture(t);
  const file = path.join(f.root, 'settings.json');
  const oversized = 'ü'.repeat(512 * 1024 + 1);
  await assert.rejects(atomicWrite(file, null, oversized), { code: 'FILE_SIZE' });
  assert.deepEqual(await readdir(f.root), []);
  await writeFile(file, '{}');
  await assert.rejects(atomicWrite(file, '{}', oversized), { code: 'FILE_SIZE' });
  assert.equal(await readFile(file, 'utf8'), '{}');
  assert.deepEqual(await readdir(f.root), ['settings.json']);
});

test('locks reject another writer and are released even on failure', async t => {
  const f = await fixture(t);
  const file = path.join(f.root, 'locked.json');
  await withLock(file, () => assert.rejects(withLock(file, () => {}), { code: 'LOCKED' }));
  await assert.rejects(withLock(file, () => { throw new Error('failure'); }), /failure/);
  await withLock(file, () => {});
});

test('symlinked settings are never overwritten', async t => {
  const f = await fixture(t);
  const directory = path.join(f.root, 'elsewhere');
  await mkdir(directory);
  await symlink(directory, path.join(f.root, '.neuralbridge'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(runSetup(f.options, f.deps), { code: 'SYMLINK' });
  assert.equal(f.count(), 0);
});

test('two instances have separate managed entries and removal preserves the other', async t => {
  const a = await fixture(t);
  const b = await fixture(t);
  const first = await runSetup({ ...a.options, name: undefined }, a.deps);
  const second = await runSetup({ ...b.options, name: undefined }, a.deps);
  assert.notEqual(first.serverName, second.serverName);
  const before = parseConfig(await readFile(a.configPath, 'utf8')).mcpServers[second.serverName];
  await runSetup({ ...a.options, name: undefined, command: 'remove' }, a.deps);
  assert.deepEqual(parseConfig(await readFile(a.configPath, 'utf8')).mcpServers, { [second.serverName]: before });
  assert.equal(a.count(), 1);
  assert.equal(b.count(), 1);
});

test('an occupied requested callback fails before registration; repair changes the callback', async t => {
  const f = await fixture(t);
  const listener = createServer();
  await new Promise(resolve => listener.listen(0, 'localhost', resolve));
  t.after(() => new Promise(resolve => listener.close(resolve)));
  await assert.rejects(runSetup({ ...f.options, callbackPort: listener.address().port }, f.deps), { code: 'CALLBACK_PORT' });
  assert.equal(f.count(), 0);
  const first = await runSetup(f.options, f.deps);
  const oldPort = Number(new URL(first.callbackUri).port);
  await assert.rejects(runSetup({ ...f.options, callbackPort: oldPort === 65535 ? 65534 : oldPort + 1 }, f.deps), { code: 'CALLBACK_CHANGE' });
  const repaired = await runSetup({ ...f.options, command: 'repair', newRegistration: true }, f.deps);
  assert.equal(repaired.registration, 'created');
  assert.equal(f.count(), 2);
});

test('registration policy failure preserves settings and is not automatically retried', async t => {
  const f = await fixture(t, { registrationStatus: 400 });
  await assert.rejects(runSetup(f.options, f.deps), { code: 'REGISTRATION_REJECTED' });
  assert.equal(await readSnapshot(f.configPath), null);
  await assert.rejects(runSetup(f.options, f.deps), { code: 'REGISTRATION_UNCERTAIN' });
  assert.equal(f.count(), 1);
});
test('no NeuralBridge version is listed as tested yet, so every detected version warns', () => {
  assert.deepEqual(TESTED_NEURALBRIDGE_VERSIONS, []);
  assert.ok(neuralbridgeVersionWarnings('1.0.1')[0].includes('Tested versions: none yet.'));
  assert.deepEqual(neuralbridgeVersionWarnings('1.0.1', ['1.0.1']), []);
});
test('installation candidates follow the NeuralBridge product names per platform', () => {
  assert.deepEqual(productJsonCandidates('win32', { LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local' }), [
    'C:\\Users\\u\\AppData\\Local\\Programs\\NeuralBridge\\resources\\app\\product.json',
    'C:\\Users\\u\\AppData\\Local\\Programs\\NeuralBridge IDE\\resources\\app\\product.json',
  ]);
  assert.deepEqual(productJsonCandidates('win32', {}), []);
  assert.deepEqual(productJsonCandidates('darwin', {}), [
    '/Applications/NeuralBridge.app/Contents/Resources/app/product.json',
    '/Applications/NeuralBridge IDE.app/Contents/Resources/app/product.json',
  ]);
  assert.deepEqual(productJsonCandidates('linux', {}), []);
});
test('version detection reads product.json, ignores other applications, then asks neuralbridge in PATH', async () => {
  const files = {
    'C:\\L\\Programs\\NeuralBridge\\resources\\app\\product.json': JSON.stringify({ applicationName: 'other', version: '7.7.7' }),
    'C:\\L\\Programs\\NeuralBridge IDE\\resources\\app\\product.json': JSON.stringify({ applicationName: 'neuralbridge', version: '1.0.1' }),
  };
  const read = async file => { if (Object.hasOwn(files, file)) return files[file]; throw Object.assign(new Error('missing'), { code: 'ENOENT' }); };
  const calls = [];
  const exec = async (command, args) => { calls.push([command, ...args]); return { stdout: '1.2.3\ncommit\nx64\n' }; };
  assert.equal(await detectNeuralBridgeVersion({ platform: 'win32', env: { LOCALAPPDATA: 'C:\\L' }, read, exec }), '1.0.1');
  assert.deepEqual(calls, [], 'a matching product.json needs no process');
  assert.equal(await detectNeuralBridgeVersion({ platform: 'linux', env: {}, read, exec }), '1.2.3');
  assert.deepEqual(calls, [['neuralbridge', '--version']]);
  const missing = async () => { throw Object.assign(new Error('spawn neuralbridge ENOENT'), { code: 'ENOENT' }); };
  assert.equal(await detectNeuralBridgeVersion({ platform: 'darwin', env: {}, read, exec: missing }), undefined);
});
test('NEURALBRIDGE_HOME moves user settings and registration state', async t => {
  const f = await fixture(t);
  const custom = path.join(f.root, 'custom home');
  const result = await runSetup(f.options, { ...f.deps, env: { NEURALBRIDGE_HOME: custom } });
  assert.equal(result.configPath, path.join(custom, 'settings/mcp.json'));
  assert.equal(parseConfig(await readFile(path.join(custom, 'settings/mcp.json'), 'utf8')).mcpServers['n8n-test'].oauth.clientId, 'test-client-1');
  assert.equal(Object.keys(JSON.parse(await readFile(path.join(custom, 'n8n-power/connections.json'), 'utf8')).connections).length, 1);
  await assert.rejects(readFile(f.configPath, 'utf8'), { code: 'ENOENT' });
  const tilde = await runSetup({ ...f.options, command: 'doctor' }, { ...f.deps, env: { NEURALBRIDGE_HOME: '~/custom home' } });
  assert.equal(tilde.configPath, path.join(custom, 'settings/mcp.json'), 'a leading ~ expands against the home directory');
  assert.equal(tilde.status, 'configured_unverified');
});
