import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { reproduceRows } from '../src/reproduce.js';

const fixtureUrl = new URL('../examples/', import.meta.url);

test('reproduces a GDD50 row from NOAA observations and falls back to the first complete station', async () => {
  const observations = await readFile(new URL('noaa-observations.csv', fixtureUrl), 'utf8');
  const mapping = JSON.parse(
    await readFile(new URL('zcta-station-map.json', fixtureUrl), 'utf8'),
  );

  assert.deepEqual(reproduceRows(observations, mapping, {
    sourceYear: 2026,
    generatedOn: '2026-01-05',
    maxLagDays: 7,
  }), [
    {
      zcta5: '99999',
      state_fips: '25',
      state_code: 'MA',
      centroid_latitude_degrees: 42.1,
      centroid_longitude_degrees: -72.6,
      gdd_base_f: 50,
      accumulation_start_date: '2026-01-01',
      observation_start_date: '2026-01-01',
      observation_end_date: '2026-01-03',
      days_with_observations: 3,
      cumulative_gdd_f_degree_days: 36,
      station_id: 'USW00000002',
      station_distance_km: 4.8,
      fallback_rank: 2,
      station_candidate_count: 2,
      freshness_status: 'fresh',
      freshness_age_days: 2,
      freshness_max_lag_days: 7,
      data_available: true,
      unavailable_reason: null,
    },
  ]);
});

test('retains an official ZCTA as unavailable when no station has complete observations', async () => {
  const observations = await readFile(new URL('noaa-observations.csv', fixtureUrl), 'utf8');
  const mapping = {
    '99998': {
      state_fips: '25',
      state_code: 'MA',
      latitude: 42,
      longitude: -72,
      stations: [{ id: 'USW00000999', distance_km: 2.5 }],
    },
  };

  assert.deepEqual(reproduceRows(observations, mapping, {
    sourceYear: 2026,
    generatedOn: '2026-01-05',
    maxLagDays: 7,
  }), [
    {
      zcta5: '99998',
      state_fips: '25',
      state_code: 'MA',
      centroid_latitude_degrees: 42,
      centroid_longitude_degrees: -72,
      gdd_base_f: 50,
      accumulation_start_date: '2026-01-01',
      observation_start_date: null,
      observation_end_date: null,
      days_with_observations: null,
      cumulative_gdd_f_degree_days: null,
      station_id: null,
      station_distance_km: null,
      fallback_rank: null,
      station_candidate_count: 1,
      freshness_status: 'unavailable',
      freshness_age_days: null,
      freshness_max_lag_days: 7,
      data_available: false,
      unavailable_reason: 'no_station_data',
    },
  ]);
});

test('skips a stale complete station and selects the next fresh candidate', () => {
  const observations = [
    'STATION,DATE,ELEMENT,VALUE,MFLAG,QFLAG,SFLAG,OBS_TIME',
    'USW00000001,20260101,TMAX,200,,,W,',
    'USW00000001,20260101,TMIN,100,,,W,',
    'USW00000002,20260109,TMAX,200,,,W,',
    'USW00000002,20260109,TMIN,100,,,W,',
    '',
  ].join('\n');
  const mapping = {
    '99997': {
      state_fips: '25',
      state_code: 'MA',
      latitude: 42,
      longitude: -72,
      stations: [
        { id: 'USW00000001', distance_km: 1 },
        { id: 'USW00000002', distance_km: 2 },
      ],
    },
  };

  const [row] = reproduceRows(observations, mapping, {
    sourceYear: 2026,
    generatedOn: '2026-01-10',
    maxLagDays: 7,
  });

  assert.equal(row.station_id, 'USW00000002');
  assert.equal(row.fallback_rank, 2);
  assert.equal(row.freshness_status, 'fresh');
  assert.equal(row.freshness_age_days, 1);
});
