import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const REQUIRED_RECORD_FILES = [
  'README.md',
  'CITATION.cff',
  'DATA-LICENSE.txt',
  'CODE-TERMS.txt',
  'CHANGELOG.md',
  'SECURITY.md',
  'metadata/record.json',
  'docs/methodology.md',
  'docs/data-dictionary.md',
  'docs/limitations.md',
  'docs/reproducibility.md',
  'schema/gdd50-zcta.schema.json',
  'examples/release-2026-07-16-sample.csv',
  'examples/noaa-observations.csv',
  'examples/zcta-station-map.json',
  'scripts/reproduce-sample.js',
  'src/reproduce.js',
];

const FORBIDDEN_CONTENT = [
  { label: 'private repository slug', pattern: /ke-pan\/whentoapplypreemergent/i },
  { label: 'GitHub token', pattern: /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/ },
  { label: 'OpenAI-style token', pattern: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { label: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'Cloudflare token assignment', pattern: /CLOUDFLARE_API_TOKEN\s*[:=]\s*[^\s$<{]+/ },
];

function rootPath(root) {
  return root instanceof URL ? fileURLToPath(root) : resolve(root);
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function listFiles(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path, base));
    else files.push({ path, relative: path.slice(base.length + 1) });
  }
  return files;
}

function assertRecordMetadata(record, mode) {
  if (record.schema_version !== 1) throw new Error('Unsupported public record schema.');
  if (record.version !== '2026-07-16') throw new Error('Unexpected initial release version.');
  if (record.creator?.name !== 'Raymond Pan' || record.creator?.affiliation !== 'Offshoot Labs') {
    throw new Error('Creator identity is incomplete or inconsistent.');
  }
  if (record.canonical_dataset_url !== 'https://whentoapplypreemergent.com/datasets/gdd/') {
    throw new Error('Canonical dataset URL is inconsistent.');
  }
  if (record.code_repository_url !== 'https://github.com/ke-pan/us-zip-gdd-dataset') {
    throw new Error('Public code repository URL is inconsistent.');
  }
  if (record.data_license !== 'CC-BY-4.0') throw new Error('Data license is inconsistent.');

  if (mode === 'final') {
    if (record.record_status !== 'published' || !/^https:\/\/doi\.org\/10\.\d{4,9}\/.+/.test(record.doi)) {
      throw new Error('Final publication requires a published status and DOI URL.');
    }
  } else if (record.record_status !== 'prepublication' || record.doi !== null) {
    throw new Error('Prepublication record must have a null DOI and prepublication status.');
  }
}

export async function verifyPublicRecord(root, options = {}) {
  const directory = rootPath(root);
  const mode = options.mode ?? 'prepublication';

  for (const relative of REQUIRED_RECORD_FILES) {
    const path = join(directory, relative);
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) throw new Error(`Missing required public record file: ${relative}`);
  }

  const record = JSON.parse(await readFile(join(directory, 'metadata/record.json'), 'utf8'));
  assertRecordMetadata(record, mode);

  const samplePath = join(directory, 'examples/release-2026-07-16-sample.csv');
  const sampleSha256 = await sha256(samplePath);
  if (sampleSha256 !== record.release?.sample_sha256) {
    throw new Error('Preserved sample does not match the published SHA-256.');
  }

  const schemaPath = join(directory, 'schema/gdd50-zcta.schema.json');
  const schemaSha256 = await sha256(schemaPath);
  if (schemaSha256 !== record.release?.schema_sha256) {
    throw new Error('Public schema does not match the published SHA-256.');
  }
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const [sampleHeader] = (await readFile(samplePath, 'utf8')).split(/\r?\n/);
  if (sampleHeader !== schema.required.join(',')) {
    throw new Error('Preserved sample header does not match the public schema.');
  }

  const citation = await readFile(join(directory, 'CITATION.cff'), 'utf8');
  for (const marker of [
    'given-names: "Raymond"',
    'family-names: "Pan"',
    'license: CC-BY-4.0',
    record.immutable_dataset_url,
    record.code_repository_url,
  ]) {
    if (!citation.includes(marker)) throw new Error(`CITATION.cff is missing ${marker}.`);
  }

  for (const file of await listFiles(directory)) {
    if (/\.(?:png|jpg|jpeg|gif|webp|parquet)$/i.test(file.relative)) continue;
    const content = await readFile(file.path, 'utf8');
    for (const forbidden of FORBIDDEN_CONTENT) {
      if (forbidden.pattern.test(content)) {
        throw new Error(`${file.relative} contains forbidden ${forbidden.label}.`);
      }
    }
  }

  return {
    ok: true,
    status: record.record_status,
    version: record.version,
    creator: record.creator.name,
    requiredFileCount: REQUIRED_RECORD_FILES.length,
    sampleSha256,
    schemaSha256,
  };
}
