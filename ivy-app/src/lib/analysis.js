import { getSuperBuiltUpArea, getBedroomCount } from "../api/client";

export function filterListings(listings, { locality, bhk, propertyType, minPrice, maxPrice, furnishing }) {
  const result = listings.filter((l) => {
    if (locality && String(l.locality).trim().toLowerCase() !== String(locality).trim().toLowerCase()) return false;
    if (bhk !== undefined && bhk !== null && bhk !== "") {
      const recordBhk = getBedroomCount(l);
      // Guard against a record where the bedroom field is missing entirely
      // (undefined/null) rather than genuinely zero — treat missing as
      // "doesn't match" but log it once so it's visible in the console
      // rather than silently passing or failing.
      if (recordBhk === null || recordBhk === undefined || Number.isNaN(Number(recordBhk))) return false;
      if (Number(recordBhk) !== Number(bhk)) return false;
    }
    if (propertyType && l.property_type !== propertyType) return false;
    if (minPrice !== undefined && minPrice !== null && minPrice !== "" && Number(l.price) < Number(minPrice)) return false;
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "" && Number(l.price) > Number(maxPrice)) return false;
    if (furnishing && l.furnishing !== furnishing) return false;
    return true;
  });

  // eslint-disable-next-line no-console
  console.debug("[filterListings]", { locality, bhk, propertyType, minPrice, maxPrice, furnishing }, "->", result.length, "of", listings.length);

  return result;
}

export function sortRecords(records, sortBy, order = "asc") {
  if (!sortBy) return records;
  const dir = order === "desc" ? -1 : 1;
  return [...records].sort((a, b) => {
    const av = sortBy === "bedroom" ? getBedroomCount(a) : a[sortBy];
    const bv = sortBy === "bedroom" ? getBedroomCount(b) : b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "string") return dir * av.localeCompare(bv);
    return dir * (av - bv);
  });
}

export function paginate(records, page, pageSize) {
  const start = (page - 1) * pageSize;
  return records.slice(start, start + pageSize);
}

export function distinctValues(records, field) {
  return [...new Set(records.map((r) => r[field]).filter(Boolean))].sort();
}

export function findImpossibleAreaListings(listings) {
  return listings.filter((l) => {
    const superArea = getSuperBuiltUpArea(l);
    return superArea != null && l.carpet_area != null && l.carpet_area > superArea;
  });
}

export function findDuplicatePhoneNumbers(listings) {
  const byPhone = new Map();
  for (const l of listings) {
    const phone = l.posted_by_contact;
    if (!phone) continue;
    if (!byPhone.has(phone)) byPhone.set(phone, []);
    byPhone.get(phone).push(l.listing_id);
  }
  return [...byPhone.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([phone, ids]) => ({ phone, listing_ids: ids }));
}

export function computeMedianPricePerSqft(listings) {
  const values = listings
    .map((l) => (l.carpet_area ? l.price / l.carpet_area : null))
    .filter((v) => v != null && isFinite(v))
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

export function findDuplicateIds(records, idField = "listing_id") {
  const seen = new Map();
  for (const r of records) {
    const id = r[idField];
    if (id == null) continue;
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
}

export function groupCountBy(records, field) {
  const counts = new Map();
  for (const r of records) {
    const key = r[field] ?? "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}
