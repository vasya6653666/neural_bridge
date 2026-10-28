import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WebhoundApiClient,
  sessionUrl,
  stripHtml,
  titleFromPrompt,
  webhoundError,
} from '../core/webhoundClient.mjs';


function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('public text and URL helpers normalize untrusted display input', () => {
  assert.equal(titleFromPrompt('  one   two  '), 'one two');
  assert.equal(titleFromPrompt('x'.repeat(80), 'Report: '), `Report: ${'x'.repeat(67)}...`);
  assert.equal(
    stripHtml('<h1>Title &amp; More</h1><p>A&nbsp;B<br>C &lt; D &gt; E &quot;Q&quot; &#39;S&#39;</p>'),
    'Title & More\nA B\nC < D > E "Q" \'S\'',
  );
  assert.equal(sessionUrl('https://webhound.test///', 's 1'), 'https://webhound.test/session/s 1');
  assert.equal(sessionUrl('', 's1'), 'https://webhound.ai/session/s1');
});

test('typed errors preserve stable machine-readable recovery metadata', () => {
  const error = webhoundError('failed', {
    code: 'TEST_FAILURE',
    status: 409,
    retryable: false,
    body: { reason: 'conflict' },
    nextAction: 'Inspect before retrying.',
  });
  assert.equal(error.message, 'failed');
  assert.equal(error.code, 'TEST_FAILURE');
  assert.equal(error.status, 409);
  assert.equal(error.retryable, false);
  assert.deepEqual(error.body, { reason: 'conflict' });
  assert.equal(error.nextAction, 'Inspect before retrying.');
});

test('client configuration and tool context produce scoped request headers', () => {
  const client = new WebhoundApiClient({
    apiBase: 'https://api.test/v2///',
    appBase: 'https://app.test///',
    apiKey: 'wh_test',
    internalSecret: 'internal-test',
    allowLocalFiles: true,
  });
  assert.equal(client.apiBase, 'https://api.test/v2');
  assert.equal(client.webUrl('session-1'), 'https://app.test/session/session-1');
  assert.equal(client.apiUrl('sessions'), 'https://api.test/v2/sessions');
  assert.equal(client.allowLocalFiles, true);

  const previous = client.setToolContext('webhound_watch', '0.5.3');
  assert.deepEqual(previous, { toolName: null, version: null });
  assert.deepEqual(client.headers({ Accept: 'application/json' }), {
    Accept: 'application/json',
    Authorization: 'Bearer wh_test',
    'x-internal-secret': 'internal-test',
    'X-Webhound-MCP-Tool': 'webhound_watch',
    'X-Webhound-MCP-Version': '0.5.3',
  });
  client.restoreToolContext(previous);
  assert.equal(client.activeToolName, null);
  assert.equal(client.mcpVersion, null);
});

test('request transport handles JSON, raw bodies, HTTP status, and network failures', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const client = new WebhoundApiClient({ apiBase: 'https://api.test', apiKey: 'wh_test' });
  const calls = [];

  globalThis.fetch = async (...args) => {
    calls.push(args);
    return jsonResponse({ data: { ok: true } });
  };
  assert.deepEqual(await client.post('/resource', { one: 1 }), { ok: true });
  assert.equal(calls[0][0], 'https://api.test/resource');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer wh_test');
  assert.equal(calls[0][1].headers['Content-Type'], 'application/json');
  assert.equal(calls[0][1].body, '{"one":1}');

  globalThis.fetch = async () => new Response('plain response', { status: 200 });
  assert.deepEqual(await client.get('/raw'), { raw: 'plain response' });

  globalThis.fetch = async () => jsonResponse({ error: 'gone' }, 404);
  await assert.rejects(
    client.get('/missing'),
    error => error.code === 'SESSION_NOT_FOUND'
      && error.status === 404
      && /Do not keep waiting/.test(error.nextAction),
  );

  globalThis.fetch = async () => jsonResponse({ error: 'overloaded', code: 'UPSTREAM_BUSY' }, 503);
  await assert.rejects(
    client.get('/busy'),
    error => error.code === 'UPSTREAM_BUSY' && error.retryable === true,
  );

  globalThis.fetch = async () => { throw new Error('socket closed'); };
  await assert.rejects(
    client.get('/network'),
    error => error.code === 'NETWORK_ERROR' && error.retryable === true,
  );
});

test('GET, POST, and PATCH helpers retain their exact method and payload boundaries', async () => {
  const client = new WebhoundApiClient({ apiKey: 'wh_test' });
  const calls = [];
  client.request = async (...args) => { calls.push(args); return { ok: true }; };

  await client.get('/one');
  await client.post('/two', { two: 2 });
  await client.patch('/three', { three: 3 });
  assert.deepEqual(calls, [
    ['GET', '/one'],
    ['POST', '/two', { two: 2 }],
    ['PATCH', '/three', { three: 3 }],
  ]);
});

