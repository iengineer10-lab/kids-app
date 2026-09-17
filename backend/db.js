const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data.sqlite3');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS kids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  photo_url TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  points_value INTEGER NOT NULL DEFAULT 5,
  is_done INTEGER NOT NULL DEFAULT 0,
  done_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎁',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
`);

// Seed a default admin account if none exists yet.
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;
if (adminCount === 0) {
  const defaultHash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', defaultHash);
  console.log('Created default admin user -> username: admin / password: admin123 (change this in the DB or add a new admin user).');
}

// Seed a couple of default rewards if the table is empty, so the app isn't blank on first run.
const rewardCount = db.prepare('SELECT COUNT(*) AS c FROM rewards').get().c;
if (rewardCount === 0) {
  const insertReward = db.prepare('INSERT INTO rewards (title, points_cost, icon) VALUES (?, ?, ?)');
  insertReward.run('Chocolate treat', 20, '🍫');
  insertReward.run('30 min extra screen time', 30, '📱');
  insertReward.run('Pick tonight\'s movie', 40, '🎬');
  insertReward.run('Stay up 15 min late', 50, '🌙');
}

module.exports = db;
