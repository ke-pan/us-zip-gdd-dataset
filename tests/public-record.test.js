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
    requiredFileCount: 18,
    sampleSha256: '834262003c9eae2dbb78f693bdaf4817b61d8f3854213924afe9093254598367',
    schemaSha256: 'de9abee297dd6d1f30dc793bc124dac72412bd5c9e18263b3dbafb560f928e84',
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

test('final publication rejects a changelog that still marks the DOI as pending', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'gdd-public-record-'));
  try {
    await cp(repositoryRoot, temporaryRoot, { recursive: true });
    const doi = '10.5281/zenodo.1234567';
    const doiUrl = `https://doi.org/${doi}`;
    const recordPath = join(temporaryRoot, 'metadata/record.json');
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    record.record_status = 'published';
    record.doi = doiUrl;
    await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);

    const citationPath = join(temporaryRoot, 'CITATION.cff');
    const citation = await readFile(citationPath, 'utf8');
    await writeFile(
      citationPath,
      citation.replace('preferred-citation:', `doi: "${doi}"\npreferred-citation:\n  doi: "${doi}"`),
    );

    const readmePath = join(temporaryRoot, 'README.md');
    const readme = await readFile(readmePath, 'utf8');
    await writeFile(readmePath, `${readme}\nPublished DOI: ${doiUrl}\n`);

    await assert.rejects(
      verifyPublicRecord(temporaryRoot, { mode: 'final' }),
      /CHANGELOG\.md still marks the DOI as pending/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
