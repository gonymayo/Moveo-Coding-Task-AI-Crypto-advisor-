import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "../styles/form.css";

const BASE = (import.meta.env.VITE_API_ROOT || "").replace(/\/$/, "");

export default function Login() {
  const { updateUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const r = await fetch(`${BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) return setErr(data.error || "Login failed");

      localStorage.setItem("token", data.token);
      updateUser?.(data.user);

      const hasPrefs = data.user?.investorType || data.user?.contentType;
      navigate(hasPrefs ? "/dashboard" : "/onboarding");
    } catch {
      setErr("Network error");
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
            />
          </div>

          {err && <div className="error">{err}</div>}

          <button className="primary" type="submit">Login</button>
        </form>

        <div className="footer">
          New here? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
