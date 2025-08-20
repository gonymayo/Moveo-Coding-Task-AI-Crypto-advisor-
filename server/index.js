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
const FRONTEND_ORIGIN = "http://localhost:5173"; // Vite

app.use(cors({ origin: FRONTEND_ORIGIN })); // אין cookies, לא צריך credentials
app.use(express.json());

// ---------- DB ----------
const db = new sqlite3.Database("./mydb.sqlite", (err) => {
  if (err) console.error("❌ SQLite connect error:", err.message);
  else console.log("✅ Connected to SQLite DB");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    investorType TEXT,
    contentType TEXT,
    cryptoAssets TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    section TEXT,     -- 'news' | 'prices' | 'aiInsight' | 'meme'
    value INTEGER,    -- 1 | -1
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ---------- helpers ----------
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "6h" });
}
function auth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---------- Auth ----------
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashed],
      function (err) {
        if (err) return res.status(409).json({ error: "User already exists" });
        const user = { id: this.lastID, name, email };
        const token = signToken(user);
        return res.json({ success: true, token, user });
      }
    );
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!row) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      investorType: row.investorType,
      contentType: row.contentType,
      cryptoAssets: row.cryptoAssets,
    };
    const token = signToken(user);
    return res.json({ success: true, token, user });
  });
});

app.get("/api/me", auth, (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      investorType: row.investorType,
      contentType: row.contentType,
      cryptoAssets: row.cryptoAssets,
    };
    return res.json(user);
  });
});

// ---------- Onboarding ----------
app.post("/api/onboarding", auth, (req, res) => {
  const { investorType, contentType, cryptoAssets } = req.body || {};
  const assetsString = JSON.stringify(cryptoAssets || []);
  db.run(
    "UPDATE users SET investorType=?, contentType=?, cryptoAssets=? WHERE id=?",
    [investorType || null, contentType || null, assetsString, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to save preferences" });
      return res.json({ success: true });
    }
  );
});

// ---------- Data APIs ----------
const COINGECKO = "https://api.coingecko.com/api/v3";
app.get("/api/prices", async (_req, res) => {
  try {
    const r = await fetch(
      `${COINGECKO}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd`
    );
    if (!r.ok) throw new Error("CG error");
    const data = await r.json();
    return res.json(data);
  } catch {
    // fallback מינימלי
    return res.json({ bitcoin: { usd: 0 }, ethereum: { usd: 0 }, solana: { usd: 0 } });
  }
});

app.get("/api/news", async (_req, res) => {
  const key = process.env.CRYPTOPANIC_KEY || "";
  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${key}&currencies=BTC,ETH,SOL&public=true`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("news error");
    const j = await r.json();
    // נרזום לפרונט (title,url,source,published_at)
    const items = (j.results || []).map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      source: p.source?.title || "News",
      published_at: p.published_at,
    }));
    return res.json({ items });
  } catch {
    // fallback סטטי
    return res.json({
      items: [
        {
          id: "static-1",
          title: "Here is some news about the crypto market...",
          url: "https://cryptopanic.com/",
          source: "Fallback",
          published_at: new Date().toISOString(),
        },
      ],
    });
  }
});

app.get("/api/insight", auth, (req, res) => {
  // אפשר לחבר ל-OpenRouter/HF; כאן מחזירים טקסט דינמי קצר לפי העדפות
  db.get("SELECT investorType, contentType, cryptoAssets FROM users WHERE id = ?", [req.user.id], (err, row) => {
    if (err || !row) return res.json({ insight: "Today's tip: diversify and manage risk." });
    let assets = [];
    try { assets = JSON.parse(row.cryptoAssets || "[]"); } catch {}
    const msg = `Insight: As a ${row.investorType || "crypto investor"} focusing on ${row.contentType || "News"}, keep an eye on ${assets[0] || "BTC"}'s volatility today.`;
    return res.json({ insight: msg });
  });
});

const MEMES = [
  {
    title: "HODL Mode",
    url: "https://i.imgflip.com/4/43a7v2.jpg"
  },
  {
    title: "When Bitcoin crashes but you’re still holding",
    url: "https://i.imgflip.com/4/5x3p5y.jpg"
  },
  {
    title: "To the Moon 🚀",
    url: "https://i.imgflip.com/4/6v1z5e.jpg"
  },
  {
    title: "NFT Collector starter pack",
    url: "https://i.imgflip.com/4/76n1w3.jpg"
  },
  {
    title: "Elon Musk tweets...",
    url: "https://i.imgflip.com/4/5zl9ro.jpg"
  }
];


// ---------- Votes ----------
app.post("/api/vote", auth, (req, res) => {
  const { section, value } = req.body || {};
  if (!["news", "prices", "aiInsight", "meme"].includes(section))
    return res.status(400).json({ error: "Invalid section" });
  if (![1, -1].includes(value)) return res.status(400).json({ error: "Invalid value" });

  db.run(
    "INSERT INTO votes (userId, section, value) VALUES (?, ?, ?)",
    [req.user.id, section, value],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      return res.json({ success: true, id: this.lastID });
    }
  );
});

// ---------- Root ----------
app.get("/", (_req, res) => res.send("🚀 Server is running"));

app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
