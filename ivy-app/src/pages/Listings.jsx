import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { filterListings, sortRecords, paginate, distinctValues } from "../lib/analysis";
import FilterBar from "../components/FilterBar";
import ListingRow from "../components/ListingRow";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 20;

/**
 * Deduplicates listings based on: locality + floor + apartment_name
 * Trims and normalizes strings to lowercase to catch subtle variations.
 */
function deduplicateListings(items) {
  if (!items || !Array.isArray(items)) return [];

  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const locality = (item.locality || "").trim().toLowerCase();
    const floor = item.floor !== undefined && item.floor !== null ? String(item.floor).trim() : "na";
    const apartment = (item.apartment_name || "").trim().toLowerCase();

    const compositeKey = `${locality}|${floor}|${apartment}`;

    if (!seen.has(compositeKey)) {
      seen.add(compositeKey);
      unique.push(item);
    }
  }

  return unique;
}

export default function Listings() {
  const { listings, loading, error, loadAll } = useData();
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("posted_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // 1. Deduplicate by locality + floor + apartment_name
  const uniqueListings = useMemo(() => {
    return deduplicateListings(listings);
  }, [listings]);

  // 2. Compute filter dropdown options from the deduplicated list
  const localities = useMemo(() => {
    return uniqueListings ? distinctValues(uniqueListings, "locality") : [];
  }, [uniqueListings]);

  // 3. Filter and sort over the unique dataset
  const filtered = useMemo(() => {
    if (!uniqueListings) return [];
    return sortRecords(filterListings(uniqueListings, filters), sortBy, order);
  }, [uniqueListings, filters, sortBy, order]);

  // 4. Paginate the resulting unique entries
  const pageItems = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  function handleFilterChange(next) {
    setFilters(next);
    setPage(1);
  }

  if (loading || !listings) return <div className="page-state">Loading listings…</div>;
  if (error) return <div className="page-state page-state-error">Couldn't load listings: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Listings for sale</h1>
        <div className="sort-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="posted_at">Newest</option>
            <option value="price">Price</option>
            <option value="carpet_area">Carpet area</option>
            <option value="bedroom">Bedrooms</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <FilterBar localities={localities} filters={filters} onChange={handleFilterChange} />
      <p className="result-count">
        {filtered.length} unique listings
        {listings && ` (from ${listings.length} raw records)`}
      </p>

      <div className="listing-list">
        {pageItems.map((l, i) => (
          <ListingRow
            key={`${l.listing_id || ""}-${(page - 1) * PAGE_SIZE + i}`}
            listing={l}
          />
        ))}
        {pageItems.length === 0 && (
          <p className="empty-state">No listings match those filters.</p>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}