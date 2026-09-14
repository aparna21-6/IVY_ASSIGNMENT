import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  findImpossibleAreaListings,
  findDuplicatePhoneNumbers,
  findDuplicateIds,
  computeMedianPricePerSqft,
  groupCountBy,
  distinctValues,
  filterListings,
} from "../lib/analysis";
import { formatINR } from "../components/ListingRow";
import FilterBar from "../components/FilterBar";

export default function Insights() {
  const { listings, projects, loading, loadAll } = useData();
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Distinct localities derived from the complete listings dataset
  const localities = useMemo(
    () => (listings ? distinctValues(listings, "locality") : []),
    [listings]
  );

  // Apply the active filters to the listings dataset
  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return filterListings(listings, filters);
  }, [listings, filters]);

  // Recompute statistics against the filtered subset
  const impossibleArea = useMemo(
    () => (filteredListings ? findImpossibleAreaListings(filteredListings) : []),
    [filteredListings]
  );
  const dupPhones = useMemo(
    () => (filteredListings ? findDuplicatePhoneNumbers(filteredListings) : []),
    [filteredListings]
  );
  const dupIds = useMemo(
    () => (filteredListings ? findDuplicateIds(filteredListings) : []),
    [filteredListings]
  );
  const medianPsf = useMemo(
    () => (filteredListings ? computeMedianPricePerSqft(filteredListings) : null),
    [filteredListings]
  );
  const byLocality = useMemo(
    () => (filteredListings ? groupCountBy(filteredListings, "locality") : []),
    [filteredListings]
  );

  const medianPrice = useMemo(() => {
    if (!filteredListings || filteredListings.length === 0) return null;
    const sorted = filteredListings
      .map((l) => l.price)
      .filter((p) => typeof p === "number" && !isNaN(p))
      .sort((a, b) => a - b);
    if (sorted.length === 0) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }, [filteredListings]);

  const projectMismatches = useMemo(() => {
    if (!projects || !filteredListings) return [];
    return projects.filter(
      (p) =>
        filteredListings.filter((l) => l.project_id === p.project_id).length !==
        p.total_listings
    );
  }, [projects, filteredListings]);

  if (loading && !listings) {
    return <div className="page-state">Loading dataset…</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Insights</h1>
      </div>

      <FilterBar
        localities={localities}
        filters={filters}
        onChange={setFilters}
      />
      <p className="result-count">
        Analyzing {filteredListings.length} matching listings
        {listings && ` (out of ${listings.length} total)`}
      </p>

      <section className="insights-section">
        <h2>Dataset Summary</h2>
        <p className="insights-note">
          Computed from matching filtered records.
        </p>
        <div className="stat-grid">
          <Stat
            label="Listings analyzed"
            value={filteredListings.length}
            numeric
          />
          <Stat
            label="Median price"
            value={medianPrice ? formatINR(medianPrice) : "—"}
          />
          <Stat
            label="Median ₹/sqft (carpet area)"
            value={medianPsf ? medianPsf.toFixed(2) : "—"}
            numeric
          />
          <Stat
            label="Projects with count mismatch"
            value={projectMismatches.length}
            numeric
          />
        </div>
      </section>

      <section className="insights-section">
        <h2>By locality</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Locality</th>
              <th>Listings</th>
            </tr>
          </thead>
          <tbody>
            {byLocality.slice(0, 15).map((row) => (
              <tr key={row.key}>
                <td>{row.key}</td>
                <td className="num">{row.count}</td>
              </tr>
            ))}
            {byLocality.length === 0 && (
              <tr>
                <td colSpan={2} className="empty-state">
                  No listings match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="insights-section">
        <h2>Data-quality flags</h2>
        <p className="insights-note">
          Heuristics — verify by hand before reporting as a finding.
        </p>

        <h3>Repeated listing_id within the filtered set ({dupIds.length})</h3>
        {dupIds.length > 0 ? (
          <ul className="flag-list">
            {dupIds.slice(0, 10).map((d) => (
              <li key={d.id}>
                {d.id} — appears {d.count} times
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">None found.</p>
        )}

        <h3>Carpet area exceeds super built-up area ({impossibleArea.length})</h3>
        {impossibleArea.length > 0 ? (
          <ul className="flag-list">
            {impossibleArea.slice(0, 10).map((l) => (
              <li key={l.listing_id}>{l.listing_id}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">None found.</p>
        )}

        <h3>Contact numbers reused across multiple listings ({dupPhones.length})</h3>
        {dupPhones.length > 0 ? (
          <ul className="flag-list">
            {dupPhones.slice(0, 10).map((d) => (
              <li key={d.phone}>
                {d.phone} — {d.listing_ids.length} listings
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">None found.</p>
        )}

        <h3>Projects where reported listing count is wrong ({projectMismatches.length})</h3>
        {projectMismatches.length > 0 ? (
          <ul className="flag-list">
            {projectMismatches.slice(0, 10).map((p) => (
              <li key={p.project_id}>
                {p.project_id} — reports {p.total_listings}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">None found.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, numeric }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={numeric ? "stat-value num" : "stat-value"}>
        {value ?? "—"}
      </span>
    </div>
  );
}