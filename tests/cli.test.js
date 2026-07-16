import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);

test('sample reproduction command emits the documented public CSV row', async () => {
  const script = new URL('../scripts/reproduce-sample.js', import.meta.url);
  const { stdout } = await execFileAsync(process.execPath, [script.pathname]);

  assert.equal(stdout, [
    'zcta5,state_fips,state_code,centroid_latitude_degrees,centroid_longitude_degrees,gdd_base_f,accumulation_start_date,observation_start_date,observation_end_date,days_with_observations,cumulative_gdd_f_degree_days,station_id,station_distance_km,fallback_rank,station_candidate_count,freshness_status,freshness_age_days,freshness_max_lag_days,data_available,unavailable_reason',
    '99999,25,MA,42.1,-72.6,50,2026-01-01,2026-01-01,2026-01-03,3,36,USW00000002,4.8,2,2,fresh,2,7,true,',
    '',
  ].join('\n'));
});
