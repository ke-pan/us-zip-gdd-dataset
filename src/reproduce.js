const GDD_BASE_F = 50;

export const PUBLIC_FIELDS = [
  'zcta5',
  'state_fips',
  'state_code',
  'centroid_latitude_degrees',
  'centroid_longitude_degrees',
  'gdd_base_f',
  'accumulation_start_date',
  'observation_start_date',
  'observation_end_date',
  'days_with_observations',
  'cumulative_gdd_f_degree_days',
  'station_id',
  'station_distance_km',
  'fallback_rank',
  'station_candidate_count',
  'freshness_status',
  'freshness_age_days',
  'freshness_max_lag_days',
  'data_available',
  'unavailable_reason',
];

function roundOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function tenthsCelsiusToFahrenheit(value) {
  return (value / 10) * 9 / 5 + 32;
}

function parseDate(value) {
  if (!/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function daysBetween(start, end) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  return Math.floor((endMs - startMs) / 86_400_000);
}

export function parseNoaaObservations(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const column = Object.fromEntries(headers.map((name, index) => [name, index]));
  const required = ['STATION', 'DATE', 'ELEMENT', 'VALUE', 'QFLAG'];
  if (required.some((name) => column[name] == null)) {
    throw new Error('NOAA observations are missing required GHCN-Daily columns.');
  }

  const stations = new Map();
  for (const line of lines) {
    if (!line) continue;
    const fields = line.split(',');
    const stationId = fields[column.STATION]?.trim();
    const date = fields[column.DATE]?.trim();
    const element = fields[column.ELEMENT]?.trim();
    const value = Number(fields[column.VALUE]);
    const qualityFlag = fields[column.QFLAG]?.trim();

    if (!stationId?.startsWith('US')) continue;
    if (!/^\d{8}$/.test(date)) continue;
    if (element !== 'TMAX' && element !== 'TMIN') continue;
    if (!Number.isFinite(value) || value === -9999 || qualityFlag) continue;

    if (!stations.has(stationId)) stations.set(stationId, new Map());
    const dates = stations.get(stationId);
    if (!dates.has(date)) dates.set(date, {});
    dates.get(date)[element.toLowerCase()] = value;
  }

  return stations;
}

export function summarizeStation(dates, sourceYear) {
  const completeDays = [...dates.entries()]
    .filter(([date, values]) => (
      date.startsWith(String(sourceYear))
      && values.tmax != null
      && values.tmin != null
    ))
    .sort(([first], [second]) => first.localeCompare(second));

  if (completeDays.length === 0) return null;

  const cumulativeGdd = completeDays.reduce((total, [, values]) => {
    const maximumF = tenthsCelsiusToFahrenheit(values.tmax);
    const minimumF = tenthsCelsiusToFahrenheit(values.tmin);
    return total + Math.max(0, (maximumF + minimumF) / 2 - GDD_BASE_F);
  }, 0);

  return {
    observationStartDate: parseDate(completeDays[0][0]),
    observationEndDate: parseDate(completeDays.at(-1)[0]),
    daysWithObservations: completeDays.length,
    cumulativeGdd: roundOneDecimal(cumulativeGdd),
  };
}

function basePublicRow(zcta5, mapping, sourceYear, maxLagDays) {
  return {
    zcta5,
    state_fips: mapping.state_fips,
    state_code: mapping.state_code,
    centroid_latitude_degrees: mapping.latitude,
    centroid_longitude_degrees: mapping.longitude,
    gdd_base_f: GDD_BASE_F,
    accumulation_start_date: `${sourceYear}-01-01`,
    station_candidate_count: mapping.stations.length,
    freshness_max_lag_days: maxLagDays,
  };
}

export function reproduceRows(observationCsv, zctaStationMap, options) {
  const sourceYear = Number(options?.sourceYear);
  if (!Number.isInteger(sourceYear)) throw new Error('sourceYear is required.');
  const generatedOn = options.generatedOn;
  const maxLagDays = Number(options.maxLagDays ?? 7);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(generatedOn)) {
    throw new Error('generatedOn must be an ISO date.');
  }
  if (!Number.isFinite(maxLagDays) || maxLagDays < 0) {
    throw new Error('maxLagDays must be a non-negative number.');
  }
  const stations = parseNoaaObservations(observationCsv);

  return Object.keys(zctaStationMap).sort().map((zcta5) => {
    const mapping = zctaStationMap[zcta5];
    const baseRow = basePublicRow(zcta5, mapping, sourceYear, maxLagDays);
    let completeStationFound = false;

    for (let index = 0; index < mapping.stations.length; index++) {
      const candidate = mapping.stations[index];
      const dates = stations.get(candidate.id);
      const summary = dates ? summarizeStation(dates, sourceYear) : null;
      if (!summary) continue;
      completeStationFound = true;

      const freshnessAgeDays = daysBetween(summary.observationEndDate, generatedOn);
      if (freshnessAgeDays == null || freshnessAgeDays < 0 || freshnessAgeDays > maxLagDays) {
        continue;
      }

      return {
        ...baseRow,
        observation_start_date: summary.observationStartDate,
        observation_end_date: summary.observationEndDate,
        days_with_observations: summary.daysWithObservations,
        cumulative_gdd_f_degree_days: summary.cumulativeGdd,
        station_id: candidate.id,
        station_distance_km: candidate.distance_km,
        fallback_rank: index + 1,
        freshness_status: 'fresh',
        freshness_age_days: freshnessAgeDays,
        data_available: true,
        unavailable_reason: null,
      };
    }

    return {
      ...baseRow,
      observation_start_date: null,
      observation_end_date: null,
      days_with_observations: null,
      cumulative_gdd_f_degree_days: null,
      station_id: null,
      station_distance_km: null,
      fallback_rank: null,
      freshness_status: 'unavailable',
      freshness_age_days: null,
      data_available: false,
      unavailable_reason: completeStationFound ? 'no_recent_station_data' : 'no_station_data',
    };
  });
}

function csvCell(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function rowsToCsv(rows) {
  return `${[
    PUBLIC_FIELDS.join(','),
    ...rows.map((row) => PUBLIC_FIELDS.map((field) => csvCell(row[field])).join(',')),
  ].join('\n')}\n`;
}
