import { useEffect, useState } from "react";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export default function FilterBar({ localities, filters, onChange }) {
  // Local text-input state so keystrokes feel instant; the debounced
  // value is what actually triggers re-filtering, so a fast typist
  // doesn't refilter on every character.
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");
  const debouncedMin = useDebouncedValue(minPriceInput, 300);
  const debouncedMax = useDebouncedValue(maxPriceInput, 300);

  useEffect(() => {
    if (debouncedMin !== (filters.minPrice || "") || debouncedMax !== (filters.maxPrice || "")) {
      onChange({ ...filters, minPrice: debouncedMin, maxPrice: debouncedMax });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  function setImmediate(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function clearAll() {
    setMinPriceInput("");
    setMaxPriceInput("");
    onChange({});
  }

  return (
    <div className="filter-bar">
      <select value={filters.locality || ""} onChange={(e) => setImmediate("locality", e.target.value)}>
        <option value="">All localities</option>
        {localities.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>

      <select value={filters.bhk || ""} onChange={(e) => setImmediate("bhk", e.target.value)}>
        <option value="">Any BHK</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n} BHK</option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Min price"
        value={minPriceInput}
        onChange={(e) => setMinPriceInput(e.target.value)}
      />
      <input
        type="number"
        placeholder="Max price"
        value={maxPriceInput}
        onChange={(e) => setMaxPriceInput(e.target.value)}
      />

      <select value={filters.furnishing || ""} onChange={(e) => setImmediate("furnishing", e.target.value)}>
        <option value="">Any furnishing</option>
        <option value="unfurnished">Unfurnished</option>
        <option value="semi-furnished">Semi-furnished</option>
        <option value="fully-furnished">Fully-furnished</option>
      </select>

      <button className="btn-text" onClick={clearAll}>Clear</button>
    </div>
  );
}
