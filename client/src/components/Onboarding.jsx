import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/form.css";

export default function Onboarding() {
  const [investorType, setInvestorType] = useState("");
  const [contentType, setContentType]   = useState("");
  const [cryptoAssets, setAssets]       = useState([]);
  const [err, setErr]                   = useState("");
  const navigate = useNavigate();

  const toggleAsset = (val, checked) =>
    setAssets(prev => checked ? [...prev, val] : prev.filter(a => a !== val));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const token = localStorage.getItem("token");
    try {
      const r = await fetch("http://localhost:4000/api/onboarding", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },
        body: JSON.stringify({ investorType, contentType, cryptoAssets })
      });
      if (!r.ok) return setErr("Failed to save preferences");
      navigate("/dashboard");
    } catch {
      setErr("Failed to save preferences");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <h1 className="title">Onboarding</h1>
          <p className="subtitle">Tell us what you like and we’ll tailor your feed</p>
        </div>

        <form onSubmit={submit}>
          <div className="grid-2">
            <div>
              <label>Investor Type</label>
              <select value={investorType} onChange={e=>setInvestorType(e.target.value)} required>
                <option value="">Select…</option>
                <option value="HODLer">HODLer</option>
                <option value="Day Trader">Day Trader</option>
                <option value="NFT Collector">NFT Collector</option>
              </select>
            </div>

            <div>
              <label>Preferred Content</label>
              <select value={contentType} onChange={e=>setContentType(e.target.value)} required>
                <option value="">Select…</option>
                <option value="News">Market News</option>
                <option value="Charts">Charts</option>
                <option value="Social">Social</option>
                <option value="Fun">Fun</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend>Crypto Assets</legend>
            <div className="checkbox-row">
              <input type="checkbox" id="btc" value="BTC"
                     onChange={(e)=>toggleAsset("BTC", e.target.checked)} />
              <label htmlFor="btc">BTC</label>
            </div>
            <div className="checkbox-row">
              <input type="checkbox" id="eth" value="ETH"
                     onChange={(e)=>toggleAsset("ETH", e.target.checked)} />
              <label htmlFor="eth">ETH</label>
            </div>
            <div className="checkbox-row">
              <input type="checkbox" id="sol" value="SOL"
                     onChange={(e)=>toggleAsset("SOL", e.target.checked)} />
              <label htmlFor="sol">SOL</label>
            </div>
          </fieldset>

          {err && <div className="error">{err}</div>}

          <button className="primary" type="submit">Save Preferences</button>
        </form>
      </div>
    </div>
  );
}
