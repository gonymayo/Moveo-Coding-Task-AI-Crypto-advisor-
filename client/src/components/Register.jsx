import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import "../styles/form.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPwd] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.register(name, email, password);
      navigate("/login");
    } catch (e) {
      setErr(e.message || "Server error");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <h1 className="title">Create Account</h1>
          <p className="subtitle">Register to get started</p>
        </div>

        <form onSubmit={submit}>
          <div>
            <label>Name</label>
            <input className="input" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>

          <div>
            <label>Email</label>
            <input className="input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div>
            <label>Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" minLength={4} required />
          </div>

          {err && <div className="error">{err}</div>}
          <button className="primary" type="submit">Register</button>
        </form>

        <div className="footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
