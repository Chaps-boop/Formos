// Analyse des e-mails « Nouvel envoi de formulaire Escale en presqu'île »
// envoyés par Gravity Forms (WordPress) : un libellé en <strong>, puis la valeur
// dans la ligne de tableau suivante.
const { parse } = require('node-html-parser');

const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9/ ]+/g, ' ')
  .replace(/\s+/g, ' ').trim();

// libellé normalisé -> colonne de la fiche client
const FIELD_MAP = [
  [/^(votre )?nom( et prenom| complet)?$|^prenom nom$/, 'contact_name'],
  [/(adresse )?e ?mail|courriel/, 'email'],
  [/telephone|portable|^tel$/, 'phone'],
  [/duree/, 'event_duration'],
  [/nombre de (participants|personnes)|participants/, 'participants'],
  [/prestations?/, 'services'],
  [/^annee$/, 'event_year'],
  [/^mois$/, 'event_month'],
  [/^jour$/, 'event_day'],
  [/rgpd|confidentialite/, 'rgpd'],
  [/message|commentaire|precisions|votre demande/, 'message'],
  [/societe|entreprise|association|organisme|structure/, 'company_name'],
];

function mapLabel(label) {
  const n = norm(label);
  for (const [re, col] of FIELD_MAP) if (re.test(n)) return col;
  return null;
}

const clean = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

/** Renvoie la liste ordonnée des couples { label, value } trouvés dans le HTML. */
function extractPairs(html) {
  const root = parse(html);
  const rows = root.querySelectorAll('tr').filter((tr) => tr.querySelectorAll('tr').length === 0);
  const pairs = [];
  let pending = null;
  for (const tr of rows) {
    const strong = tr.querySelector('strong');
    if (strong) { pending = clean(strong.text).replace(/\s*:\s*$/, ''); continue; }
    if (!pending) continue; // titre de section (« Votre événement : ») ou ligne vide
    const lis = tr.querySelectorAll('li');
    const value = lis.length ? lis.map((li) => clean(li.text)).filter(Boolean).join(', ') : clean(tr.text);
    pairs.push({ label: pending, value });
    pending = null;
  }
  return pairs;
}

/** Repli pour un e-mail texte : lignes « Libellé : valeur ». */
function extractPairsFromText(text) {
  const pairs = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const m = line.match(/^\s*([^:]{2,60}?)\s*:\s*(.+)$/);
    if (m) pairs.push({ label: clean(m[1]), value: clean(m[2]) });
  }
  return pairs;
}

const MONTHS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const pad = (n) => String(n).padStart(2, '0');

/** Date de l'événement (YYYY-MM-DD) à partir des champs Année / Mois / Jour. */
function eventDate(c) {
  const y = parseInt(c.event_year, 10);
  if (!y) return null;
  let m = parseInt(c.event_month, 10);
  if (!m) { const i = MONTHS.indexOf(norm(c.event_month)); m = i >= 0 ? i + 1 : 0; }
  if (!m) return null;
  const d = parseInt(c.event_day, 10) || 1;
  return `${y}-${pad(m)}-${pad(Math.min(d, 31))}`;
}

/** Date de fin estimée d'après « Durée de l'événement » (« 2 jours » -> +1 jour). */
function eventEndDate(start, duration) {
  if (!start) return null;
  const m = norm(duration).match(/(\d+)\s*jours?/);
  const days = m ? parseInt(m[1], 10) : 1;
  const dt = new Date(start + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + Math.max(days, 1) - 1);
  return dt.toISOString().slice(0, 10);
}

/** Transforme un e-mail de formulaire en données de fiche client. */
function parseFormEmail({ html, text }) {
  let pairs = html ? extractPairs(html) : [];
  if (!pairs.length) pairs = extractPairsFromText(text);
  const client = {};
  const extra = {};
  for (const { label, value } of pairs) {
    const col = mapLabel(label);
    if (col && !client[col]) client[col] = value;
    else extra[label] = value;
  }
  if (client.email) client.email = client.email.replace(/^mailto:/i, '');
  if (client.rgpd) client.rgpd = client.rgpd.replace(/^\W+/, '');
  client.extra_fields = Object.keys(extra).length ? JSON.stringify(extra) : null;
  const start = eventDate(client);
  return { client, pairs, projectDate: start, projectEndDate: eventEndDate(start, client.event_duration) };
}

module.exports = { parseFormEmail, extractPairs, eventDate, eventEndDate };
