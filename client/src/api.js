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
    const txt = await res.text().catch(()=> "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }
  return res.json();
}

export const api = {
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
};
