import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { initDb } from "./db.js";

const rootDir = path.resolve(process.cwd());
const app = express();
const db = initDb(rootDir);
const port = Number(process.env.API_PORT || 3100);
const SESSION_DAYS = Number(process.env.ADMIN_SESSION_DAYS || 7);

const createSession = (username) => {
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare(
    "INSERT INTO admin_sessions (token, username, expires_at, created_at) VALUES (?, ?, datetime('now', ?), datetime('now'))",
  ).run(token, username, `+${SESSION_DAYS} days`);
  return token;
};

const authRequired = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const session = db
    .prepare("SELECT token, username FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')")
    .get(token);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.admin = { username: session.username, token: session.token };
  return next();
};

const mapLink = (row) => ({
  id: row.id,
  icon: row.icon,
  name: row.name,
  link: row.link,
  sort: row.sort,
  enabled: Boolean(row.enabled),
});

const mapSocial = (row) => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  url: row.url,
  sort: row.sort,
  enabled: Boolean(row.enabled),
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/public/config", (_req, res) => {
  const settingsRows = db
    .prepare(
      "SELECT key, value FROM site_settings WHERE key IN ('site_name','site_logo','site_author','site_custom_name','site_url','site_icp','site_start','site_main_logo','desc_hello','desc_text','desc_hello_other','desc_text_other','umami_tracking_code')",
    )
    .all();
  const siteSettings = settingsRows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const siteLinks = db
    .prepare("SELECT id, icon, name, link, sort, enabled FROM site_links WHERE enabled = 1 ORDER BY sort ASC, id ASC")
    .all()
    .map(mapLink);

  const socialLinks = db
    .prepare("SELECT id, name, icon, url, sort, enabled FROM social_links WHERE enabled = 1 ORDER BY sort ASC, id ASC")
    .all()
    .map(mapSocial);

  res.json({ siteSettings, siteLinks, socialLinks });
});

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }
  const admin = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }
  db.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();
  const token = createSession(username);
  return res.json({ token, username });
});

app.post("/api/admin/logout", authRequired, (req, res) => {
  db.prepare("DELETE FROM admin_sessions WHERE token = ?").run(req.admin.token);
  res.json({ ok: true });
});

app.put("/api/admin/password", authRequired, (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "密码不能为空" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "新密码至少 6 位" });
  }

  const username = req.admin.username;
  const admin = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return res.status(400).json({ message: "当前密码错误" });
  }

  const nextHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE username = ?").run(nextHash, username);
  return res.json({ ok: true });
});

app.get("/api/admin/settings", authRequired, (_req, res) => {
  const rows = db
    .prepare(
      "SELECT key, value FROM site_settings WHERE key IN ('site_name','site_logo','site_author','site_custom_name','site_url','site_icp','site_start','site_main_logo','desc_hello','desc_text','desc_hello_other','desc_text_other','umami_tracking_code')",
    )
    .all();
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  res.json(settings);
});

app.put("/api/admin/settings", authRequired, (req, res) => {
  const payload = {
    site_name: String(req.body.site_name || "").trim(),
    site_logo: String(req.body.site_logo || "").trim(),
    site_author: String(req.body.site_author || "").trim(),
    site_custom_name: String(req.body.site_custom_name || "").trim(),
    site_url: String(req.body.site_url || "").trim(),
    site_icp: String(req.body.site_icp || "").trim(),
    site_start: String(req.body.site_start || "").trim(),
    site_main_logo: String(req.body.site_main_logo || "").trim(),
    desc_hello: String(req.body.desc_hello || "").trim(),
    desc_text: String(req.body.desc_text || "").trim(),
    desc_hello_other: String(req.body.desc_hello_other || "").trim(),
    desc_text_other: String(req.body.desc_text_other || "").trim(),
    umami_tracking_code: String(req.body.umami_tracking_code || "").trim(),
  };
  const upsert = db.prepare(
    "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')",
  );
  const tx = db.transaction((entries) => {
    entries.forEach(([key, value]) => upsert.run(key, value));
  });
  tx(Object.entries(payload));
  res.json({ ok: true });
});

app.get("/api/admin/site-links", authRequired, (_req, res) => {
  const rows = db
    .prepare("SELECT id, icon, name, link, sort, enabled FROM site_links ORDER BY sort ASC, id ASC")
    .all();
  res.json(rows.map(mapLink));
});

