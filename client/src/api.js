// src/api.js
const BASE = import.meta.env.VITE_API_URL;

async function http(path, opts = {}) {
  const url = `${BASE}${path}`;
  console.log("API →", url, opts);
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return res.json();
}

export const api = {
  // ==== Auth ====
  login: (email, password) =>
    http("/api/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (name, email, password) =>
    http("/api/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  onboarding: (payload, token) =>
    http("/api/onboarding", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  vote: (section, value, token) =>
    http("/api/vote", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ section, value }),
    }),

  // ==== Dashboard ====
  async prices() {
    try {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
      const res = await fetch(url);
      return res.json();
    } catch (err) {
      console.error("prices error", err);
      return { bitcoin: { usd: 0 }, ethereum: { usd: 0 }, solana: { usd: 0 } };
    }
  },

  async news() {
    try {
      // CryptoPanic API דורש KEY, לכן נעשה fallback לחדשות סטטיות
      const url =
        "https://cryptopanic.com/api/v1/posts/?auth_token=demo&currencies=BTC,ETH,SOL";
      const res = await fetch(url);
      const data = await res.json();
      return data.results
        ? { items: data.results.map((n) => ({ id: n.id, title: n.title, url: n.url, source: n.source?.title, published_at: n.published_at })) }
        : { items: [] };
    } catch (err) {
      console.error("news error", err);
      return {
        items: [
          {
            id: 1,
            title: "Crypto market steady today",
            url: "https://example.com/news1",
            source: "Static",
            published_at: new Date().toISOString(),
          },
        ],
      };
    }
  },

  async insight() {
    try {
      // fallback פשוט – טקסט רנדומלי
      const insights = [
        "Long-term holders often outperform day traders.",
        "Diversification reduces portfolio risk.",
        "Volatility is normal in crypto markets.",
      ];
      const pick = insights[Math.floor(Math.random() * insights.length)];
      return { insight: pick };
    } catch (err) {
      console.error("insight error", err);
      return { insight: "Crypto insight unavailable." };
    }
  },

  async meme() {
    try {
      // מביא תמונה רנדומלית מתיקיית /memes בשרת
      const memes = [
        "meme1.jpg",
        "meme2.jpg",
        "meme3.jpg",
      ];
      const pick = memes[Math.floor(Math.random() * memes.length)];
      return { title: "Crypto Meme", url: `${BASE}/memes/${pick}` };
    } catch (err) {
      console.error("meme error", err);
      return { title: "No meme", url: "" };
    }
  },
};
