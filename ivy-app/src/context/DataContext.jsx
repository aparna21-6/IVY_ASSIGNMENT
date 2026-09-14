import { createContext, useContext, useState, useCallback, useRef } from "react";
import * as api from "../api/client";

const DataContext = createContext(null);

/**
 * Deduplicates listings and rentals based on the composite key:
 * (locality + floor + apartment_name/title)
 */
function deduplicateProperties(items) {
  if (!items || !Array.isArray(items)) return [];

  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const locality = (item.locality || "").trim().toLowerCase();
    const floor =
      item.floor !== undefined && item.floor !== null
        ? String(item.floor).trim()
        : "na";
    const apartment = (
      item.apartment_name ||
      item.title ||
      ""
    ).trim().toLowerCase();

    const compositeKey = `${locality}|${floor}|${apartment}`;

    if (!seen.has(compositeKey)) {
      seen.add(compositeKey);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Deduplicates projects based on:
 * project_id, falling back to (project_name + locality)
 */
function deduplicateProjects(items) {
  if (!items || !Array.isArray(items)) return [];

  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const projectId = (item.project_id || "").trim().toLowerCase();
    const name = (item.project_name || item.name || "").trim().toLowerCase();
    const locality = (item.locality || "").trim().toLowerCase();

    const compositeKey = projectId ? `id:${projectId}` : `name:${name}|${locality}`;

    if (!seen.has(compositeKey)) {
      seen.add(compositeKey);
      unique.push(item);
    }
  }

  return unique;
}

export function DataProvider({ children }) {
  const [listings, setListings] = useState(null);
  const [rentals, setRentals] = useState(null);
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  const loadAll = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const [l, r, p] = await Promise.all([
        api.fetchAllListings(),
        api.fetchAllRentals(),
        api.fetchAllProjects(),
      ]);

      // Deduplicate datasets prior to setting state
      setListings(deduplicateProperties(l));
      setRentals(deduplicateProperties(r));
      setProjects(deduplicateProjects(p));
    } catch (e) {
      setError(e.message);
      fetchedRef.current = false; // allow retry on error
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider
      value={{ listings, rentals, projects, loading, error, loadAll }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}