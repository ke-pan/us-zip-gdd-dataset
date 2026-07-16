import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
    schemaSha256: '0bb91a9dd70c28e2e916218b03e5d09a8f9642d6012c170e31fc80d6d14373fe',
  });
});

test('final publication rejects a DOI that is not synchronized into citation metadata', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'gdd-public-record-'));
  try {
    await cp(repositoryRoot, temporaryRoot, { recursive: true });
    const recordPath = join(temporaryRoot, 'metadata/record.json');
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    record.record_status = 'published';
    record.doi = 'https://doi.org/10.5281/zenodo.1234567';
    await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);

    await assert.rejects(
      verifyPublicRecord(temporaryRoot, { mode: 'final' }),
      /CITATION\.cff does not contain the published DOI/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
