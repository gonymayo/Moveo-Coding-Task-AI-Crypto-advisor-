import sqlite3 from "sqlite3";
sqlite3.verbose();

export const db = new sqlite3.Database("./data.sqlite");

export const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });

export const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

export const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

export function initDb() {
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        passwordHash TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        userId INTEGER NOT NULL UNIQUE,
        cryptoAssets TEXT,
        investorType TEXT,
        contentType TEXT,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        section TEXT NOT NULL,
        value INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  });
}

export async function savePreferences(userId, { cryptoAssets, investorType, contentType }) {
  const assetsJson = JSON.stringify(cryptoAssets || []);
  const update = await dbRun(
    `UPDATE preferences
     SET cryptoAssets = ?, investorType = ?, contentType = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE userId = ?`,
    [assetsJson, investorType || null, contentType || null, userId]
  );
  if (update.changes === 0) {
    await dbRun(
      `INSERT INTO preferences (userId, cryptoAssets, investorType, contentType)
       VALUES (?, ?, ?, ?)`,
      [userId, assetsJson, investorType || null, contentType || null]
    );
  }
  return getPreferences(userId);
}

export async function getPreferences(userId) {
  const row = await dbGet(`SELECT * FROM preferences WHERE userId = ?`, [userId]);
  if (!row) return null;
  return {
    userId,
    cryptoAssets: row.cryptoAssets ? JSON.parse(row.cryptoAssets) : [],
    investorType: row.investorType || "",
    contentType: row.contentType || "",
    updatedAt: row.updatedAt,
  };
}

export async function addVote(userId, section, value) {
  await dbRun(`INSERT INTO votes (userId, section, value) VALUES (?, ?, ?)`, [
    userId,
    section,
    value,
  ]);
}

export async function getUserVotes(userId) {
  return dbAll(
    `SELECT section, value, createdAt FROM votes WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
}
