import { readFile } from 'node:fs/promises';

import { reproduceRows, rowsToCsv } from '../src/reproduce.js';

const fixtureUrl = new URL('../examples/', import.meta.url);
const observations = await readFile(new URL('noaa-observations.csv', fixtureUrl), 'utf8');
const mapping = JSON.parse(
  await readFile(new URL('zcta-station-map.json', fixtureUrl), 'utf8'),
);

const rows = reproduceRows(observations, mapping, {
  sourceYear: 2026,
  generatedOn: '2026-01-05',
  maxLagDays: 7,
});

process.stdout.write(rowsToCsv(rows));
