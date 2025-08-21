import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/form.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function Onboarding() {
  const navigate = useNavigate();

  const [investorType, setInvestorType] = useState("");
  const [contentType, setContentType]   = useState("");
  const [cryptoAssets, setCryptoAssets] = useState([]); 
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!API) {
      setError("חסר VITE_API_URL בקובץ .env של הקליינט");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";

      const r = await fetch(`${API}/api/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ investorType, contentType, cryptoAssets }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save preferences");
      }

      navigate("/dashboard");
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
          <h1 className="title">Onboarding</h1>
          <p className="subtitle">Tell us a bit so we can personalize</p>
        </div>

        <form onSubmit={submit}>
          {}
          {}
          <div>
            <label>Investor Type</label>
            <input
              className="input"
              value={investorType}
              onChange={(e) => setInvestorType(e.target.value)}
              placeholder="e.g. long-term"
            />
          </div>

          <div>
            <label>Content Type</label>
            <input
              className="input"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              placeholder="e.g. News"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
