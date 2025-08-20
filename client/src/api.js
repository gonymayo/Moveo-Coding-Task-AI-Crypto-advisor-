const BASE = "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async login(email, password) {
    const r = await fetch(`${BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async register(name, email, password) {
    const r = await fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async me() {
    const r = await fetch(`${BASE}/api/me`, { headers: { ...authHeaders() } });
    if (r.status === 401) throw new Error("Unauthorized");
    return r.json();
  },

  async onboarding(payload) {
    const r = await fetch(`${BASE}/api/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error("Failed to save preferences");
    return r.json();
  },

  async prices() {
    const r = await fetch(`${BASE}/api/prices`);
    return r.json();
  },

  async news() {
    const r = await fetch(`${BASE}/api/news`);
    return r.json();
  },

  async insight() {
    const r = await fetch(`${BASE}/api/insight`, { headers: { ...authHeaders() } });
    return r.json();
  },

  async meme() {
    const r = await fetch(`${BASE}/api/meme`);
    return r.json();
  },

  async vote(section, value) {
    const r = await fetch(`${BASE}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ section, value })
    });
    return r.json();
  }
};
