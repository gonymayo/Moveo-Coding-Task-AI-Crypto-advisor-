import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { api } from "../api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const { user } = useContext(UserContext);

  const [feedback, setFeedback] = useState({
    news: null,
    prices: null,
    aiInsight: null,
    meme: null,
  });
  const setFB = (key, val) => setFeedback((p) => ({ ...p, [key]: val }));

  const [prices, setPrices] = useState({ data: null, loading: true, error: "" });
  const fetchPrices = async () => {
    try {
      setPrices((p) => ({ ...p, loading: true, error: "" }));
      const data = await api.prices();
      setPrices({ data, loading: false, error: "" });
    } catch (err) {
      setPrices({ data: null, loading: false, error: "Failed to load prices" });
    }
  };

  const [news, setNews] = useState({ items: [], loading: true, error: "" });
  const fetchNews = async () => {
    try {
      setNews((p) => ({ ...p, loading: true, error: "" }));
      const data = await api.news();
      setNews({ items: data.items || [], loading: false, error: "" });
    } catch (err) {
      setNews({ items: [], loading: false, error: "Failed to load news" });
    }
  };

  const [insight, setInsight] = useState({ text: "", loading: true, error: "" });
  const fetchInsight = async () => {
    try {
      setInsight((p) => ({ ...p, loading: true, error: "" }));
      const data = await api.insight();
      setInsight({ text: data.insight || "", loading: false, error: "" });
    } catch (err) {
      setInsight({ text: "", loading: false, error: "Failed to load insight" });
    }
  };

  const [meme, setMeme] = useState({ title: "", url: "", loading: true, error: "" });
  const fetchMeme = async () => {
    try {
      setMeme((p) => ({ ...p, loading: true, error: "" }));
      const data = await api.meme();
      setMeme({
        title: data.title || "Crypto Meme",
        url: data.url || "",
        loading: false,
        error: "",
      });
    } catch (err) {
      setMeme({ title: "", url: "", loading: false, error: "Failed to load meme" });
    }
  };

  const vote = async (section, value) => {
    try {
      await api.vote(section, value); 
      setFB(section, value === 1 ? "up" : "down");
    } catch (err) {
      console.error("vote failed", err);
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchNews();
    fetchInsight();
    fetchMeme();
  }, []);

  const formatUSD = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "-";

  const userAssets =
    Array.isArray(user?.cryptoAssets) && user.cryptoAssets.length
      ? user.cryptoAssets.join(", ")
      : "-";

  return (
    <main className="dashboard-container">
      <header className="dashboard-header light">
        <h1>Welcome to your Dashboard</h1>
        <p className="subtitle">Your personalized crypto feed</p>
      </header>

      {/* User Info */}
      <section className="user-panel">
        <div className="user-grid">
          <div>
            <span className="label">Email</span>
            <div className="value">{user?.email || "-"}</div>
          </div>
          <div>
            <span className="label">Name</span>
            <div className="value">{user?.name || "-"}</div>
          </div>
          <div>
            <span className="label">Crypto Assets</span>
            <div className="value">{userAssets}</div>
          </div>
          <div>
            <span className="label">Investor Type</span>
            <div className="value">{user?.investorType || "-"}</div>
          </div>
          <div>
            <span className="label">Preferred Content</span>
            <div className="value">{user?.contentType || "-"}</div>
          </div>
        </div>
      </section>

      <section className="cards">
        {/* Market News */}
        <article className="card">
          <div className="card-header">
            <h3>Market News</h3>
            <button className="btn-ghost" onClick={fetchNews} aria-label="Refresh news">
              ↻ Refresh
            </button>
          </div>

          {news.loading ? (
            <p>Loading news…</p>
          ) : news.error ? (
            <p>{news.error}</p>
          ) : news.items.length === 0 ? (
            <p>No news available.</p>
          ) : (
            <ul className="news-list">
              {news.items.map((n) => (
                <li key={n.id || n.url} className="news-item">
                  <a href={n.url} target="_blank" rel="noreferrer">
                    {n.title}
                  </a>
                  <div className="news-meta">
                    <span>{n.source}</span>
                    <span>
                      ·{" "}
                      {n.published_at
                        ? new Date(n.published_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="buttons">
            <button
              className={`vote ${feedback.news === "up" ? "active-up" : ""}`}
              onClick={() => vote("news", 1)}
              aria-label="Thumbs up Market News"
            >
              👍
            </button>
            <button
              className={`vote ${feedback.news === "down" ? "active-down" : ""}`}
              onClick={() => vote("news", -1)}
              aria-label="Thumbs down Market News"
            >
              👎
            </button>
          </div>
        </article>

        {/* Coin Prices */}
        <article className="card">
          <div className="card-header">
            <h3>Coin Prices</h3>
            <button className="btn-ghost" onClick={fetchPrices} aria-label="Refresh prices">
              ↻ Refresh
            </button>
          </div>

          {prices.loading ? (
            <p>Loading prices…</p>
          ) : prices.error ? (
            <p>{prices.error}</p>
          ) : prices.data ? (
            <ul className="prices-list">
              {"bitcoin" in prices.data && (
                <li>
                  <strong>Bitcoin (BTC)</strong> {formatUSD(prices.data.bitcoin.usd)}
                </li>
              )}
              {"ethereum" in prices.data && (
                <li>
                  <strong>Ethereum (ETH)</strong> {formatUSD(prices.data.ethereum.usd)}
                </li>
              )}
              {"solana" in prices.data && (
                <li>
                  <strong>Solana (SOL)</strong> {formatUSD(prices.data.solana.usd)}
                </li>
              )}
            </ul>
          ) : (
            <p>No prices available.</p>
          )}

          <div className="buttons">
            <button
              className={`vote ${feedback.prices === "up" ? "active-up" : ""}`}
              onClick={() => vote("prices", 1)}
              aria-label="Thumbs up Coin Prices"
            >
              👍
            </button>
            <button
              className={`vote ${feedback.prices === "down" ? "active-down" : ""}`}
              onClick={() => vote("prices", -1)}
              aria-label="Thumbs down Coin Prices"
            >
              👎
            </button>
          </div>
        </article>

        {/* AI Insight */}
        <article className="card">
          <div className="card-header">
            <h3>AI Insight of the Day</h3>
            <button className="btn-ghost" onClick={fetchInsight} aria-label="Refresh insight">
              ↻ Refresh
            </button>
          </div>

          {insight.loading ? (
            <p>Loading insight…</p>
          ) : insight.error ? (
            <p>{insight.error}</p>
          ) : insight.text ? (
            <p>{insight.text}</p>
          ) : (
            <p>No insight available.</p>
          )}

          <div className="buttons">
            <button
              className={`vote ${feedback.aiInsight === "up" ? "active-up" : ""}`}
              onClick={() => vote("aiInsight", 1)}
              aria-label="Thumbs up AI Insight"
            >
              👍
            </button>
            <button
              className={`vote ${feedback.aiInsight === "down" ? "active-down" : ""}`}
              onClick={() => vote("aiInsight", -1)}
              aria-label="Thumbs down AI Insight"
            >
              👎
            </button>
          </div>
        </article>

        {/* Fun Crypto Meme */}
        <article className="card">
          <div className="card-header">
            <h3>Fun Crypto Meme</h3>
            <button className="btn-ghost" onClick={fetchMeme} aria-label="Next meme">
              🔄 Next meme
            </button>
          </div>

          {meme.loading ? (
            <p>Loading meme…</p>
          ) : meme.error ? (
            <p>{meme.error}</p>
          ) : meme.url ? (
            <>
              <img
                src={meme.url || "https://placehold.co/300x200?text=No+meme"}
                alt={meme.title || "Crypto meme"}
                className="meme-image"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/300x200?text=No+meme";
                }}
              />
              <p className="meme-title">{meme.title || "Crypto meme"}</p>
            </>
          ) : (
            <p>No meme available.</p>
          )}

          <div className="buttons">
            <button
              className={`vote ${feedback.meme === "up" ? "active-up" : ""}`}
              onClick={() => vote("meme", 1)}
              aria-label="Thumbs up Meme"
            >
              👍
            </button>
            <button
              className={`vote ${feedback.meme === "down" ? "active-down" : ""}`}
              onClick={() => vote("meme", -1)}
              aria-label="Thumbs down Meme"
            >
              👎
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
