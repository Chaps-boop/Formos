const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'escale-'));
process.env.DB_PATH = path.join(dir, 'test.sqlite');
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'motdepasse-admin';
const app = require('../src/server');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}/api`; r(); }); }));
test.after(() => server.close());

function client() {
  let cookie = '';
  return async (method, url, body) => {
    const res = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const ct = res.headers.get('content-type') || '';
    return { status: res.status, body: ct.includes('json') ? await res.json() : await res.text() };
  };
}

test('parcours complet', async () => {
  const admin = client();
  assert.equal((await admin('GET', '/clients')).status, 401);
  assert.equal((await admin('POST', '/login', { email: 'admin@test.local', password: 'faux' })).status, 401);
  assert.equal((await admin('POST', '/login', { email: 'admin@test.local', password: 'motdepasse-admin' })).status, 200);

  // utilisateurs : seul l'admin crée / supprime
  const u = await admin('POST', '/users', { name: 'Marie', email: 'marie@test.local', password: '12345678', role: 'user' });
  assert.equal(u.status, 201);
  const user = client();
  await user('POST', '/login', { email: 'marie@test.local', password: '12345678' });
  assert.equal((await user('POST', '/users', { name: 'X', email: 'x@test.local', password: '12345678' })).status, 403);
  assert.equal((await user('DELETE', `/users/${u.body.id}`)).status, 403);

  // import d'un e-mail de formulaire
  const html = fs.readFileSync(path.join(__dirname, 'fixture-form.html'), 'utf8');
  const imp = await user('POST', '/import/paste', { content: html });
  assert.equal(imp.status, 201);
  const c = (await user('GET', `/clients/${imp.body.id}`)).body;
  assert.equal(c.contact_name, 'Camille EXEMPLE');
  assert.equal(c.source, 'formulaire');
  assert.equal(c.projects.length, 1);
  assert.equal(c.projects[0].project_date, '2027-06-04');
  assert.equal(c.projects[0].phase, 'a_traiter');
  assert.equal(c.interactions.length, 1);

  // société ajoutée à la fiche
  await user('PUT', `/clients/${c.id}`, { company_name: 'Exemple SARL' });
  assert.equal((await user('GET', `/clients/${c.id}`)).body.company_name, 'Exemple SARL');

  // fiche manuelle
  const m = await user('POST', '/clients', { contact_name: 'Paul Manuel', company_name: 'Asso Voile', event_year: '2027', event_month: 'Mars', event_day: '10', event_duration: 'Journée' });
  assert.equal(m.status, 201);

  // projet : membres, phases
  const pid = c.projects[0].id;
  const p = (await user('GET', `/projects/${pid}`)).body;
  assert.equal(p.members.length, 24);
  const mem = p.members[0].id;
  await user('PUT', `/projects/${pid}/members/${mem}`, { positioned: true });
  await user('PUT', `/projects/${pid}/members/${mem}`, { quote_received: true });
  let p2 = (await user('GET', `/projects/${pid}`)).body;
  const row = p2.members.find((x) => x.id === mem);
  assert.deepEqual([row.positioned, row.quote_received, row.quote_sent_to_client], [1, 1, 0]);
  assert.equal(p2.phase, 'a_traiter');
  await user('PUT', `/projects/${pid}/members/${mem}`, { quote_sent_to_client: true });
  assert.equal((await user('GET', `/projects/${pid}`)).body.phase, 'devis_envoye');
  await user('PUT', `/projects/${pid}`, { status: 'accepte', quote_date: '2026-12-01', description: 'Séminaire 2 jours' });
  p2 = (await user('GET', `/projects/${pid}`)).body;
  assert.equal(p2.phase, 'signe');
  assert.equal(p2.description, 'Séminaire 2 jours');
  assert.equal((await user('PUT', `/projects/${pid}`, { status: 'nimporte' })).status, 400);

  // filtres du suivi
  assert.equal((await user('GET', '/projects?status=accepte')).body.length, 1);
  assert.equal((await user('GET', '/projects?status=en_cours')).body.length, 1);
  assert.equal((await user('GET', '/projects?dateField=quote&from=2026-11-01&to=2026-12-31')).body.length, 1);
  assert.equal((await user('GET', '/projects?overlap=1&from=2027-06-05&to=2027-06-30')).body.length, 1);

  // interactions
  const it = await user('POST', '/interactions', { client_id: c.id, project_id: pid, type: 'telephone', occurred_at: '2026-11-19T10:00:00.000Z', comment: 'Appel de suivi' });
  assert.equal(it.status, 201);
  assert.ok((await user('GET', `/clients/${c.id}`)).body.interactions.some((i) => i.comment === 'Appel de suivi' && i.user_name === 'Marie'));

  // membres modifiables
  const cats = (await user('GET', '/categories')).body;
  const nm = await user('POST', '/members', { name: 'Nouveau membre', category_id: cats[0].id });
  assert.equal(nm.status, 201);
  await user('PUT', `/members/${nm.body.id}`, { active: false });
  assert.equal((await user('GET', `/projects/${pid}`)).body.members.length, 24);

  // export CSV
  const csv = await user('GET', '/clients.csv');
  assert.match(csv.body, /Exemple SARL/);

  // un doublon d'e-mail n'est pas réimporté
  const { createFromEmail } = require('../src/mail-import');
  assert.ok(createFromEmail({ html, messageId: '<abc@x>' }));
  assert.equal(createFromEmail({ html, messageId: '<abc@x>' }), null);
});
