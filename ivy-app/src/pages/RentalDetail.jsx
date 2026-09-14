import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api/client";
import { getBedroomCount, getSuperBuiltUpArea } from "../api/client";
import { formatINR } from "../components/ListingRow";

export default function RentalDetail() {
  const { listingId } = useParams();
  const [rental, setRental] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRental(null);
    setError(null);
    api.fetchRental(listingId).then(setRental).catch((e) => setError(e.message));
  }, [listingId]);

  if (error) return <div className="page-state page-state-error">Couldn't load this rental: {error}</div>;
  if (!rental) return <div className="page-state">Loading…</div>;

  const bedrooms = getBedroomCount(rental);
  const superArea = getSuperBuiltUpArea(rental);

  return (
    <div className="page detail-page">
      <Link to="/rentals" className="btn-text">← Back to rentals</Link>

      <div className="detail-header">
        <div>
          <h1>{rental.apartment_name}</h1>
          <p className="detail-locality">{rental.locality}</p>
        </div>
        <div className="detail-price">
          <span className="num">{formatINR(rental.price)}</span>
          <span className="listing-row-price-label">/month</span>
        </div>
      </div>

      <dl className="detail-facts">
        <div><dt>Bedrooms</dt><dd className="num">{bedrooms ?? "—"}</dd></div>
        <div><dt>Bathrooms</dt><dd className="num">{rental.bathroom ?? "—"}</dd></div>
        <div><dt>Carpet area</dt><dd className="num">{rental.carpet_area ? `${rental.carpet_area.toLocaleString("en-IN")} sqft` : "—"}</dd></div>
        <div><dt>Super built-up area</dt><dd className="num">{superArea ? `${superArea.toLocaleString("en-IN")} sqft` : "—"}</dd></div>
        <div><dt>Deposit</dt><dd className="num">{formatINR(rental.deposit)}</dd></div>
        <div><dt>Maintenance</dt><dd className="num">{rental.maintenance ? formatINR(rental.maintenance) + "/mo" : "—"}</dd></div>
        <div><dt>Furnishing</dt><dd>{rental.furnishing ?? "—"}</dd></div>
        <div><dt>Posted</dt><dd>{rental.posted_at ? new Date(rental.posted_at).toLocaleDateString("en-IN") : "—"}</dd></div>
      </dl>

      {rental.description && <p className="detail-description">{rental.description}</p>}

      <div className="detail-contact">
        <h2>Contact</h2>
        <p>{rental.posted_by_name} ({rental.posted_by})</p>
        {rental.posted_by_contact && <p className="num">{rental.posted_by_contact}</p>}
      </div>
    </div>
  );
}