test('context validation deduplicates owned IDs and fails closed on lookup errors', async () => {
  const client = new WebhoundApiClient({ apiKey: 'wh_test' });
  const endpoints = [];
  client.get = async endpoint => { endpoints.push(endpoint); return { id: endpoint }; };
  assert.deepEqual(
    await client.validateContextSessions([' one ', 'one', '', 'two/slash']),
    ['one', 'two/slash'],
  );
  assert.deepEqual(endpoints, ['/sessions/one', '/sessions/two%2Fslash']);
  assert.deepEqual(await client.validateContextSessions(null), []);

  client.get = async () => { throw Object.assign(new Error('missing'), { status: 404, code: 'SESSION_NOT_FOUND' }); };
  await assert.rejects(
    client.validateContextSessions(['missing']),
    error => error.code === 'INVALID_CONTEXT_SESSION'
      && error.body.cause === 'SESSION_NOT_FOUND'
      && error.retryable === false,
  );
});

test('report launch resolves defaults and strips private provider fields from the response', async () => {
  const client = new WebhoundApiClient({ apiKey: 'wh_test' });
  let mutation;
  client.validateContextSessions = async ids => ids || [];
  client.getDefaults = async () => ({ default_budget_usd: 7, use_free_run_when_available: true });
  client.postMutation = async (endpoint, body, reconciliationAction) => {
    mutation = { endpoint, body, reconciliationAction };
    return { session_id: 's1', model: 'private-model', resolved_model: 'private-route', max_mode: false };
  };

  const result = await client.startReport({
    prompt: '  Research   this launch  ',
    context_session_ids: ['context-1'],
    file_ids: ['file-1'],
  });
  assert.equal(mutation.endpoint, '/research');
  assert.equal(mutation.body.title, 'Research this launch');
  assert.equal(mutation.body.budget, 7);
  assert.equal(mutation.body.model, 'hound');
  assert.deepEqual(mutation.body.context_session_ids, ['context-1']);
  assert.match(mutation.reconciliationAction, /confirming no session was created/);
  assert.deepEqual(result, { session_id: 's1', research_harness: 'Hound' });
});

test('session mutation helpers encode IDs and forward only their documented payloads', async () => {
  const client = new WebhoundApiClient({ apiKey: 'wh_test' });
  const calls = [];
  client.get = async endpoint => { calls.push(['get', endpoint]); return { ok: true }; };
  client.post = async (endpoint, body) => { calls.push(['post', endpoint, body]); return { ok: true }; };
  client.patch = async (endpoint, body) => { calls.push(['patch', endpoint, body]); return { ok: true }; };
  client.postMutation = async (endpoint, body, reconciliationAction) => {
    calls.push(['mutation', endpoint, body, reconciliationAction]);
    return { ok: true };
  };
  client.validateContextSessions = async ids => ids || [];

  await client.sendMessage('s/1', 'hello');
  await client.addSidecarNotes('s/1', [{ summary: 'note' }]);
  await client.listSidecarNotes('s/1', { status: 'pending', limit: 5 });
  await client.listSidecarNotes('s/1', { status: '', limit: 0 });
  await client.updateSidecarNote('s/1', 'n/1', { status: 'dismissed' });
  await client.resume('s/1', { additional_budget: 2, context_session_ids: ['context-1'] });
  await client.addBudget('s/1', { amount: 3 });
  await client.setBudget('s/1', { target_budget: 4.91, user_requested_budget_reduction: true });
  await client.getShareableLink('s/1');

  assert.deepEqual(calls.slice(0, 5), [
    ['post', '/sessions/s%2F1/messages', { message: 'hello' }],
    ['post', '/sessions/s%2F1/sidecar-notes', { notes: [{ summary: 'note' }] }],
    ['get', '/sessions/s%2F1/sidecar-notes?status=pending&limit=5'],
    ['get', '/sessions/s%2F1/sidecar-notes'],
    ['patch', '/sessions/s%2F1/sidecar-notes/n%2F1', { status: 'dismissed' }],
  ]);
  assert.equal(calls[5][1], '/research/s%2F1/resume');
  assert.deepEqual(calls[5][2].context_session_ids, ['context-1']);
  assert.equal(calls[6][1], '/research/s%2F1/budget');
  assert.equal(calls[7][1], '/research/s%2F1/budget');
  assert.deepEqual(calls[8], ['post', '/sessions/s%2F1/share-link', {}]);
});

