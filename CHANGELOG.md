# Changelog

## 2026-09-24 — Short-gap interpolation in future releases

- Releases dated after 2026-09-24 fill runs of up to five missing TMAX/TMIN days
  by linear interpolation between the observed days on either side before
  accumulating GDD50. Longer runs remain skipped, and `days_with_observations`
  continues to count observed days only. A masked backtest on complete
  2022–2025 station records found a mean absolute error of about 10 GDD50 for a
  filled five-day run, against about 52 GDD50 when the same run is skipped.
- Published releases, including 2026-07-16, are unchanged.

## 2026-07-16 — Initial public record

- Documented the canonical ZIP/ZCTA GDD50 dataset, method, provenance, schema,
  limitations, version policy, and citation.
- Added the byte-identical 20-row sample from immutable release 2026-07-16.
- Added an executable NOAA-format worked example covering incomplete nearest
  station data, fallback selection, Fahrenheit conversion, and GDD50
  accumulation.
- Added automated public-record, sample-integrity, and credential-pattern checks.
- Preserved a byte-identical copy of the immutable release Schema and documented
  its `state_fips` wording issue separately in the release errata.
- Published the preserved dataset record on Zenodo under
  [doi:10.5281/zenodo.21465487](https://doi.org/10.5281/zenodo.21465487).
- Synchronized the official creator identity as PAN, KE with the public record.
