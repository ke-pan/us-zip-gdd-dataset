# Data dictionary

The primary CSV and Parquet distributions contain one row per official Census
ZCTA. CSV uses an empty cell for null; Parquet preserves typed nulls.

| Field | Type | Meaning |
| --- | --- | --- |
| `zcta5` | string | Five-character Census ZCTA code; not a USPS delivery boundary. |
| `state_fips` | string | Two-character state FIPS code selected by largest land-area share. |
| `state_code` | string | Two-letter state or District of Columbia abbreviation. |
| `centroid_latitude_degrees` | number | Census Gazetteer representative latitude. |
| `centroid_longitude_degrees` | number | Census Gazetteer representative longitude. |
| `gdd_base_f` | integer | Fahrenheit base temperature; always 50 in this product. |
| `accumulation_start_date` | date | January 1 of `source_year`. |
| `observation_start_date` | date/null | First complete selected-station TMAX/TMIN date. |
| `observation_end_date` | date/null | Last complete selected-station TMAX/TMIN date. |
| `days_with_observations` | integer/null | Complete daily pairs included in accumulation. |
| `cumulative_gdd_f_degree_days` | number/null | Accumulated base-50°F degree-days. |
| `station_id` | string/null | Selected GHCN-Daily station identifier. |
| `station_distance_km` | number/null | Haversine distance from ZCTA point to station. |
| `fallback_rank` | integer/null | Selected station's 1-based distance rank. |
| `station_candidate_count` | integer | Maximum nearby stations considered. |
| `freshness_status` | string | `fresh`, `stale`, or `unavailable`. Published available rows are fresh. |
| `freshness_age_days` | integer/null | UTC days from observation end to generation. |
| `freshness_max_lag_days` | integer | Maximum accepted observation lag. |
| `data_available` | boolean | Whether a fresh selected-station GDD value exists. |
| `unavailable_reason` | string/null | `no_recent_station_data` or `no_station_data`. |

The supporting `state-summary.csv` contains counts of total, available,
unavailable, direct-station, and fallback-station ZCTAs plus minimum, median,
mean, and maximum GDD50 and the latest observation date for each state/DC.
