import { Link } from "react-router-dom";
import { getBedroomCount, getSuperBuiltUpArea } from "../api/client";
import { useFavourites } from "../context/FavouritesContext";

export function formatINR(n) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ListingRow({ listing, priceLabel = "", showSave = true }) {
  const { isFavourite, toggleFavourite, pendingIds, lastError } = useFavourites();
  const bedrooms = getBedroomCount(listing);
  const area = listing.carpet_area ?? getSuperBuiltUpArea(listing);
  const saved = isFavourite(listing.listing_id);
  const isPending = pendingIds.has(listing.listing_id);
  const failed = lastError?.listingId === listing.listing_id;

  return (
    <div className="listing-row">
      <Link to={`/listings/${listing.listing_id}`} className="listing-row-link">
        <div className="listing-row-main">
          <h3 className="listing-row-title">{listing.apartment_name || "Untitled property"}</h3>
          <p className="listing-row-meta">
            {listing.locality}
            {bedrooms ? ` · ${bedrooms} BHK` : ""}
            {listing.furnishing ? ` · ${listing.furnishing}` : ""}
            {area ? ` · ${area.toLocaleString("en-IN")} sqft` : ""}
          </p>
        </div>
      </Link>
      <div className="listing-row-side">
        <div className="listing-row-price">
          <span className="num">{formatINR(listing.price)}</span>
          {priceLabel && <span className="listing-row-price-label">{priceLabel}</span>}
        </div>
        {showSave && (
          <div className="save-toggle-wrap">
            <button
              className={`save-toggle ${saved ? "save-toggle-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                toggleFavourite(listing).catch(() => {});
              }}
              disabled={isPending}
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save listing"}
              title={saved ? "Remove from saved" : "Save listing"}
            >
              {saved ? "♥" : "♡"}
            </button>
            {failed && <span className="save-error" title={lastError.message}>Couldn't save</span>}
          </div>
        )}
      </div>
    </div>
  );
}
