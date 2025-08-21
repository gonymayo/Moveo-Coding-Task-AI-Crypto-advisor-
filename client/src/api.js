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

// פונקציית עזר שמוסיפה Authorization אוטומטית אם יש טוקן
function withAuth(options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { ...options, headers };
}

export const api = {
  login: (email, password) =>
    http("/api/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (name, email, password) =>
    http("/api/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  onboarding: (payload) =>
    http("/api/onboarding", withAuth({ method: "POST", body: JSON.stringify(payload) })),

  vote: (section, value) =>
    http("/api/vote", withAuth({ method: "POST", body: JSON.stringify({ section, value }) })),

  // אם את משתמשת גם בזה בדשבורד:
  news: () => http("/api/news"),
  prices: () => http("/api/prices"),
  insight: () => http("/api/insight"),
  meme: () => http("/api/meme"),
};
