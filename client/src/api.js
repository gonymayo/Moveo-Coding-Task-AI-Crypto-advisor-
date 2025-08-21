const BASE = import.meta.env.VITE_API_URL;

async function http(path, opts = {}) {
  const url = `${BASE}${path}`;
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
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
    const res = await fetch(url);
    return res.json();
  },

  async news() {
    try {
      const data = await http("/api/news"); // דרך השרת
      return {
        items: data.results.map((n) => ({
          id: n.id,
          title: n.title,
          url: n.url,
          source: n.source?.title,
          published_at: n.published_at,
        })),
      };
    } catch (err) {
      console.error("news error", err);
      return { items: [] };
    }
  },

  async insight() {
    const insights = [
      "Long-term holders often outperform day traders.",
      "Diversification reduces portfolio risk.",
      "Volatility is normal in crypto markets.",
    ];
    const pick = insights[Math.floor(Math.random() * insights.length)];
    return { insight: pick };
  },

  async meme() {
    const memes = ["meme1.jpg","meme2.jpg","meme3.jpg","meme4.jpg"];
    const pick = memes[Math.floor(Math.random() * memes.length)];
    return { title: "Crypto Meme", url: `/memes/${pick}` };
  },
};
