import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const DB_FILE = process.env.DB_FILE || "./mydb.sqlite";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* =========================
   CORS CONFIG
========================= */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",").map(s => s.trim());

app.use(cors({
  origin: function (origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight
app.options("*", cors());

app.use(express.json());

app.use((req, _res, next) => {
  req.id = crypto.randomBytes(6).toString("hex");
  console.log(`➡️  [${req.id}] ${req.method} ${req.originalUrl}`);
  next();
});

/* =========================
   SQLITE INIT
========================= */
const db = new sqlite3.Database(DB_FILE, (err) =>
  console.log(err ? "❌ SQLite error: " + err.message : "✅ SQLite ready at " + DB_FILE)
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
    section TEXT,
    value INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

/* =========================
   HELPERS
========================= */
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
}
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "6h" });
}

function getUserIdFromAuth(req) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return null;
    const dec = jwt.verify(token, JWT_SECRET);
    return dec?.id ?? null;
  } catch (err) {
    console.warn(`⚠️  [${req.id}] Invalid token: ${err.message}`);
    return null;
  }
}

function ok(res, data) {
  return res.json(data);
}

function fail(req, res, status, message, details) {
  const info = details ? ` | ${details}` : "";
  console.error(`❌ [${req.id}] ${message}${info}`);
  return res.status(status).json({ error: message });
}

const handle = (fn) => async (req, res, next) => {
  try { await fn(req, res); }
  catch (err) {
    console.error(`🔥 [${req.id}] Uncaught: ${err.message}`);
    console.error(err.stack);
    return fail(req, res, 500, err.message || "Server error");
  }
};

/* =========================
   ROUTES
========================= */

// Static files (memes)
app.use("/memes", express.static(path.join(__dirname, "memes")));

// Register
app.post("/api/register", handle(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return fail(req, res, 400, "Missing fields");

  console.log(`📩 [${req.id}] Register attempt: ${email}`);

  const hashed = await bcrypt.hash(password, 10);
  const r = await dbRun("INSERT INTO users(name,email,password) VALUES(?,?,?)", [name, email, hashed]);
  const user = { id: r.lastID, name, email };
  console.log(`✅ [${req.id}] Register success: ${email}`);
  return ok(res, { success: true, token: sign(user), user });
}));

// Health check
app.get("/", (_req, res) => res.send("🚀 API OK"));
app.get("/api/health", (_req, res) => {
  try {
    res.json({
      ok: true,
      time: new Date().toISOString(),
      env: {
        node: process.version,
        port: PORT,
        hasJwt: Boolean(process.env.JWT_SECRET),
        dbFile: DB_FILE
      }
    });
  } catch (err) {
    console.error("❌ Health endpoint error:", err.message);
    res.status(500).json({ error: "Health check failed" });
  }
});

/* =========================
   Global error handler
========================= */
app.use((err, req, res, _next) => {
  console.error(`🔥 [${req?.id || "no-id"}] Uncaught (global): ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Unexpected server error" });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
