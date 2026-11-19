// Import automatique des demandes reçues par e-mail (IMAP Gmail).
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const db = require('./db');
const { parseFormEmail } = require('./form-parser');

const cfg = {
  host: process.env.IMAP_HOST || 'imap.gmail.com',
  port: Number(process.env.IMAP_PORT || 993),
  user: process.env.IMAP_USER,
  pass: process.env.IMAP_PASSWORD,
  mailbox: process.env.IMAP_MAILBOX || 'INBOX',
  from: process.env.FORM_SENDER || 'info@escaleenpresquile.bzh',
  subject: process.env.FORM_SUBJECT || 'Nouvel envoi de formulaire',
  since: process.env.IMAP_SINCE || null, // ex. 2026-01-01 pour reprendre l'historique
  intervalMin: Number(process.env.IMAP_POLL_MINUTES || 5),
};

const setSetting = (k, v) => db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, String(v));
const getSetting = (k) => db.prepare('SELECT value FROM settings WHERE key = ?').get(k)?.value ?? null;

const CLIENT_COLS = ['company_name', 'contact_name', 'email', 'phone', 'event_duration', 'participants', 'services',
  'event_year', 'event_month', 'event_day', 'rgpd', 'message', 'extra_fields'];

/** Crée la fiche client + le projet associé à partir d'un e-mail. Renvoie l'id client ou null si déjà importé. */
function createFromEmail({ html, text, messageId, date, userId = null }) {
  if (messageId && db.prepare('SELECT 1 FROM clients WHERE email_message_id = ?').get(messageId)) return null;
  const { client, projectDate, projectEndDate } = parseFormEmail({ html, text });
  if (!client.contact_name && !client.email) throw new Error("Aucun champ de formulaire reconnu dans cet e-mail");
  client.contact_name = client.contact_name || client.email;

  db.exec('BEGIN');
  try {
    const cols = CLIENT_COLS.filter((c) => client[c] != null);
    const r = db.prepare(`INSERT INTO clients (${cols.join(',')}, source, email_message_id, received_at, created_by)
      VALUES (${cols.map(() => '?').join(',')}, 'formulaire', ?, ?, ?)`)
      .run(...cols.map((c) => client[c]), messageId || null, date || new Date().toISOString(), userId);
    const clientId = Number(r.lastInsertRowid);
    const title = `Demande de ${client.contact_name}${client.participants ? ` (${client.participants} pers.)` : ''}`;
    const p = db.prepare(`INSERT INTO projects (client_id, title, project_date, project_end_date) VALUES (?, ?, ?, ?)`)
      .run(clientId, title, projectDate, projectEndDate);
    db.prepare(`INSERT INTO interactions (client_id, project_id, type, occurred_at, comment, user_id) VALUES (?, ?, 'email', ?, ?, NULL)`)
      .run(clientId, Number(p.lastInsertRowid), date || new Date().toISOString(),
        `Demande reçue via le formulaire du site.${client.services ? ` Prestations attendues : ${client.services}.` : ''}`);
    db.exec('COMMIT');
    return clientId;
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

let running = false;
async function checkMailbox() {
  if (!cfg.user || !cfg.pass) return { ok: false, error: 'IMAP non configuré (IMAP_USER / IMAP_PASSWORD)' };
  if (running) return { ok: false, error: 'Vérification déjà en cours' };
  running = true;
  const client = new ImapFlow({ host: cfg.host, port: cfg.port, secure: true, auth: { user: cfg.user, pass: cfg.pass }, logger: false });
  let created = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock(cfg.mailbox);
    try {
      const last = getSetting('imap_last_check');
      const since = last ? new Date(new Date(last).getTime() - 2 * 86400e3) : (cfg.since ? new Date(cfg.since) : new Date(Date.now() - 30 * 86400e3));
      const uids = await client.search({ from: cfg.from, subject: cfg.subject, since }, { uid: true });
      for (const uid of uids || []) {
        const msg = await client.fetchOne(uid, { source: true }, { uid: true });
        const mail = await simpleParser(msg.source);
        try {
          const id = createFromEmail({
            html: mail.html || null, text: mail.text || '',
            messageId: mail.messageId || `uid-${uid}`, date: (mail.date || new Date()).toISOString(),
          });
          if (id) created++;
        } catch (e) { console.warn('[import] e-mail ignoré :', e.message); }
      }
    } finally { lock.release(); }
    await client.logout();
    setSetting('imap_last_check', new Date().toISOString());
    setSetting('imap_last_result', `${created} nouvelle(s) demande(s)`);
    return { ok: true, created };
  } catch (e) {
    setSetting('imap_last_result', `Erreur : ${e.message}`);
    return { ok: false, error: e.message };
  } finally { running = false; }
}

function startPolling() {
  if (!cfg.user || !cfg.pass) { console.log('[import] IMAP non configuré : import automatique désactivé.'); return; }
  const run = () => checkMailbox().then((r) => r.ok ? r.created && console.log(`[import] ${r.created} nouvelle(s) fiche(s)`) : console.warn('[import]', r.error));
  run();
  setInterval(run, cfg.intervalMin * 60e3);
  console.log(`[import] Boîte ${cfg.user} vérifiée toutes les ${cfg.intervalMin} min.`);
}

const status = () => ({ configured: Boolean(cfg.user && cfg.pass), mailbox: cfg.user || null,
  lastCheck: getSetting('imap_last_check'), lastResult: getSetting('imap_last_result') });

module.exports = { checkMailbox, startPolling, createFromEmail, status };
