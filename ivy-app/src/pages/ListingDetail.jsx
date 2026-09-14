import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api/client";
import { getBedroomCount, getSuperBuiltUpArea } from "../api/client";
import { formatINR } from "../components/ListingRow";
import { useFavourites } from "../context/FavouritesContext";

export default function ListingDetail() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState(null);
  const { isFavourite, toggleFavourite, pendingIds } = useFavourites();

  useEffect(() => {
    setListing(null);
    setError(null);

    // Fetch from all listings to avoid the broken /v1/listing/{id} endpoint
    api
      .fetchAllListings()
      .then((all) => {
        const found = all.find((item) => item.listing_id === listingId);
        if (found) {
          setListing(found);
        } else {
          setError(`Listing ${listingId} not found in current collection`);
        }
      })
      .catch((e) => setError(e.message));

    // Safely attempt similar listings, fallback to empty array
    api
      .fetchSimilarListings(listingId)
      .then((data) => setSimilar(data.results || data || []))
      .catch(() => setSimilar([]));
  }, [listingId]);

  if (error) {
    return (
      <div className="page-state page-state-error">
        Couldn't load this listing: {error}
      </div>
    );
  }

  if (!listing) return <div className="page-state">Loading…</div>;

  const bedrooms = getBedroomCount(listing);
  const superArea = getSuperBuiltUpArea(listing);
  const saved = isFavourite(listing.listing_id);
  const isPending = pendingIds?.has(listing.listing_id);

  return (
    <div className="page detail-page">
      <Link to="/listings" className="btn-text">
        ← Back to listings
      </Link>

      <div className="detail-header">
        <div>
          <h1>{listing.apartment_name}</h1>
          <p className="detail-locality">{listing.locality}</p>
        </div>
        <div className="detail-price">
          <span className="num">{formatINR(listing.price)}</span>
          {listing.is_verified && (
            <span className="badge-verified">Verified</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", margin: "16px 0" }}>
        <button
          className={saved ? "btn-secondary" : "btn-primary"}
          onClick={() => toggleFavourite(listing)}
          disabled={isPending}
        >
          {saved ? "♥ Saved" : "♡ Save this listing"}
        </button>

        {listing.listing_url && (
          <a
            href={listing.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Visit source ({listing.website || "original"}) ↗
          </a>
        )}
      </div>

      <dl className="detail-facts">
        <div>
          <dt>Bedrooms</dt>
          <dd className="num">{bedrooms ?? "—"}</dd>
        </div>
        <div>
          <dt>Bathrooms</dt>
          <dd className="num">{listing.bathroom ?? "—"}</dd>
        </div>
        <div>
          <dt>Carpet area</dt>
          <dd className="num">
            {listing.carpet_area
              ? `${listing.carpet_area.toLocaleString("en-IN")} sqft`
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Super built-up area</dt>
          <dd className="num">
            {superArea ? `${superArea.toLocaleString("en-IN")} sqft` : "—"}
          </dd>
        </div>
        <div>
          <dt>Floor</dt>
          <dd className="num">
            {listing.floor ?? "—"}
            {listing.total_floors ? ` of ${listing.total_floors}` : ""}
          </dd>
        </div>
        <div>
          <dt>Furnishing</dt>
          <dd>{listing.furnishing ?? "—"}</dd>
        </div>
        <div>
          <dt>Facing</dt>
          <dd>{listing.facing_direction ?? "—"}</dd>
        </div>
        <div>
          <dt>Posted</dt>
          <dd>
            {listing.posted_at
              ? new Date(listing.posted_at).toLocaleDateString("en-IN")
              : "—"}
          </dd>
        </div>
      </dl>

      {listing.description && (
        <p className="detail-description">{listing.description}</p>
      )}

      <div className="detail-contact">
        <h2>Contact</h2>
        <p>
          {listing.posted_by_name} ({listing.posted_by})
        </p>
        {listing.posted_by_contact && (
          <p className="num">{listing.posted_by_contact}</p>
        )}
      </div>

      {similar.length > 0 && (
        <div className="similar-section">
          <h2>Similar listings</h2>
          <div className="listing-list">
            {similar.map((s) => (
              <ListingRow key={s.listing_id} listing={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListingRow({ listing }) {
  // Uses canonical external listing_url directly instead of generating broken routes
  return (
    <a
      href={listing.listing_url || `/listings/${listing.listing_id}`}
      target={listing.listing_url ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="listing-row"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="listing-row-main">
        <h3 className="listing-row-title">{listing.apartment_name}</h3>
        <p className="listing-row-meta">{listing.locality}</p>
      </div>
      <div className="listing-row-price">
        <span className="num">{formatINR(listing.price)}</span>
      </div>
    </a>
  );
}