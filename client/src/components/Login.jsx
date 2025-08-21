import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { api } from "../api";
import "../styles/form.css";

export default function Login() {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    console.log("🔹 Trying to login with:", { email, password });

    try {
      const data = await api.login(email, password);
      console.log("✅ Login success, server response:", data);

      localStorage.setItem("token", data.token);
      setUser(data.user);

      const hasPrefs = data.user?.investorType || data.user?.contentType;
      console.log("➡️ Redirecting user, hasPrefs =", hasPrefs);

      navigate(hasPrefs ? "/dashboard" : "/onboarding");
    } catch (e) {
      console.error("❌ Login failed:", e);
      setErr(e.message || "Network error");
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

          <button className="primary" type="submit">
            Login
          </button>
        </form>

        <div className="footer">
          New here? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  );
}
