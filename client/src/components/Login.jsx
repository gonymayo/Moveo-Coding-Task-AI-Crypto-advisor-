import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "../styles/form.css";

export default function Login() {
  const { setUser, updateUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await r.json();
      if (!r.ok) {
        setErr(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      const applyUser = updateUser || setUser; 
      if (applyUser) applyUser(data.user);

      const hasPrefs = Boolean(data.user?.investorType || data.user?.contentType);
      navigate(hasPrefs ? "/dashboard" : "/onboarding");
    } catch {
      setErr("Network error");
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {err && <div className="error">{err}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="footer">
          New here? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
