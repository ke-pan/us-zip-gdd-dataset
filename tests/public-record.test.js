import assert from 'node:assert/strict';
import { test } from 'node:test';

import { verifyPublicRecord } from '../src/verify-public-record.js';

const repositoryRoot = new URL('../', import.meta.url);

test('public record is complete, sanitized, and pinned to the verified 2026-07-16 sample', async () => {
  const result = await verifyPublicRecord(repositoryRoot, { mode: 'prepublication' });

  assert.deepEqual(result, {
    ok: true,
    status: 'prepublication',
    version: '2026-07-16',
    creator: 'Raymond Pan',
    requiredFileCount: 17,
    sampleSha256: '834262003c9eae2dbb78f693bdaf4817b61d8f3854213924afe9093254598367',
    schemaSha256: 'de9abee297dd6d1f30dc793bc124dac72412bd5c9e18263b3dbafb560f928e84',
  });
});