test('output and export helpers preserve selection metadata and delivery URLs', async () => {
  const reportClient = new WebhoundApiClient({ apiBase: 'https://api.test/v2', apiKey: 'wh_test' });
  const reportEndpoints = [];
  reportClient.get = async endpoint => {
    reportEndpoints.push(endpoint);
    if (endpoint === '/sessions/s1') return { session_type: 'research' };
    if (endpoint.startsWith('/sessions/s1/document')) {
      return { document_id: 'doc-1', content: '<h1>Report</h1><p>A &amp; B</p>' };
    }
    return { filename: 'report.md', encoding: 'utf8' };
  };
  assert.deepEqual(await reportClient.getOutput('s1', {
    kind: 'report',
    doc_name: 'Final report',
    select: 'latest',
  }), {
    document_id: 'doc-1',
    content_markdown: 'Report\nA & B',
  });
  const exported = await reportClient.exportSession('s1', { format: 'md', select: 'output' });
  assert.equal(exported.download_url, 'https://api.test/v2/sessions/s1/export?format=md&select=output&download=true');
  assert.match(exported.download_note, /Authorization/);
  assert.match(reportEndpoints[1], /doc_name=Final\+report&select=latest/);

  const datasetClient = new WebhoundApiClient({ apiKey: 'wh_test' });
  datasetClient.get = async endpoint => endpoint.endsWith('/dataset')
    ? { rows: [{ id: 1 }] }
    : { session_type: 'extraction' };
  assert.deepEqual(await datasetClient.getOutput('dataset-1'), { rows: [{ id: 1 }] });
});

test('claim and source helpers normalize native evidence and derive dataset-cell provenance', async () => {
  const direct = new WebhoundApiClient({ apiKey: 'wh_test' });
  direct.get = async endpoint => endpoint.endsWith('/claims')
    ? { claims: [{ id: 't1', document_id: 'doc-1', claim: 'Fact' }], count: '1' }
    : { sources: [{ url: 'https://one.test' }], total: '1' };
  assert.deepEqual((await direct.getClaims('s1')).claims[0], {
    id: 't1',
    document_id: 'doc-1',
    claim: 'Fact',
    trace_id: 't1',
    claim_id: 's1:doc-1:t1',
    session_id: 's1',
  });
  assert.equal((await direct.getSources('s1')).source_count, 1);

  const dataset = new WebhoundApiClient({ apiKey: 'wh_test' });
  dataset.get = async endpoint => endpoint.endsWith('/claims')
    ? { claims: [] }
    : { sources: [] };
  dataset.getSession = async () => ({
    session_type: 'extraction',
    dataset: {
      rows: [{
        id: 'row-1',
        data: {
          company: {
            value: 'Acme',
            sources: ['https://one.test', { url: 'https://two.test' }, { url: 'not-a-url' }],
          },
          ignored: { value: 'No source' },
        },
      }],
    },
  });
  const claims = await dataset.getClaims('dataset-1');
  assert.equal(claims.provenance_level, 'dataset_cell');
  assert.deepEqual(claims.claims[0].source_urls, ['https://one.test', 'https://two.test']);
  const sources = await dataset.getSources('dataset-1');
  assert.equal(sources.source_count, 2);
  assert.equal(sources.sources.every(source => source.citation_count === 1), true);
});

test('session listing, search reconciliation, and full reads remove provider internals', async () => {
  const client = new WebhoundApiClient({ apiKey: 'wh_test' });
  client.get = async endpoint => {
    if (endpoint.startsWith('/sessions/search?')) {
      return { results: [{ id: 'completed', title: 'Launch', status: 'completed', model: 'private' }], page: '1', total: '1' };
    }
    if (endpoint.startsWith('/sessions?page=1&page_size=30')) {
      return { sessions: [{ id: 'active', title: 'Launch', status: 'researching', resolved_model: 'private' }] };
    }
    if (endpoint.startsWith('/sessions?')) {
      return { sessions: [{ id: 'listed', model: 'private' }], page: '1', page_size: '5', total: '1', total_pages: '1' };
    }
    return {
      session_id: 's1',
      model: 'private',
      metadata: { model: 'private', session_type: 'research' },
      usage: { events: [{ details: { provider: 'private', useful: true } }] },
      documents: [{ doc_type: 'output', is_output: true, content_markdown: '# Done' }],
    };
  };

  const listed = await client.listSessions({ page: 1, limit: 5, type: 'research', status: 'active' });
  assert.equal(listed.sessions[0].model, undefined);
  assert.equal(listed.has_more, false);

  const searched = await client.searchSessions({ query: 'Launch', limit: 10 });
  assert.deepEqual(searched.results.map(item => item.id), ['active', 'completed']);
  assert.equal(searched.active_exact_matches_added, 1);
  assert.equal(searched.results.every(item => item.model === undefined && item.resolved_model === undefined), true);

  const full = await client.getSession('s1');
  assert.equal(full.model, undefined);
  assert.equal(full.metadata.model, undefined);
  assert.equal(full.usage.events[0].details.provider, undefined);
  assert.equal(full.usage.events[0].details.useful, true);
  assert.equal(full.documents[0].document_role, undefined);
  assert.equal(full.documents[0].document_state, 'working');
  assert.equal(full.documents[0].document_id, 's1:document:1');
  assert.equal(full.research_harness, 'Hound');
});
