import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api/client";
import { useData } from "../context/DataContext";
import { formatINR } from "../components/ListingRow";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const { listings, loadAll } = useData();

  useEffect(() => {
    setProject(null);
    setError(null);
    api.fetchProject(projectId).then(setProject).catch((e) => setError(e.message));
    loadAll();
  }, [projectId, loadAll]);

  const actualListings = useMemo(
    () => (listings ? listings.filter((l) => l.project_id === projectId) : []),
    [listings, projectId]
  );

  if (error) return <div className="page-state page-state-error">Couldn't load this project: {error}</div>;
  if (!project) return <div className="page-state">Loading…</div>;

  const countMismatch = listings && project.total_listings !== actualListings.length;

  return (
    <div className="page detail-page">
      <Link to="/projects" className="btn-text">← Back to projects</Link>

      <div className="detail-header">
        <div>
          <h1>{project.apartment_name}</h1>
          <p className="detail-locality">{project.developer_name} · {project.locality}</p>
        </div>
        <div className="detail-price">
          <span className="num">{formatINR(project.price_min)} – {formatINR(project.price_max)}</span>
        </div>
      </div>

      <dl className="detail-facts">
        <div><dt>Status</dt><dd>{project.project_status}</dd></div>
        <div><dt>Total units</dt><dd className="num">{project.total_units}</dd></div>
        <div><dt>Towers / floors</dt><dd className="num">{project.total_towers} / {project.total_floors}</dd></div>
        <div><dt>Launch date</dt><dd>{project.launch_date}</dd></div>
        <div><dt>Possession date</dt><dd>{project.possession_date}</dd></div>
        <div><dt>RERA number</dt><dd>{project.rera_number}</dd></div>
        <div><dt>Area range</dt><dd className="num">{project.min_area_sqft}–{project.max_area_sqft} sqft</dd></div>
        <div>
          <dt>Listed availability</dt>
          <dd className="num">
            {project.total_listings} reported
            {listings && <> / {actualListings.length} found {countMismatch && <span className="badge-mismatch">mismatch</span>}</>}
          </dd>
        </div>
      </dl>

      {project.amenities?.length > 0 && (
        <div className="amenities">
          {project.amenities.map((a) => <span key={a} className="amenity-pill">{a}</span>)}
        </div>
      )}

      {actualListings.length > 0 && (
        <div className="similar-section">
          <h2>Available listings in this project</h2>
          <div className="listing-list">
            {actualListings.map((l, i) => (
              <Link key={`${l.listing_id}-${i}`} to={`/listings/${l.listing_id}`} className="listing-row">
                <div className="listing-row-main">
                  <h3 className="listing-row-title">{l.apartment_name}</h3>
                  <p className="listing-row-meta">{l.locality}</p>
                </div>
                <div className="listing-row-price"><span className="num">{formatINR(l.price)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