app.post("/api/admin/site-links", authRequired, (req, res) => {
  const icon = String(req.body.icon || "Blog").trim();
  const name = String(req.body.name || "").trim();
  const link = String(req.body.link || "").trim();
  const enabled = req.body.enabled === false ? 0 : 1;
  if (!name || !link) {
    return res.status(400).json({ message: "名称和链接不能为空" });
  }
  const maxSort = db.prepare("SELECT COALESCE(MAX(sort), -1) AS maxSort FROM site_links").get().maxSort;
  const info = db
    .prepare(
      "INSERT INTO site_links (icon, name, link, sort, enabled, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    )
    .run(icon, name, link, maxSort + 1, enabled);
  const row = db.prepare("SELECT id, icon, name, link, sort, enabled FROM site_links WHERE id = ?").get(info.lastInsertRowid);
  return res.status(201).json(mapLink(row));
});

app.put("/api/admin/site-links/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "无效 ID" });
  const current = db.prepare("SELECT * FROM site_links WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ message: "记录不存在" });

  const icon = req.body.icon != null ? String(req.body.icon).trim() : current.icon;
  const name = req.body.name != null ? String(req.body.name).trim() : current.name;
  const link = req.body.link != null ? String(req.body.link).trim() : current.link;
  const sort = Number.isInteger(req.body.sort) ? req.body.sort : current.sort;
  const enabled = typeof req.body.enabled === "boolean" ? (req.body.enabled ? 1 : 0) : current.enabled;

  db.prepare(
    "UPDATE site_links SET icon = ?, name = ?, link = ?, sort = ?, enabled = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(icon, name, link, sort, enabled, id);

  const row = db.prepare("SELECT id, icon, name, link, sort, enabled FROM site_links WHERE id = ?").get(id);
  return res.json(mapLink(row));
});

app.delete("/api/admin/site-links/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "无效 ID" });
  const info = db.prepare("DELETE FROM site_links WHERE id = ?").run(id);
  if (!info.changes) return res.status(404).json({ message: "记录不存在" });
  return res.json({ ok: true });
});

app.get("/api/admin/social-links", authRequired, (_req, res) => {
  const rows = db
    .prepare("SELECT id, name, icon, url, sort, enabled FROM social_links ORDER BY sort ASC, id ASC")
    .all();
  res.json(rows.map(mapSocial));
});

app.post("/api/admin/social-links", authRequired, (req, res) => {
  const name = String(req.body.name || "").trim();
  const icon = String(req.body.icon || "").trim();
  const url = String(req.body.url || "").trim();
  const enabled = req.body.enabled === false ? 0 : 1;
  if (!name || !icon || !url) {
    return res.status(400).json({ message: "名称、图标、链接不能为空" });
  }
  const maxSort = db.prepare("SELECT COALESCE(MAX(sort), -1) AS maxSort FROM social_links").get().maxSort;
  const info = db
    .prepare(
      "INSERT INTO social_links (name, icon, tip, url, sort, enabled, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    )
    .run(name, icon, "", url, maxSort + 1, enabled);
  const row = db
    .prepare("SELECT id, name, icon, url, sort, enabled FROM social_links WHERE id = ?")
    .get(info.lastInsertRowid);
  return res.status(201).json(mapSocial(row));
});

app.put("/api/admin/social-links/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "无效 ID" });
  const current = db.prepare("SELECT * FROM social_links WHERE id = ?").get(id);
  if (!current) return res.status(404).json({ message: "记录不存在" });

  const name = req.body.name != null ? String(req.body.name).trim() : current.name;
  const icon = req.body.icon != null ? String(req.body.icon).trim() : current.icon;
  const url = req.body.url != null ? String(req.body.url).trim() : current.url;
  const sort = Number.isInteger(req.body.sort) ? req.body.sort : current.sort;
  const enabled = typeof req.body.enabled === "boolean" ? (req.body.enabled ? 1 : 0) : current.enabled;

  db.prepare(
    "UPDATE social_links SET name = ?, icon = ?, url = ?, sort = ?, enabled = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(name, icon, url, sort, enabled, id);

  const row = db
    .prepare("SELECT id, name, icon, url, sort, enabled FROM social_links WHERE id = ?")
    .get(id);
  return res.json(mapSocial(row));
});

app.delete("/api/admin/social-links/:id", authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "无效 ID" });
  const info = db.prepare("DELETE FROM social_links WHERE id = ?").run(id);
  if (!info.changes) return res.status(404).json({ message: "记录不存在" });
  return res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API server started on :${port}`);
});
