import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-brand">Ivy Homes</div>
        {user && (
          <nav className="nav-links">
            <NavLink to="/listings" className="nav-link">Listings</NavLink>
            <NavLink to="/rentals" className="nav-link">Rentals</NavLink>
            <NavLink to="/projects" className="nav-link">Projects</NavLink>
            <NavLink to="/favourites" className="nav-link">Saved</NavLink>
            <NavLink to="/insights" className="nav-link">Insights</NavLink>
          </nav>
        )}
        {user && (
          <div className="nav-user">
            <span>{user.name}</span>
            <button className="btn-text" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}
