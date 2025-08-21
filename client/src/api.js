const BASE =
  (import.meta.env.VITE_API_ROOT || window.location.origin).replace(/\/$/, "");

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function send(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, authHeaders());

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // ננסה לפרש JSON גם כשיש שגיאה מהשרת
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    send("/api/login", { method: "POST", body: { email, password } }),

  register: (name, email, password) =>
    send("/api/register", { method: "POST", body: { name, email, password } }),

  me: () => send("/api/me", { auth: true }),

  onboarding: (payload) =>
    send("/api/onboarding", { method: "POST", body: payload, auth: true }),

  prices: () => send("/api/prices"),
  news: () => send("/api/news"),
  insight: () => send("/api/insight", { auth: true }),
  meme: () => send("/api/meme"),

  vote: (section, value) =>
    send("/api/vote", {
      method: "POST",
      body: { section, value },
      auth: true,
    }),
};
