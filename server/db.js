import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const normalizeValue = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.replace(/^['\"]|['\"]$/g, "");
};

const DEFAULT_SITE_SETTINGS = {
  site_name: "mortal的主页",
  site_logo: "/images/icon/favicon.ico",
  site_author: "mortal",
  site_custom_name: "mortal",
  site_url: "https://supermortal.cn",
  site_icp: "",
  site_start: "2026-04-15",
  site_main_logo: "https://q1.qlogo.cn/g?b=qq&nk=2169702639&s=640",
  desc_hello: "Hello World!",
  desc_text: "一个建立于 2026.04.15 的小站，存活于互联网的边缘",
  desc_hello_other: "Good!",
  desc_text_other: "哎呀，这都被你发现了（ 再点击一次可关闭 ）",
  umami_tracking_code: "",
};

const readJsonArray = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
};

export const initDb = (rootDir) => {
  const dbPath = process.env.DB_PATH || path.join(rootDir, "data", "site.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      icon TEXT NOT NULL,
      name TEXT NOT NULL,
      link TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      tip TEXT NOT NULL,
      url TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const existingAdmin = db.prepare("SELECT id FROM admin_users LIMIT 1").get();
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123456", 10);
    db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run(
      process.env.ADMIN_USERNAME || "admin",
      passwordHash,
    );
  }

  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))",
  );
  const settingTx = db.transaction((entries) => {
    entries.forEach(([key, value]) => {
      insertSetting.run(key, value || "");
    });
  });
  settingTx(Object.entries(DEFAULT_SITE_SETTINGS));

  const siteLinksCount = db.prepare("SELECT COUNT(1) AS count FROM site_links").get().count;
  if (!siteLinksCount) {
    const defaults = readJsonArray(path.join(rootDir, "src", "assets", "siteLinks.json"));
    const insert = db.prepare(
      "INSERT INTO site_links (icon, name, link, sort, enabled, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    );
    const tx = db.transaction((items) => {
      items.forEach((item, index) => {
        insert.run(item.icon || "Link", item.name || "", item.link || "", index, 1);
      });
    });
    tx(defaults);
  }

  const socialLinksCount = db.prepare("SELECT COUNT(1) AS count FROM social_links").get().count;
  if (!socialLinksCount) {
    const defaults = readJsonArray(path.join(rootDir, "src", "assets", "socialLinks.json"));
    const insert = db.prepare(
      "INSERT INTO social_links (name, icon, tip, url, sort, enabled, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    );
    const tx = db.transaction((items) => {
      items.forEach((item, index) => {
        insert.run(item.name || "", item.icon || "", item.tip || "", item.url || "", index, 1);
      });
    });
    tx(defaults);
  }

  return db;
};
