# Reproducibility guide

## Worked example

Run:

```bash
pnpm run reproduce:sample
```

The fixture's closest candidate (`USW00000001`) has no complete TMAX/TMIN day,
so the method selects candidate two (`USW00000002`). GHCN values are tenths of
degrees Celsius:

| Date | TMAX | TMIN | Fahrenheit mean | Daily GDD50 |
| --- | ---: | ---: | ---: | ---: |
| 2026-01-01 | 20°C | 10°C | 59°F | 9 |
| 2026-01-02 | 10°C | 0°C | 41°F | 0 |
| 2026-01-03 | 30°C | 20°C | 77°F | 27 |

The independently worked result is `9 + 0 + 27 = 36` degree-days. The command
emits a row in the public 20-field contract with `fallback_rank=2`.

## Verify the preserved sample

`examples/release-2026-07-16-sample.csv` is a byte-identical copy of the
published sample. Its SHA-256 is pinned in `metadata/record.json` and checked by:

```bash
pnpm run verify
```

## Verify a complete immutable release

Download every file listed by the immutable release's `checksums.sha256` into
one directory, then use the platform SHA-256 checker:

```bash
shasum -a 256 -c checksums.sha256
```

The canonical release also validates CSV/Parquet row parity, column names,
schema alignment, unique and sorted ZCTAs, state-summary counts, freshness,
required-file coverage, and remote object bytes before publication.

## Scope of this repository

The executable example reproduces the scientific calculation and fallback seam
from raw GHCN-Daily-format observations. The nationwide build additionally
downloads the configured NOAA source-year file and Census geography, constructs
eight-station Haversine mappings for every official ZCTA, applies the same
calculation, and writes the documented release contract. Operational website,
storage, and deployment code are deliberately outside this public record.
