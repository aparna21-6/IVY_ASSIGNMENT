import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { distinctValues } from "../lib/analysis";
import { formatINR } from "../components/ListingRow";

export default function Projects() {
  const { projects, loading, error, loadAll } = useData();
  const [status, setStatus] = useState("");

  useEffect(() => { loadAll(); }, [loadAll]);

  const statuses = useMemo(() => (projects ? distinctValues(projects, "project_status") : []), [projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    const base = status ? projects.filter((p) => p.project_status === status) : projects;
    return [...base].sort((a, b) => (a.apartment_name || "").localeCompare(b.apartment_name || ""));
  }, [projects, status]);

  if (loading || !projects) return <div className="page-state">Loading projects…</div>;
  if (error) return <div className="page-state page-state-error">Couldn't load projects: {error}</div>;

  return (
    <div className="page">
      <div className="page-header"><h1>Builder projects</h1></div>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <p className="result-count">{filtered.length} projects</p>

      <div className="listing-list">
        {filtered.map((p, i) => (
          <Link key={`${p.project_id}-${i}`} to={`/projects/${p.project_id}`} className="listing-row">
            <div className="listing-row-main">
              <h3 className="listing-row-title">{p.apartment_name}</h3>
              <p className="listing-row-meta">{p.developer_name} · {p.locality} · {p.project_status} · {p.total_listings} listings</p>
            </div>
            <div className="listing-row-price">
              <span className="num">{formatINR(p.price_min)} – {formatINR(p.price_max)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
