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
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const allowedSet = new Set(allowedOrigins);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    const ok = allowedSet.has(origin) || /\.vercel\.app$/.test(origin);
    return ok ? cb(null, true) : cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use((req,_res,next)=>{
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
function dbRun(sql, params=[]) {
  return new Promise((resolve,reject)=>{
    db.run(sql, params, function(err){
      if(err) reject(err); else resolve(this);
    });
  });
}
function dbGet(sql, params=[]) {
  return new Promise((resolve,reject)=>{
    db.get(sql, params, (err,row)=> err?reject(err):resolve(row));
  });
}
function dbAll(sql, params=[]) {
  return new Promise((resolve,reject)=>{
    db.all(sql, params, (err,rows)=> err?reject(err):resolve(rows));
  });
}

function sign(user){
  return jwt.sign({ id:user.id, email:user.email }, JWT_SECRET, { expiresIn:"6h" });
}
function getUserIdFromAuth(req){
  try{
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ")? h.slice(7):"";
    if(!token) return null;
    const dec = jwt.verify(token, JWT_SECRET);
    return dec?.id ?? null;
  }catch{ return null; }
}

function ok(res,data){ return res.json(data); }
function fail(req,res,status,message,details){
  console.error(`❌ [${req.id}] ${message}${details? " | "+details:""}`);
  return res.status(status).json({ error: message });
}

const handle = fn => async (req,res,next)=>{
  try{ await fn(req,res); }
  catch(err){
    console.error(`🔥 [${req.id}] ${err.message}`);
    return fail(req,res,500,err.message||"Server error");
  }
};

/* =========================
   ROUTES
========================= */

// Register
app.post("/api/register", handle(async (req,res)=>{
  const { name,email,password } = req.body || {};
  if(!name || !email || !password) return fail(req,res,400,"Missing fields");
  const hashed = await bcrypt.hash(password,10);
  const r = await dbRun("INSERT INTO users(name,email,password) VALUES(?,?,?)",[name,email,hashed]);
  const user = { id:r.lastID, name,email };
  return ok(res,{ success:true, token:sign(user), user });
}));

// Login
app.post("/api/login", handle(async (req,res)=>{
  const { email,password } = req.body || {};
  if(!email || !password) return fail(req,res,400,"Missing fields");
  const user = await dbGet("SELECT * FROM users WHERE email=?",[email]);
  if(!user) return fail(req,res,401,"Invalid email or password");
  const match = await bcrypt.compare(password,user.password);
  if(!match) return fail(req,res,401,"Invalid email or password");
  return ok(res,{ token:sign(user), user });
}));

// Onboarding
app.post("/api/onboarding", handle(async (req,res)=>{
  const userId = getUserIdFromAuth(req);
  if(!userId) return fail(req,res,401,"Unauthorized");
  const { investorType, contentType, cryptoAssets } = req.body || {};
  await dbRun("UPDATE users SET investorType=?, contentType=?, cryptoAssets=? WHERE id=?",
    [investorType||null, contentType||null, JSON.stringify(cryptoAssets||[]), userId]);
  const user = await dbGet("SELECT * FROM users WHERE id=?",[userId]);
  return ok(res,{ success:true, user });
}));

// Vote
app.post("/api/vote", handle(async (req,res)=>{
  const userId = getUserIdFromAuth(req);
  if(!userId) return fail(req,res,401,"Unauthorized");
  const { section,value } = req.body || {};
  await dbRun("INSERT INTO votes(userId,section,value) VALUES(?,?,?)",[userId,section,value]);
  return ok(res,{ success:true });
}));

// CryptoPanic News Proxy
app.get("/api/news", handle(async (req,res)=>{
  const key = process.env.CRYPTOPANIC_KEY;
  if(!key) return fail(req,res,500,"Missing CRYPTOPANIC_KEY");

  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${key}&currencies=BTC,ETH,SOL`;
  const r = await fetch(url);
  if(!r.ok) return fail(req,res,r.status,"CryptoPanic request failed");

  const data = await r.json();
  return ok(res,data);
}));

// Health
app.get("/", (_req,res)=> res.send("🚀 API OK"));
app.get("/api/health", (_req,res)=> res.json({ ok:true, time:new Date().toISOString() }));

/* =========================
   GLOBAL ERROR
========================= */
app.use((err,req,res,_next)=>{
  console.error(`🔥 [${req?.id||"no-id"}] ${err.message}`);
  res.status(500).json({ error: err.message||"Unexpected error" });
});

app.listen(PORT, ()=> console.log(`🚀 Server running at http://localhost:${PORT}`));
