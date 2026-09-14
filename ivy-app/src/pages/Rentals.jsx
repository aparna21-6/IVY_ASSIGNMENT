import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { getBedroomCount, getSuperBuiltUpArea } from "../api/client";
import { distinctValues, paginate, sortRecords } from "../lib/analysis";
import { formatINR } from "../components/ListingRow";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 20;

export default function Rentals() {
  const { rentals, loading, error, loadAll } = useData();
  const [locality, setLocality] = useState("");
  const [bhk, setBhk] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { loadAll(); }, [loadAll]);

  const localities = useMemo(() => (rentals ? distinctValues(rentals, "locality") : []), [rentals]);

  const filtered = useMemo(() => {
    if (!rentals) return [];
    let base = rentals;
    if (locality) base = base.filter((r) => r.locality === locality);
    if (bhk) base = base.filter((r) => Number(getBedroomCount(r)) === Number(bhk));
    return sortRecords(base, "posted_at", "desc");
  }, [rentals, locality, bhk]);

  const pageItems = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  if (loading || !rentals) return <div className="page-state">Loading rentals…</div>;
  if (error) return <div className="page-state page-state-error">Couldn't load rentals: {error}</div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Rentals</h1></div>

      <div className="filter-bar">
        <select value={locality} onChange={(e) => { setLocality(e.target.value); setPage(1); }}>
          <option value="">All localities</option>
          {localities.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={bhk} onChange={(e) => { setBhk(e.target.value); setPage(1); }}>
          <option value="">Any BHK</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} BHK</option>)}
        </select>
      </div>

      <p className="result-count">{filtered.length} matching rentals</p>

      <div className="listing-list">
        {pageItems.map((r, i) => {
          const bedrooms = getBedroomCount(r);
          const area = r.carpet_area ?? getSuperBuiltUpArea(r);
          return (
            <Link key={`${r.listing_id}-${(page - 1) * PAGE_SIZE + i}`} to={`/rentals/${r.listing_id}`} className="listing-row">
              <div className="listing-row-main">
                <h3 className="listing-row-title">{r.apartment_name}</h3>
                <p className="listing-row-meta">
                  {r.locality}{bedrooms ? ` · ${bedrooms} BHK` : ""}{area ? ` · ${area.toLocaleString("en-IN")} sqft` : ""}
                </p>
              </div>
              <div className="listing-row-price">
                <span className="num">{formatINR(r.price)}</span>
                <span className="listing-row-price-label">/month</span>
              </div>
            </Link>
          );
        })}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
