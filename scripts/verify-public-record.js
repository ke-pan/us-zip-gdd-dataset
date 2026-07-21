import { verifyPublicRecord } from '../src/verify-public-record.js';

const result = await verifyPublicRecord(new URL('../', import.meta.url), {
  mode: process.argv.includes('--prepublication') ? 'prepublication' : 'final',
});

console.log(`Public record: ${result.status}`);
console.log(`Version: ${result.version}`);
console.log(`Creator: ${result.creator}`);
console.log(`Required files: ${result.requiredFileCount}`);
console.log(`Sample SHA-256: ${result.sampleSha256}`);
console.log(`Schema SHA-256: ${result.schemaSha256}`);
console.log('Status: PASS');
