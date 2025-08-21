import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/form.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!API) {
      setError("חסר VITE_API_URL בקובץ .env של הקליינט");
      return;
    }

    try {
      setLoading(true);
      const r = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || data.message || "Login failed");

      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user)  localStorage.setItem("user", JSON.stringify(data.user));

      const hasPrefs = data?.user?.investorType || data?.user?.contentType;
      navigate(hasPrefs ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Network error" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <h1 className="title">Welcome back</h1>
          <p className="subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={submit}>
          <div>
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={4}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="footer">
          New here? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
