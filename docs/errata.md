# Errata

## 2026-07-16 Schema wording

The frozen `schema/gdd50-zcta.schema.json` description for `state_fips` says the
value is assigned from the county containing the largest share of ZCTA land
area. The release pipeline actually sums all county land-area intersections by
state, then assigns the state with the greatest total share, as documented in
the methodology.

This is a documentation wording issue only. It does not change the released
field, type, computation, or values. The Schema remains byte-identical to the
immutable 2026-07-16 release; consumers should use this erratum and
`docs/methodology.md` as the clarification.
