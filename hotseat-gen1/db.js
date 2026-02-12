const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      seat TEXT NOT NULL,
      booked_by TEXT NOT NULL,
      date TEXT NOT NULL,       -- YYYY-MM-DD
      start_time TEXT NOT NULL, -- HH:MM
      end_time TEXT NOT NULL,   -- HH:MM
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(room_id) REFERENCES rooms(id)
    )
  `);

  // Seed 5 rooms if not present
  const existing = await all(`SELECT * FROM rooms ORDER BY id`);
  if (existing.length === 0) {
    const rooms = [
      "Meeting Room 1",
      "Meeting Room 2",
      "Meeting Room 3",
      "Meeting Room 4",
      "Meeting Room 5",
    ];
    for (const r of rooms) {
      await run(`INSERT INTO rooms (name) VALUES (?)`, [r]);
    }
  }
}

function close() {
  db.close();
}

module.exports = { db, run, get, all, init, close };
