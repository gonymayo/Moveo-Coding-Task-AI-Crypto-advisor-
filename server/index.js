// server/index.js
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const FRONTEND_ORIGIN = "http://localhost:5173"; // Vite dev

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// ---------- DB ----------
const db = new sqlite3.Database("./mydb.sqlite", (err) =>
  console.log(err ? "❌ SQLite error: " + err.message : "✅ SQLite ready")
);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    investorType TEXT,
    contentType TEXT,
    cryptoAssets TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    section TEXT,         -- 'news' | 'prices' | 'aiInsight' | 'meme'
    value INTEGER,        -- 1 | -1
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ---------- helpers ----------
const sign = (u) => jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: "6h" });
const getUserIdFromAuth = (req) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return null;
    const dec = jwt.verify(token, JWT_SECRET);
    return dec?.id ?? null;
  } catch { return null; }
};

// ---------- Auth ----------
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users(name,email,password) VALUES(?,?,?)", [name, email, hashed], function (err) {
      if (err) return res.status(409).json({ error: "User exists" });
      const user = { id: this.lastID, name, email };
      return res.json({ success: true, token: sign(user), user });
    });
  } catch { res.status(500).json({ error: "Server error" }); }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!row || !(await bcrypt.compare(password, row.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const user = {
      id: row.id, name: row.name, email: row.email,
      investorType: row.investorType, contentType: row.contentType, cryptoAssets: row.cryptoAssets
    };
    res.json({ success: true, token: sign(user), user });
  });
});

app.get("/api/me", (req, res) => {
  const userId = getUserIdFromAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  db.get("SELECT * FROM users WHERE id=?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });
    res.json({
      id: row.id, name: row.name, email: row.email,
      investorType: row.investorType, contentType: row.contentType, cryptoAssets: row.cryptoAssets
    });
  });
});

// ---------- Onboarding ----------
app.post("/api/onboarding", (req, res) => {
  const userId = getUserIdFromAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { investorType, contentType, cryptoAssets } = req.body || {};
  db.run(
    "UPDATE users SET investorType=?, contentType=?, cryptoAssets=? WHERE id=?",
    [investorType || null, contentType || null, JSON.stringify(cryptoAssets || []), userId],
    (err) => (err ? res.status(500).json({ error: "Save failed" }) : res.json({ success: true }))
  );
});

// ---------- Data: prices / news / insight / meme ----------
const CG = "https://api.coingecko.com/api/v3";

app.get("/api/prices", async (_req, res) => {
  try {
    const r = await fetch(`${CG}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd`);
    res.json(await r.json());
  } catch { res.json({ bitcoin:{usd:0}, ethereum:{usd:0}, solana:{usd:0} }); }
});

app.get("/api/news", async (_req, res) => {
  const key = process.env.CRYPTOPANIC_KEY || "";
  try {
    const r = await fetch(`https://cryptopanic.com/api/v1/posts/?auth_token=${key}&currencies=BTC,ETH,SOL&public=true`);
    const j = await r.json();
    res.json({ items: (j.results || []).map(p => ({
      id: p.id, title: p.title, url: p.url, source: p.source?.title || "News", published_at: p.published_at
    }))});
  } catch {
    res.json({ items: [{ id:"static", title:"Here is some news about the crypto market...", url:"#", source:"Fallback", published_at:new Date().toISOString() }]});
  }
});

app.get("/api/insight", (req, res) => {
  const userId = getUserIdFromAuth(req);
  if (!userId) return res.json({ insight: "Tip: diversify and set alerts for BTC." });

  db.get("SELECT investorType, contentType, cryptoAssets FROM users WHERE id=?", [userId], (err, row) => {
    if (err || !row) return res.json({ insight: "Tip: diversify and set alerts for BTC." });
    let assets = []; try { assets = JSON.parse(row.cryptoAssets || "[]"); } catch {}
    const asset = assets[0] || "BTC";
    const type  = row.investorType || "crypto investor";
    const kind  = row.contentType || "News";
    res.json({ insight: `Insight: As a ${type} who likes ${kind}, keep an eye on ${asset} today.` });
  });
});

// ממים מקומיים מתוך client/public/memes/ (ללא כותרת)
const MEMES = [
  { url: "/memes/meme1.jpg" },
  { url: "/memes/meme2.jpg" },
  { url: "/memes/meme3.jpg" },
  { url: "/memes/meme4.jpg" }
];
app.get("/api/meme", (_req, res) => res.json(MEMES[Math.floor(Math.random()*MEMES.length)]));

// ---------- Votes ----------
app.post("/api/vote", (req, res) => {
  const { section, value } = req.body || {};
  if (!["news","prices","aiInsight","meme"].includes(section))
    return res.status(400).json({ error: "Invalid section" });
  if (![1,-1].includes(value))
    return res.status(400).json({ error: "Invalid value" });

  const userId = getUserIdFromAuth(req); // יכול להיות null אם לא נשלח טוקן
  db.run("INSERT INTO votes(userId, section, value) VALUES(?,?,?)",
    [userId, section, value],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// (אופציונלי לבדיקות מהירות)
app.get("/api/votes", (req, res) => {
  const userId = getUserIdFromAuth(req);
  const sql = userId
    ? "SELECT section, value, createdAt FROM votes WHERE userId=? ORDER BY id DESC LIMIT 20"
    : "SELECT userId, section, value, createdAt FROM votes ORDER BY id DESC LIMIT 20";
  const params = userId ? [userId] : [];
  db.all(sql, params, (err, rows) =>
    err ? res.status(500).json({ error: "DB error" }) : res.json({ items: rows })
  );
});

// ----------
app.get("/", (_req, res) => res.send("🚀 API OK"));
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
