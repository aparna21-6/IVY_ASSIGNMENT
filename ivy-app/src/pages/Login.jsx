import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/listings";

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // surfaced via context error
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Ivy Homes</h1>
        <p className="auth-subtitle">Sign in with one of your demo accounts.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo1@ivy.homes" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
