# Limitations

- ZCTAs approximate populated ZIP-code geography; they are not USPS delivery
  routes and exclude PO Box-only ZIPs without an official ZCTA.
- A single Census representative point and selected weather station cannot
  describe every microclimate within a ZCTA. Elevation, coastlines, urban heat,
  shade, slope, snow, and local moisture can create meaningful differences.
- GDD50 uses observed air temperature. It is not a direct soil-temperature
  measurement and the dataset contains no modeled soil-temperature field.
- Missing or quality-flagged TMAX/TMIN observations are skipped. The day count
  and observation dates show the actual accumulation coverage.
- Nearby-station fallback improves availability but can select a more distant
  station. Consumers should review `station_distance_km` and `fallback_rank`.
- The daily pipeline can be current while the newest station observation is
  several days old. Use observation dates and freshness fields for time-sensitive
  analysis.
- Puerto Rico and other U.S. territories are excluded from the initial release.
- GDD is a heat-accumulation index, not a universal treatment prescription.
  Biological thresholds vary by species, model, site conditions, and management
  objective.
- The data are provided as-is. Review the source metadata, method, checksums,
  and applicable product labels or local extension guidance before decisions.
