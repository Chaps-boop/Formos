// CRM « Escale en Presqu'île » — serveur API + interface web
const path = require('path');
const fs = require('fs');
// Charge un fichier .env s'il existe (sans dépendance externe)
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const express = require('express');
const db = require('./db');
const auth = require('./auth');
const mail = require('./mail-import');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' });
  next();
});

const api = express.Router();
const wrap = (fn) => (req, res) => {
  try { const out = fn(req, res); if (out instanceof Promise) out.catch((e) => fail(res, e)); } catch (e) { fail(res, e); }
};
function fail(res, e) {
  const status = e.status || (/UNIQUE/.test(e.message) ? 409 : /CHECK|NOT NULL|FOREIGN/.test(e.message) ? 400 : 500);
  if (status === 500) console.error(e);
  res.status(status).json({ error: status === 409 ? 'Cette valeur existe déjà' : e.message });
}
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const notFound = () => Object.assign(new Error('Introuvable'), { status: 404 });
const str = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
const now = () => new Date().toISOString();
const isDate = (v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v);

// ------------------------------------------------------------------ Auth
const attempts = new Map();
api.post('/login', wrap((req, res) => {
  const key = req.ip;
  const a = attempts.get(key) || { n: 0, t: Date.now() };
  if (Date.now() - a.t > 15 * 60e3) { a.n = 0; a.t = Date.now(); }
  if (a.n >= 10) return res.status(429).json({ error: 'Trop de tentatives, réessayez dans 15 minutes' });
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim());
  if (!user || !auth.verifyPassword(String(password || ''), user.password_hash)) {
    a.n++; attempts.set(key, a);
    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
  }
  attempts.delete(key);
  const token = auth.createSession(user.id);
  const secure = process.env.COOKIE_SECURE === 'true' || req.secure;
  res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}${secure ? '; Secure' : ''}`);
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}));

api.post('/logout', wrap((req, res) => {
  const token = auth.parseCookies(req.headers.cookie).sid;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.setHeader('Set-Cookie', 'sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
}));

// Toutes les routes suivantes exigent une session
api.use(auth.requireAuth);
// Protection CSRF (en plus du cookie SameSite) : un corps de requête doit être du JSON
api.use((req, res, next) => {
  const hasBody = Number(req.headers['content-length'] || 0) > 0 || req.headers['transfer-encoding'];
  if (req.method !== 'GET' && hasBody && !req.is('application/json')) return res.status(415).json({ error: 'JSON attendu' });
  next();
});

api.get('/me', (req, res) => res.json(req.user));
api.post('/me/password', wrap((req, res) => {
  const { current, next } = req.body || {};
  const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!auth.verifyPassword(String(current || ''), u.password_hash)) throw bad('Mot de passe actuel incorrect');
  if (String(next || '').length < 8) throw bad('8 caractères minimum');
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(next), req.user.id);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Utilisateurs (admin)
api.get('/users', auth.requireAdmin, (req, res) => res.json(db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY name').all()));
api.post('/users', auth.requireAdmin, wrap((req, res) => {
  const { email, name, password, role } = req.body || {};
  if (!str(email) || !str(name)) throw bad('Nom et e-mail obligatoires');
  if (String(password || '').length < 8) throw bad('Mot de passe : 8 caractères minimum');
  const r = db.prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(str(email), str(name), auth.hashPassword(password), role === 'admin' ? 'admin' : 'user');
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));
api.put('/users/:id', auth.requireAdmin, wrap((req, res) => {
  const id = Number(req.params.id);
  const { name, role, password } = req.body || {};
  if (id === req.user.id && role && role !== 'admin') throw bad('Vous ne pouvez pas retirer vos propres droits administrateur');
  if (str(name)) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(str(name), id);
  if (role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role === 'admin' ? 'admin' : 'user', id);
  if (password) {
    if (String(password).length < 8) throw bad('Mot de passe : 8 caractères minimum');
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(auth.hashPassword(password), id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  }
  res.json({ ok: true });
}));
api.delete('/users/:id', auth.requireAdmin, wrap((req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw bad('Vous ne pouvez pas supprimer votre propre compte');
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Clients
const CLIENT_FIELDS = ['company_name', 'contact_name', 'email', 'phone', 'event_duration', 'participants', 'services',
  'event_year', 'event_month', 'event_day', 'rgpd', 'message', 'notes'];

api.get('/clients', (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`;
  res.json(db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) AS project_count,
      (SELECT MAX(occurred_at) FROM interactions i WHERE i.client_id = c.id) AS last_interaction
    FROM clients c WHERE (c.contact_name LIKE ? OR IFNULL(c.company_name,'') LIKE ? OR IFNULL(c.email,'') LIKE ? OR IFNULL(c.phone,'') LIKE ?)
    ORDER BY COALESCE(c.received_at, c.created_at) DESC`).all(q, q, q, q));
});

api.get('/clients.csv', (req, res) => {
  const rows = db.prepare('SELECT company_name, contact_name, email, phone, participants, services, created_at FROM clients ORDER BY contact_name').all();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Société/association', 'Nom', 'E-mail', 'Téléphone', 'Participants', 'Prestations', 'Créé le'];
  const csv = '﻿' + [head, ...rows.map((r) => Object.values(r))].map((r) => r.map(esc).join(';')).join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="repertoire-clients.csv"' }).send(csv);
});

api.get('/clients/:id', wrap((req, res) => {
  const c = db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(req.params.id));
  if (!c) throw notFound();
  c.projects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY COALESCE(project_date, created_at) DESC').all(c.id).map(withPhase);
  c.interactions = db.prepare(`SELECT i.*, u.name AS user_name, p.title AS project_title FROM interactions i
    LEFT JOIN users u ON u.id = i.user_id LEFT JOIN projects p ON p.id = i.project_id
    WHERE i.client_id = ? ORDER BY i.occurred_at DESC, i.id DESC`).all(c.id);
  res.json(c);
}));

api.post('/clients', wrap((req, res) => {
  const b = req.body || {};
  if (!str(b.contact_name)) throw bad('Le nom du contact est obligatoire');
  db.exec('BEGIN');
  try {
    const r = db.prepare(`INSERT INTO clients (${CLIENT_FIELDS.join(',')}, source, created_by) VALUES (${CLIENT_FIELDS.map(() => '?').join(',')}, 'manuel', ?)`)
      .run(...CLIENT_FIELDS.map((f) => str(b[f])), req.user.id);
    const id = Number(r.lastInsertRowid);
    // Un projet est créé avec chaque nouvelle fiche
    const { eventDate, eventEndDate } = require('./form-parser');
    const start = eventDate({ event_year: b.event_year, event_month: b.event_month, event_day: b.event_day });
    db.prepare('INSERT INTO projects (client_id, title, project_date, project_end_date) VALUES (?, ?, ?, ?)')
      .run(id, str(b.project_title) || `Projet ${str(b.company_name) || str(b.contact_name)}`, start, eventEndDate(start, b.event_duration));
    db.exec('COMMIT');
    res.status(201).json({ id });
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}));

api.put('/clients/:id', wrap((req, res) => {
  const b = req.body || {};
  if ('contact_name' in b && !str(b.contact_name)) throw bad('Le nom du contact est obligatoire');
  const fields = CLIENT_FIELDS.filter((f) => f in b);
  if (!fields.length) return res.json({ ok: true });
  const r = db.prepare(`UPDATE clients SET ${fields.map((f) => `${f} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...fields.map((f) => str(b[f])), now(), Number(req.params.id));
  if (!r.changes) throw notFound();
  res.json({ ok: true });
}));

api.delete('/clients/:id', wrap((req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Projets
// Phase pour le code couleur : à traiter (jaune), devis envoyé (orange), refusé (rouge), signé (vert)
function withPhase(p) {
  if (p.sent_count === undefined) {
    p.sent_count = db.prepare('SELECT COUNT(*) AS n FROM project_members WHERE project_id = ? AND quote_sent_to_client = 1').get(p.id).n;
  }
  p.phase = p.status === 'refuse' ? 'refuse'
    : p.status === 'accepte' ? 'signe'
    : p.status === 'reporte' ? 'reporte'
    : (p.proposal_sent || p.sent_count > 0) ? 'devis_envoye' : 'a_traiter';
  return p;
}

const PROJECT_LIST_SQL = `SELECT p.*, c.contact_name, c.company_name, c.participants,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.positioned = 1) AS positioned_count,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.quote_received = 1) AS received_count,
  (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id AND pm.quote_sent_to_client = 1) AS sent_count
  FROM projects p JOIN clients c ON c.id = p.client_id`;

api.get('/projects', wrap((req, res) => {
  const where = []; const args = [];
  const statuses = String(req.query.status || '').split(',').filter((s) => ['en_cours', 'refuse', 'reporte', 'accepte'].includes(s));
  if (statuses.length) { where.push(`p.status IN (${statuses.map(() => '?').join(',')})`); args.push(...statuses); }
  const col = req.query.dateField === 'quote' ? 'p.quote_date' : 'p.project_date';
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;
  if (req.query.overlap) {
    // calendrier : projets dont la période [début, fin] chevauche [from, to]
    if (from) { where.push('COALESCE(p.project_end_date, p.project_date) >= ?'); args.push(from); }
    if (to) { where.push('p.project_date <= ?'); args.push(to); }
  } else {
    if (from) { where.push(`${col} >= ?`); args.push(from); }
    if (to) { where.push(`${col} <= ?`); args.push(to); }
  }
  if (req.query.q) { where.push("(p.title LIKE ? OR c.contact_name LIKE ? OR IFNULL(c.company_name,'') LIKE ?)"); const q = `%${req.query.q}%`; args.push(q, q, q); }
  const rows = db.prepare(`${PROJECT_LIST_SQL} ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${col} IS NULL, ${col} ASC, p.created_at DESC`).all(...args).map(withPhase);
  const phases = String(req.query.phase || '').split(',').filter(Boolean);
  res.json(phases.length ? rows.filter((r) => phases.includes(r.phase)) : rows);
}));

api.get('/projects/:id', wrap((req, res) => {
  const p = db.prepare(`${PROJECT_LIST_SQL} WHERE p.id = ?`).get(Number(req.params.id));
  if (!p) throw notFound();
  withPhase(p);
  p.members = db.prepare(`SELECT m.id, m.name, m.town, m.active, mc.id AS category_id, mc.name AS category, mc.sort_order,
      IFNULL(pm.positioned, 0) AS positioned, IFNULL(pm.quote_received, 0) AS quote_received,
      IFNULL(pm.quote_sent_to_client, 0) AS quote_sent_to_client
    FROM members m JOIN member_categories mc ON mc.id = m.category_id
    LEFT JOIN project_members pm ON pm.member_id = m.id AND pm.project_id = ?
    WHERE m.active = 1 OR pm.member_id IS NOT NULL
    ORDER BY mc.sort_order, mc.name, m.name`).all(p.id);
  p.interactions = db.prepare(`SELECT i.*, u.name AS user_name FROM interactions i LEFT JOIN users u ON u.id = i.user_id
    WHERE i.project_id = ? ORDER BY i.occurred_at DESC`).all(p.id);
  res.json(p);
}));

const STATUSES = ['en_cours', 'refuse', 'reporte', 'accepte'];
function projectValues(b) {
  const v = {};
  if ('title' in b) { v.title = str(b.title); if (!v.title) throw bad('Le titre est obligatoire'); }
  if ('description' in b) v.description = b.description == null ? null : String(b.description);
  for (const f of ['project_date', 'project_end_date', 'quote_date', 'proposal_sent_date']) {
    if (f in b) { v[f] = str(b[f]); if (!isDate(v[f])) throw bad(`Date invalide : ${f}`); }
  }
  if ('proposal_sent' in b) v.proposal_sent = bool(b.proposal_sent);
  if ('status' in b) { if (!STATUSES.includes(b.status)) throw bad('Statut invalide'); v.status = b.status; }
  return v;
}

api.post('/projects', wrap((req, res) => {
  const b = req.body || {};
  if (!db.prepare('SELECT 1 FROM clients WHERE id = ?').get(Number(b.client_id))) throw bad('Client introuvable');
  const v = projectValues({ title: b.title || 'Nouveau projet', ...b });
  delete v.client_id;
  const cols = Object.keys(v);
  const r = db.prepare(`INSERT INTO projects (client_id, ${cols.join(',')}) VALUES (?, ${cols.map(() => '?').join(',')})`)
    .run(Number(b.client_id), ...cols.map((c) => v[c]));
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));

api.put('/projects/:id', wrap((req, res) => {
  const v = projectValues(req.body || {});
  if (v.proposal_sent === 1 && !('proposal_sent_date' in v)) {
    const cur = db.prepare('SELECT proposal_sent_date FROM projects WHERE id = ?').get(Number(req.params.id));
    if (cur && !cur.proposal_sent_date) v.proposal_sent_date = now().slice(0, 10);
  }
  const cols = Object.keys(v);
  if (!cols.length) return res.json({ ok: true });
  const r = db.prepare(`UPDATE projects SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .run(...cols.map((c) => v[c]), now(), Number(req.params.id));
  if (!r.changes) throw notFound();
  res.json({ ok: true });
}));

