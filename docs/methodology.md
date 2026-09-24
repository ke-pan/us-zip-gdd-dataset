# Methodology

## Product boundary

The release is a derived base-50°F Growing Degree Days data product for U.S.
Census ZIP Code Tabulation Areas in the 50 states and District of Columbia.
ZCTAs are generalized statistical areas, not USPS mail-delivery routes; the
dataset must not be used for address validation or delivery-area boundaries.

Modeled soil temperature is not included.

## Source data

- NOAA GHCN-Daily provides source-year TMAX/TMIN observations and station
  metadata.
- The 2023 U.S. Census ZCTA Gazetteer provides representative coordinates.
- The 2020 ZCTA-to-county relationship file supplies state intersections. A
  ZCTA crossing multiple states is assigned to the state with the largest
  summed land-area share across its intersecting counties.

Source vintage and URLs are recorded in every release's `metadata.json`.

## Station selection

For every official ZCTA representative point, active U.S. GHCN-Daily stations
are ordered by Haversine distance. The first of eight candidates with complete
and fresh source-year daily TMAX and TMIN pairs is selected. The selected
station, distance, 1-based fallback rank, candidate count, observation dates,
and day count are published.

If no candidate has fresh usable observations, the official ZCTA remains in
the public table with measurement fields set to null and a machine-readable
`unavailable_reason`.

## GDD50 calculation

Temperatures in the GHCN-Daily yearly file are tenths of degrees Celsius. They
are converted to Fahrenheit before calculation. Quality-flagged observations,
the `-9999` missing-value sentinel, and dates lacking either TMAX or TMIN are
skipped.

Releases dated after 2026-09-24 fill short gaps before accumulation: a run of
up to five missing days with an observed day on both sides receives TMAX and
TMIN values interpolated linearly, and separately, between those two days.
Longer runs, and runs at the start or end of the source-year record, stay
skipped. `days_with_observations` still counts observed days only. The
2026-07-16 sample and its worked reproduction predate this change.

For every complete day:

```text
daily GDD50 = max(0, (TMAX°F + TMIN°F) / 2 - 50°F)
```

Daily contributions accumulate from January 1 of the source year and are
rounded to one decimal place after summation.

## Freshness and releases

The pipeline runs daily, while individual NOAA stations may report several days
behind current weather. A selected observation is accepted only within the
release's `freshness_max_lag_days`. Observation coverage and publication time
are separate metadata.

Every dated release is immutable. Generation writes and verifies CSV, Parquet,
schemas, metadata, citation, terms, sample, state summary, and SHA-256 checksums
before switching the small latest manifest. Failed generation or verification
leaves the previously active release available.
