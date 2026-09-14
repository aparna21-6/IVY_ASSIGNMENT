import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import * as api from "../api/client";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const { user } = useAuth();
  const { listings } = useData();

  // Raw list of IDs/records returned by the server
  const [rawFavourites, setRawFavourites] = useState([]);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [error, setError] = useState(null);

  // Refresh favorites from the backend
  const refresh = useCallback(async () => {
    if (!user) {
      setRawFavourites([]);
      return;
    }
    try {
      setError(null);
      const data = await api.fetchFavourites();
      const list = Array.isArray(data) ? data : data?.results || [];
      setRawFavourites(list);
    } catch (e) {
      console.warn("[Favourites] Could not refresh favourites:", e.message);
      setError(e.message);
      setRawFavourites([]);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Helper to extract clean string ID
  const extractId = useCallback((target) => {
    if (!target) return null;
    if (typeof target === "string") return target;
    return target.listing_id || target.id || null;
  }, []);

  // Set of active favourite IDs for O(1) lookups
  const favouriteIds = useMemo(() => {
    const ids = new Set();
    for (const item of rawFavourites) {
      const id = extractId(item);
      if (id) ids.add(id);
    }
    return ids;
  }, [rawFavourites, extractId]);

  // Hydrate full listing objects if available in DataContext, else fall back to raw items
  const hydratedFavourites = useMemo(() => {
    if (!favouriteIds.size) return [];
    if (!listings || !listings.length) return rawFavourites;

    const listingMap = new Map(listings.map((l) => [l.listing_id, l]));
    return Array.from(favouriteIds).map((id) => listingMap.get(id) || { listing_id: id });
  }, [favouriteIds, listings, rawFavourites]);

  const isFavourite = useCallback(
    (target) => {
      const id = extractId(target);
      return id ? favouriteIds.has(id) : false;
    },
    [extractId, favouriteIds]
  );

  const toggleFavourite = useCallback(
    async (target) => {
      const id = extractId(target);
      if (!id) return;

      // Add to pending set so button disables properly
      setPendingIds((prev) => new Set(prev).add(id));

      const currentlySaved = favouriteIds.has(id);

      // Optimistic local update so UI reflects the click immediately
      setRawFavourites((prev) => {
        if (currentlySaved) {
          return prev.filter((item) => extractId(item) !== id);
        } else {
          return [...prev, typeof target === "object" ? target : { listing_id: id }];
        }
      });

      try {
        if (currentlySaved) {
          await api.removeFavourite(id);
        } else {
          await api.addFavourite(id);
        }
        await refresh();
      } catch (err) {
        console.error(`Failed to toggle favourite for ${id}:`, err);
        // Rollback on error
        await refresh();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [extractId, favouriteIds, refresh]
  );

  return (
    <FavouritesContext.Provider
      value={{
        favourites: hydratedFavourites,
        favouriteIds,
        isFavourite,
        toggleFavourite,
        pendingIds,
        pending: pendingIds.size > 0,
        error,
        refresh,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}