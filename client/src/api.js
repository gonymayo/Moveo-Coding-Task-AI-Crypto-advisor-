// client/src/api.js
const BASE = (import.meta.env.VITE_API_ROOT || "http://localhost:4000").replace(/\/$/, "");

// Timeout נחמד כדי לא להיתקע לנצח
async function request(path, { method="GET", body, auth=false } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);

  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timeout");
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  login:     (email, password)         => request("/api/login",      { method:"POST", body:{ email, password } }),
  register:  (name, email, password)   => request("/api/register",   { method:"POST", body:{ name, email, password } }),
  onboarding:(payload)                 => request("/api/onboarding", { method:"POST", body: payload, auth:true }),

  me:        () => request("/api/me",      { auth:true }),
  prices:    () => request("/api/prices"),
  news:      () => request("/api/news"),
  insight:   () => request("/api/insight", { auth:true }),
  meme:      () => request("/api/meme"),

  vote:      (section, value)          => request("/api/vote", { method:"POST", body:{ section, value }, auth:true }),
};
