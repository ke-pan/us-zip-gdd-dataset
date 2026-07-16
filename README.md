# U.S. ZIP/ZCTA Growing Degree Days Dataset

This repository is the public data and reproducibility record for the
[WhenToApplyPreEmergent ZIP/ZCTA GDD50 dataset](https://whentoapplypreemergent.com/datasets/gdd/).
It documents a nationwide derived data product for U.S. Census ZIP Code
Tabulation Areas (ZCTAs) and includes an executable worked example of the
base-50°F Growing Degree Day calculation and station fallback method.

The dataset is derived from NOAA GHCN-Daily maximum and minimum air-temperature
observations and U.S. Census ZCTA geography. WhenToApplyPreEmergent.com did not
collect the underlying thermometer observations and is not affiliated with
NOAA, the Census Bureau, USPS, or the U.S. government.

## Downloads

- [Canonical dataset record](https://whentoapplypreemergent.com/datasets/gdd/)
- [Latest release manifest](https://data.whentoapplypreemergent.com/gdd/latest.json)
- [Immutable 2026-07-16 record](https://whentoapplypreemergent.com/datasets/gdd/2026-07-16/)
- [CSV](https://data.whentoapplypreemergent.com/gdd/releases/2026-07-16/gdd50-zcta.csv)
- [Parquet](https://data.whentoapplypreemergent.com/gdd/releases/2026-07-16/gdd50-zcta.parquet)
- [Checksums](https://data.whentoapplypreemergent.com/gdd/releases/2026-07-16/checksums.sha256)

The 2026-07-16 release contains 33,642 official Census ZCTAs: 33,622 with a
fresh selected-station result and 20 retained as explicitly unavailable.

The repository Schema preserves the release's field names and types while
clarifying that `state_fips` is assigned after county land-area intersections
are summed by state. The immutable release Schema used shorter wording that
could be read as selecting a single county; the generated values use the
documented state-total method.

## Reproduce the worked example

Node.js 22 or newer and pnpm are required. The repository has no runtime
dependencies.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run reproduce:sample
pnpm run verify
```

The example uses a small GHCN-Daily-format fixture. Its nearest station is
incomplete, so the calculation selects candidate two and produces exactly
36.0 base-50°F degree-days from three complete daily observations. See
[the reproducibility guide](docs/reproducibility.md) for the worked arithmetic
and release checksum verification.

## Repository scope

This public record contains:

- the public field contract and data dictionary;
- source provenance, selection method, formula, QA, and limitations;
- a dependency-free implementation that reproduces a worked calculation;
- a byte-identical copy of the published 2026-07-16 20-row sample;
- machine-readable citation and record metadata;
- automated checks for required files, sample integrity, metadata consistency,
  and common credential patterns.

It does not contain the private website, Cloudflare deployment configuration,
operational credentials, or the full production application repository. Full
national CSV and Parquet files remain on the canonical download service and in
preserved dataset records.

## Citation and rights

The preferred citation is in [CITATION.cff](CITATION.cff). The project's
original data compilation, schema, documentation, and QA metadata are licensed
under CC BY 4.0; upstream U.S. government materials retain their source status.
Source code has separate terms in [CODE-TERMS.txt](CODE-TERMS.txt).

Maintained by Raymond Pan at Offshoot Labs.