api.delete('/projects/:id', wrap((req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

// Ligne « membre » d'un projet : Se positionne / Devis reçu / Devis transmis au client
api.put('/projects/:id/members/:memberId', wrap((req, res) => {
  const pid = Number(req.params.id); const mid = Number(req.params.memberId);
  const b = req.body || {};
  const cur = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND member_id = ?').get(pid, mid)
    || { positioned: 0, quote_received: 0, quote_sent_to_client: 0 };
  const val = (k) => (k in b ? bool(b[k]) : cur[k]);
  db.prepare(`INSERT INTO project_members (project_id, member_id, positioned, quote_received, quote_sent_to_client, updated_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(project_id, member_id) DO UPDATE SET
    positioned = excluded.positioned, quote_received = excluded.quote_received,
    quote_sent_to_client = excluded.quote_sent_to_client, updated_at = excluded.updated_at`)
    .run(pid, mid, val('positioned'), val('quote_received'), val('quote_sent_to_client'), now());
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Interactions
const ITYPES = ['email', 'telephone', 'rencontre'];
api.post('/interactions', wrap((req, res) => {
  const b = req.body || {};
  if (!ITYPES.includes(b.type)) throw bad("Type d'échange invalide");
  if (!str(b.comment)) throw bad('Le commentaire est obligatoire');
  const r = db.prepare('INSERT INTO interactions (client_id, project_id, type, occurred_at, comment, user_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(Number(b.client_id), b.project_id ? Number(b.project_id) : null, b.type, str(b.occurred_at) || now(), String(b.comment), req.user.id);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));
api.put('/interactions/:id', wrap((req, res) => {
  const b = req.body || {};
  if (b.type && !ITYPES.includes(b.type)) throw bad("Type d'échange invalide");
  const cur = db.prepare('SELECT * FROM interactions WHERE id = ?').get(Number(req.params.id));
  if (!cur) throw notFound();
  db.prepare('UPDATE interactions SET type = ?, occurred_at = ?, comment = ?, project_id = ? WHERE id = ?')
    .run(b.type || cur.type, str(b.occurred_at) || cur.occurred_at, str(b.comment) || cur.comment,
      'project_id' in b ? (b.project_id ? Number(b.project_id) : null) : cur.project_id, cur.id);
  res.json({ ok: true });
}));
api.delete('/interactions/:id', wrap((req, res) => {
  db.prepare('DELETE FROM interactions WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Membres Escale
api.get('/categories', (req, res) => res.json(db.prepare(`SELECT mc.*, (SELECT COUNT(*) FROM members m WHERE m.category_id = mc.id) AS member_count
  FROM member_categories mc ORDER BY sort_order, name`).all()));
api.post('/categories', wrap((req, res) => {
  if (!str(req.body?.name)) throw bad('Nom obligatoire');
  const max = db.prepare('SELECT IFNULL(MAX(sort_order), 0) AS m FROM member_categories').get().m;
  const r = db.prepare('INSERT INTO member_categories (name, sort_order) VALUES (?, ?)').run(str(req.body.name), max + 1);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));
api.put('/categories/:id', wrap((req, res) => {
  const b = req.body || {};
  if (str(b.name)) db.prepare('UPDATE member_categories SET name = ? WHERE id = ?').run(str(b.name), Number(req.params.id));
  if (b.sort_order !== undefined) db.prepare('UPDATE member_categories SET sort_order = ? WHERE id = ?').run(Number(b.sort_order), Number(req.params.id));
  res.json({ ok: true });
}));
api.delete('/categories/:id', wrap((req, res) => {
  const n = db.prepare('SELECT COUNT(*) AS n FROM members WHERE category_id = ?').get(Number(req.params.id)).n;
  if (n) throw bad('Cette catégorie contient encore des membres');
  db.prepare('DELETE FROM member_categories WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

const MEMBER_FIELDS = ['name', 'category_id', 'town', 'contact_name', 'email', 'phone', 'website', 'active'];
api.get('/members', (req, res) => res.json(db.prepare(`SELECT m.*, mc.name AS category FROM members m
  JOIN member_categories mc ON mc.id = m.category_id ORDER BY mc.sort_order, mc.name, m.name`).all()));
function memberValues(b) {
  const v = {};
  for (const f of MEMBER_FIELDS) if (f in b) v[f] = f === 'active' ? bool(b[f]) : f === 'category_id' ? Number(b[f]) : str(b[f]);
  if ('name' in v && !v.name) throw bad('Nom obligatoire');
  return v;
}
api.post('/members', wrap((req, res) => {
  const v = memberValues({ active: 1, ...req.body });
  if (!v.name || !v.category_id) throw bad('Nom et catégorie obligatoires');
  const cols = Object.keys(v);
  const r = db.prepare(`INSERT INTO members (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map((c) => v[c]));
  res.status(201).json({ id: Number(r.lastInsertRowid) });
}));
api.put('/members/:id', wrap((req, res) => {
  const v = memberValues(req.body || {}); const cols = Object.keys(v);
  if (cols.length) db.prepare(`UPDATE members SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run(...cols.map((c) => v[c]), Number(req.params.id));
  res.json({ ok: true });
}));
api.delete('/members/:id', wrap((req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

// ------------------------------------------------------------------ Import des e-mails
api.get('/import/status', (req, res) => res.json(mail.status()));
api.post('/import/check', wrap(async (req, res) => {
  const r = await mail.checkMailbox();
  if (!r.ok) throw bad(r.error);
  res.json(r);
}));
// Import manuel : coller le contenu (HTML ou texte) d'un e-mail de formulaire
api.post('/import/paste', wrap((req, res) => {
  const content = String(req.body?.content || '');
  if (!content.trim()) throw bad('Contenu vide');
  const isHtml = /<\s*(table|tr|td|strong|html)/i.test(content);
  const id = mail.createFromEmail({ html: isHtml ? content : null, text: isHtml ? '' : content, userId: req.user.id });
  res.status(201).json({ id });
}));

app.use('/api', api);
app.use('/api', (req, res) => res.status(404).json({ error: 'Route inconnue' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));

auth.ensureAdmin();
const PORT = Number(process.env.PORT || 3000);
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CRM Escale en Presqu'île : http://localhost:${PORT}`);
    mail.startPolling();
  });
}
module.exports = app;
