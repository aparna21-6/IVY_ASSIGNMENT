import ListingRow from "../components/ListingRow";
import { useFavourites } from "../context/FavouritesContext";

export default function Favourites() {
  const { favourites } = useFavourites();

  return (
    <div className="page">
      <div className="page-header"><h1>Saved listings</h1></div>
      <p className="result-count">{favourites.length} saved</p>

      <div className="listing-list">
        {favourites.map((l, i) => <ListingRow key={`${l.listing_id}-${i}`} listing={l} />)}
        {favourites.length === 0 && (
          <p className="empty-state">Nothing saved yet. Tap ♡ on any listing to save it here.</p>
        )}
      </div>
    </div>
  );
}
