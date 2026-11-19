/* CRM Escale en Presqu'île — interface */
'use strict';

// ---------------------------------------------------------------- utilitaires
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const view = () => $('#view');
// Remplace #view par un nœud neuf : les écouteurs de la page précédente disparaissent
function resetView() { const v = view(); const n = v.cloneNode(false); v.replaceWith(n); return n; }
let ME = null;

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    method: opts.method || 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 401 && path !== '/login') { showLogin(); throw new Error('Session expirée'); }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);
  return data;
}

let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// Dates SQLite « AAAA-MM-JJ HH:MM:SS » (UTC) -> ISO, lisible par tous les navigateurs
const toDate = (d) => new Date(d.length === 10 ? d + 'T12:00:00' : /^\d{4}-\d{2}-\d{2} /.test(d) ? d.replace(' ', 'T') + 'Z' : d);
const fmtDate = (d) => d ? toDate(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
const fmtDateTime = (d) => d ? toDate(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const localNow = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

const STATUS = { en_cours: 'En cours', accepte: 'Accepté', refuse: 'Refusé', reporte: 'Reporté' };
const PHASE = { a_traiter: 'À traiter', devis_envoye: 'Devis envoyés', refuse: 'Proposition refusée', signe: 'Devis signé', reporte: 'Reporté' };
const ITYPE = { email: 'E-mail', telephone: 'Téléphone', rencontre: 'Rencontre' };
const statusBadge = (s) => `<span class="badge st-${s}">${STATUS[s] || s}</span>`;
const phaseDot = (p) => `<span class="dot ph-${p}" title="${PHASE[p]}"></span>`;
const legend = () => `<div class="legend">${Object.entries(PHASE).map(([k, v]) => `<span>${phaseDot(k)} ${v}</span>`).join('')}</div>`;
const formData = (form) => Object.fromEntries(new FormData(form).entries());

// ---------------------------------------------------------------- authentification
function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
async function boot() {
  try { ME = await api('/me'); } catch { return showLogin(); }
  $('#login').hidden = true; $('#app').hidden = false;
  $('#me-name').textContent = `${ME.name} · ${ME.role === 'admin' ? 'administrateur' : 'utilisateur'}`;
  $$('.admin-only').forEach((el) => { el.hidden = ME.role !== 'admin'; });
  route();
}
$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await api('/login', { method: 'POST', body: formData(e.target) }); $('#login-error').textContent = ''; boot(); }
  catch (err) { $('#login-error').textContent = err.message; }
});
$('#logout').addEventListener('click', async () => { await api('/logout', { method: 'POST', body: {} }); ME = null; showLogin(); });
$('#menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

// ---------------------------------------------------------------- routeur
const routes = [
  [/^#\/projets\/(\d+)$/, (id) => projectPage(+id)],
  [/^#\/projets$/, projectsPage],
  [/^#\/calendrier$/, calendarPage],
  [/^#\/clients\/nouveau$/, newClientPage],
  [/^#\/clients\/(\d+)$/, (id) => clientPage(+id)],
  [/^#\/clients$/, clientsPage],
  [/^#\/repertoire$/, directoryPage],
  [/^#\/membres$/, membersPage],
  [/^#\/utilisateurs$/, usersPage],
  [/^#\/compte$/, accountPage],
];
function route() {
  if (!ME) return;
  const hash = location.hash || '#/projets';
  $('.sidebar').classList.remove('open');
  $$('#nav a').forEach((a) => a.classList.toggle('active', hash.startsWith('#/' + a.dataset.nav)));
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) { resetView().innerHTML = '<p class="muted">Chargement…</p>'; guard(fn)(...m.slice(1)); window.scrollTo(0, 0); return; }
  }
  location.hash = '#/projets';
}
window.addEventListener('hashchange', route);

// ---------------------------------------------------------------- suivi des projets
const projFilters = { status: ['en_cours'], dateField: 'project', from: '', to: '', q: '' };
async function projectsPage() {
  resetView().innerHTML = `
    <div class="page-head"><div><h1>Suivi des projets</h1><p class="muted">Toutes les demandes et leur avancement</p></div>
      <div class="actions"><a class="btn primary" href="#/clients/nouveau">+ Nouvelle fiche client</a></div></div>
    <div class="card">
      <form class="filters" id="pf">
        <fieldset><legend>Devis</legend>
          ${Object.entries(STATUS).map(([k, v]) => `<label class="chip"><input type="checkbox" name="status" value="${k}" ${projFilters.status.includes(k) ? 'checked' : ''}>${v}</label>`).join('')}
        </fieldset>
        <label>Filtrer sur<select name="dateField">
          <option value="project" ${projFilters.dateField === 'project' ? 'selected' : ''}>Date du projet</option>
          <option value="quote" ${projFilters.dateField === 'quote' ? 'selected' : ''}>Date du devis</option></select></label>
        <label>Du<input type="date" name="from" value="${projFilters.from}"></label>
        <label>Au<input type="date" name="to" value="${projFilters.to}"></label>
        <label>Recherche<input type="search" name="q" value="${esc(projFilters.q)}" placeholder="Client, société, projet"></label>
        <button type="button" class="btn small" id="pf-reset">Réinitialiser</button>
      </form>
    </div>
    <div class="card"><div class="page-head" style="margin-bottom:10px"><div id="pcount" class="muted"></div>${legend()}</div>
      <div class="table-wrap" id="ptable"></div></div>`;
  const form = $('#pf');
  const load = guard(async () => {
    const st = $$('input[name=status]:checked', form).map((i) => i.value);
    Object.assign(projFilters, { status: st, dateField: form.dateField.value, from: form.from.value, to: form.to.value, q: form.q.value.trim() });
    const qs = new URLSearchParams({ status: st.join(','), dateField: projFilters.dateField, from: projFilters.from, to: projFilters.to, q: projFilters.q });
    const rows = await api('/projects?' + qs);
    $('#pcount').textContent = `${rows.length} projet${rows.length > 1 ? 's' : ''}`;
    $('#ptable').innerHTML = rows.length ? `<table><thead><tr><th></th><th>Projet</th><th>Client</th><th>Date projet</th><th>Date devis</th>
      <th class="center">Proposition envoyée</th><th class="center">Positionnés</th><th class="center">Devis reçus</th><th class="center">Transmis</th><th>Statut</th></tr></thead><tbody>
      ${rows.map((p) => `<tr class="click" data-href="#/projets/${p.id}">
        <td>${phaseDot(p.phase)}</td><td><strong>${esc(p.title)}</strong></td>
        <td>${esc(p.company_name || '')}${p.company_name ? '<br>' : ''}<span class="muted">${esc(p.contact_name)}</span></td>
        <td>${fmtDate(p.project_date)}</td><td>${fmtDate(p.quote_date)}</td>
        <td class="center">${p.proposal_sent ? `✔ ${fmtDate(p.proposal_sent_date)}` : '—'}</td>
        <td class="center">${p.positioned_count}</td><td class="center">${p.received_count}</td><td class="center">${p.sent_count}</td>
        <td>${statusBadge(p.status)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Aucun projet ne correspond à ces filtres.</div>';
  });
  form.addEventListener('change', load);
  form.q.addEventListener('input', debounce(load, 300));
  $('#pf-reset').addEventListener('click', () => { Object.assign(projFilters, { status: [], dateField: 'project', from: '', to: '', q: '' }); projectsPage(); });
  $('#ptable').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href; });
  load();
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ---------------------------------------------------------------- calendrier
let calMonth = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
async function calendarPage() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1);
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)); // lundi
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const projects = await api(`/projects?overlap=1&from=${iso(days[0])}&to=${iso(days[41])}`);
  const today = iso(new Date());
  resetView().innerHTML = `
    <div class="page-head"><div><h1>Calendrier des projets</h1>${legend()}</div>
      <div class="cal-head"><button class="btn" id="cprev" aria-label="Mois précédent">‹</button>
        <h2>${first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
        <button class="btn" id="cnext" aria-label="Mois suivant">›</button><button class="btn small" id="ctoday">Aujourd'hui</button></div></div>
    <div class="card" style="padding:0;overflow:hidden"><div class="calendar">
      ${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="dow">${d}</div>`).join('')}
      ${days.map((d) => {
        const ds = iso(d);
        const evs = projects.filter((p) => p.project_date && p.project_date <= ds && (p.project_end_date || p.project_date) >= ds);
        return `<div class="day ${d.getMonth() !== m ? 'other' : ''} ${ds === today ? 'today' : ''}"><span class="num">${d.getDate()}</span>
          ${evs.map((p) => `<a class="ev ph-${p.phase}" href="#/projets/${p.id}" title="${esc(p.title)} — ${PHASE[p.phase]}">${esc(p.company_name || p.contact_name)}</a>`).join('')}</div>`;
      }).join('')}
    </div></div>
    <p class="muted">Les projets sont placés sur leur date de projet (début → fin). Les projets sans date n'apparaissent que dans le suivi.</p>`;
  $('#cprev').onclick = () => { calMonth = new Date(y, m - 1, 1); calendarPage(); };
  $('#cnext').onclick = () => { calMonth = new Date(y, m + 1, 1); calendarPage(); };
  $('#ctoday').onclick = () => { const d = new Date(); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); calendarPage(); };
}

// ---------------------------------------------------------------- fiches clients
const CLIENT_FORM = [
  ['company_name', 'Nom de société/association'], ['contact_name', 'Votre nom *'], ['email', 'Votre adresse e-mail', 'email'],
  ['phone', 'Téléphone', 'tel'], ['event_duration', "Durée de l'événement"], ['participants', 'Nombre de participants'],
  ['services', 'Prestations attendues'], ['event_year', 'Date de l\'événement : année'], ['event_month', 'Mois'], ['event_day', 'Jour'],
  ['rgpd', 'RGPD'],
];
const DURATIONS = ['2 heures', 'Demi journée', 'Journée', '2 jours', '3 jours', 'Plus de 3 jours'];
const PARTICIPANTS = ['Moins de 10', '10 à 20', '20 à 50', '50 à 100', '100 à 200', 'Plus de 200'];
const SERVICES = ['Activités Culturelles', 'Activités Nautiques', 'Sports & Loisirs', 'Hébergements', 'Restauration', 'Transports', 'Salle de séminaire'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function clientFields(c = {}) {
  const dl = (id, list) => `<datalist id="${id}">${list.map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;
  const list = { event_duration: 'dl-dur', participants: 'dl-part', event_month: 'dl-month' };
  return `<div class="grid2">${CLIENT_FORM.map(([k, label, type]) => {
    if (k === 'services') {
      const sel = String(c.services || '').split(',').map((s) => s.trim()).filter(Boolean);
      const all = [...new Set([...SERVICES, ...sel])];
      return `<fieldset style="grid-column:1/-1;border:0;padding:0;margin:0"><legend class="muted" style="font-size:13px;margin-bottom:6px">Prestations attendues</legend>
        <div class="actions">${all.map((s) => `<label class="chip"><input type="checkbox" name="services" value="${esc(s)}" ${sel.includes(s) ? 'checked' : ''}>${esc(s)}</label>`).join('')}</div></fieldset>`;
    }
    return `<label>${label}<input name="${k}" type="${type || 'text'}" value="${esc(c[k])}" ${list[k] ? `list="${list[k]}"` : ''} ${k === 'contact_name' ? 'required' : ''}></label>`;
  }).join('')}
    <label style="grid-column:1/-1">Message<textarea name="message">${esc(c.message)}</textarea></label>
    <label style="grid-column:1/-1">Notes internes<textarea name="notes">${esc(c.notes)}</textarea></label>
  </div>${dl('dl-dur', DURATIONS)}${dl('dl-part', PARTICIPANTS)}${dl('dl-month', MONTHS)}`;
}
function readClientForm(form) {
  const d = formData(form);
  d.services = $$('input[name=services]:checked', form).map((i) => i.value).join(', ');
  return d;
}

async function clientsPage() {
  resetView().innerHTML = `
    <div class="page-head"><div><h1>Fiches clients</h1><p class="muted" id="imp-status"></p></div>
      <div class="actions">
        <button class="btn" id="imp-check">↻ Vérifier la boîte mail</button>
        <button class="btn" id="imp-paste">Importer un e-mail</button>
        <a class="btn primary" href="#/clients/nouveau">+ Nouvelle fiche</a></div></div>
    <div class="card"><label>Recherche<input type="search" id="cq" placeholder="Nom, société, e-mail, téléphone"></label></div>
    <div class="card"><div class="table-wrap" id="ctable"></div></div>
    <dialog id="paste-dlg"><form method="dialog" id="paste-form">
      <h2>Importer un e-mail de formulaire</h2>
      <p class="muted">Collez le contenu de l'e-mail « Nouvel envoi de formulaire » (texte ou HTML). La fiche client et le projet seront créés automatiquement.</p>
      <textarea name="content" class="big" required></textarea>
      <div class="form-foot"><button class="btn" value="cancel" formnovalidate>Annuler</button><button class="btn primary" value="ok">Créer la fiche</button></div>
    </form></dialog>`;
  const load = guard(async () => {
    const rows = await api('/clients?q=' + encodeURIComponent($('#cq').value));
    $('#ctable').innerHTML = rows.length ? `<table><thead><tr><th>Société / association</th><th>Contact</th><th>E-mail</th><th>Téléphone</th><th>Participants</th><th>Origine</th><th>Reçu le</th><th class="center">Projets</th></tr></thead><tbody>
      ${rows.map((c) => `<tr class="click" data-href="#/clients/${c.id}"><td><strong>${esc(c.company_name || '—')}</strong></td><td>${esc(c.contact_name)}</td>
        <td>${esc(c.email)}</td><td>${esc(c.phone)}</td><td>${esc(c.participants)}</td>
        <td><span class="badge">${c.source === 'formulaire' ? 'Formulaire' : 'Manuel'}</span></td>
        <td>${fmtDate(c.received_at || c.created_at)}</td><td class="center">${c.project_count}</td></tr>`).join('')}</tbody></table>`
      : '<div class="empty">Aucune fiche client.</div>';
  });
  $('#cq').addEventListener('input', debounce(load, 250));
  $('#ctable').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href; });
  const showStatus = guard(async () => {
    const s = await api('/import/status');
    $('#imp-status').textContent = s.configured
      ? `Import automatique actif (${s.mailbox})${s.lastCheck ? ` · dernière vérification ${fmtDateTime(s.lastCheck)} : ${s.lastResult}` : ''}`
      : "Import automatique non configuré : voir le fichier .env (IMAP_USER / IMAP_PASSWORD).";
  });
  $('#imp-check').onclick = guard(async () => {
    toast('Vérification de la boîte mail…');
    const r = await api('/import/check', { method: 'POST', body: {} });
    toast(`${r.created} nouvelle(s) demande(s) importée(s)`); load(); showStatus();
  });
  const dlg = $('#paste-dlg');
  $('#imp-paste').onclick = () => { $('#paste-form').reset(); dlg.showModal(); };
  dlg.addEventListener('close', guard(async () => {
    if (dlg.returnValue !== 'ok') return;
    const r = await api('/import/paste', { method: 'POST', body: { content: $('#paste-form').content.value } });
    if (!r.id) return toast('Cet e-mail a déjà été importé');
    toast('Fiche créée'); location.hash = `#/clients/${r.id}`;
  }));
  load(); showStatus();
}

async function newClientPage() {
  resetView().innerHTML = `<div class="page-head"><div><h1>Nouvelle fiche client</h1><p class="muted">Un projet est créé automatiquement avec la fiche.</p></div></div>
    <form class="card" id="cf">${clientFields()}
      <label style="margin-top:12px">Titre du projet<input name="project_title" placeholder="ex. Séminaire de printemps"></label>
      <div class="form-foot"><a class="btn" href="#/clients">Annuler</a><button class="btn primary">Créer la fiche</button></div></form>`;
  $('#cf').addEventListener('submit', guard(async (e) => {
    e.preventDefault();
    const r = await api('/clients', { method: 'POST', body: readClientForm(e.target) });
    toast('Fiche créée'); location.hash = `#/clients/${r.id}`;
  }));
}

function interactionForm(clientId, projects, projectId) {
  return `<form class="card" id="itf"><h2>Nouvel échange</h2><div class="grid2">
      <label>Type<select name="type">${Object.entries(ITYPE).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>Date et heure<input type="datetime-local" name="occurred_at" value="${localNow()}" required></label>
      ${projects ? `<label style="grid-column:1/-1">Projet<select name="project_id"><option value="">—</option>${projects.map((p) => `<option value="${p.id}" ${p.id === projectId ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></label>` : ''}
      <label style="grid-column:1/-1">Commentaire<textarea name="comment" required placeholder="Résumé de l'échange, prochaines étapes…"></textarea></label>
    </div><input type="hidden" name="client_id" value="${clientId}">${projectId && !projects ? `<input type="hidden" name="project_id" value="${projectId}">` : ''}
    <div class="form-foot"><button class="btn primary">Ajouter</button></div></form>`;
}
function bindInteractionForm(after) {
  $('#itf').addEventListener('submit', guard(async (e) => {
    e.preventDefault();
    const d = formData(e.target);
    d.occurred_at = new Date(d.occurred_at).toISOString();
    await api('/interactions', { method: 'POST', body: d });
    toast('Échange enregistré'); after();
  }));
}
function timeline(items, showProject = true) {
  if (!items.length) return '<div class="empty">Aucun échange enregistré.</div>';
  return `<ul class="timeline">${items.map((i) => `<li data-id="${i.id}">
    <div class="meta"><span class="badge it-${i.type}">${ITYPE[i.type]}</span><strong>${fmtDateTime(i.occurred_at)}</strong>
      ${i.user_name ? `<span>par ${esc(i.user_name)}</span>` : '<span>automatique</span>'}
      ${showProject && i.project_title ? `<span>· ${esc(i.project_title)}</span>` : ''}
      <span style="margin-left:auto" class="actions"><button class="btn small it-edit">Modifier</button><button class="btn small danger it-del">Supprimer</button></span></div>
    <div class="comment">${esc(i.comment)}</div>
    <div class="muted" style="font-size:12px">Saisi le ${fmtDateTime(i.created_at)}</div></li>`).join('')}</ul>`;
}
function bindTimeline(root, items, after) {
  root.addEventListener('click', guard(async (e) => {
    const li = e.target.closest('li[data-id]'); if (!li) return;
    const it = items.find((i) => i.id === +li.dataset.id);
    if (e.target.classList.contains('it-del')) {
      if (!confirm('Supprimer cet échange ?')) return;
      await api(`/interactions/${it.id}`, { method: 'DELETE' }); toast('Échange supprimé'); after();
    } else if (e.target.classList.contains('it-edit')) {
      li.innerHTML = `<form class="grid2"><label>Type<select name="type">${Object.entries(ITYPE).map(([k, v]) => `<option value="${k}" ${k === it.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Date et heure<input type="datetime-local" name="occurred_at" value="${toLocalInput(it.occurred_at)}"></label>
        <label style="grid-column:1/-1">Commentaire<textarea name="comment">${esc(it.comment)}</textarea></label>
        <div class="form-foot" style="grid-column:1/-1"><button type="button" class="btn small it-cancel">Annuler</button><button class="btn small primary">Enregistrer</button></div></form>`;
      $('.it-cancel', li).onclick = after;
      $('form', li).addEventListener('submit', guard(async (ev) => {
        ev.preventDefault(); const d = formData(ev.target); d.occurred_at = new Date(d.occurred_at).toISOString();
        await api(`/interactions/${it.id}`, { method: 'PUT', body: d }); toast('Échange modifié'); after();
      }));
    }
  }));
}

async function clientPage(id) {
  const c = await api(`/clients/${id}`);
  let extra = {}; try { extra = JSON.parse(c.extra_fields || '{}'); } catch { /* ignore */ }
  resetView().innerHTML = `
    <div class="page-head"><div><a href="#/clients">← Fiches clients</a><h1>${esc(c.company_name || c.contact_name)}</h1>
      <p class="muted">${c.company_name ? esc(c.contact_name) + ' · ' : ''}${c.source === 'formulaire' ? `Demande reçue par formulaire le ${fmtDateTime(c.received_at)}` : `Fiche créée manuellement le ${fmtDate(c.created_at)}`}</p></div>
      <div class="actions">${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">✉ Écrire</a>` : ''}${c.phone ? `<a class="btn" href="tel:${esc(c.phone)}">☎ Appeler</a>` : ''}
        <button class="btn danger" id="cdel">Supprimer la fiche</button></div></div>
    <div class="cols">
      <div>
        <form class="card" id="cf"><h2>Fiche client</h2>${clientFields(c)}
          ${Object.keys(extra).length ? `<h3>Autres champs du formulaire</h3><dl class="raw-fields">${Object.entries(extra).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
          <div class="form-foot"><button class="btn primary">Enregistrer</button></div></form>
      </div>
      <div>
        <div class="card"><div class="page-head" style="margin-bottom:8px"><h2 style="margin:0">Projets</h2><button class="btn small" id="padd">+ Projet</button></div>
          ${c.projects.length ? `<table><tbody>${c.projects.map((p) => `<tr class="click" data-href="#/projets/${p.id}"><td>${phaseDot(p.phase)}</td>
            <td><strong>${esc(p.title)}</strong><br><span class="muted">${p.project_date ? fmtDate(p.project_date) : 'Date à définir'}</span></td><td>${statusBadge(p.status)}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Aucun projet.</div>'}
        </div>
        ${interactionForm(c.id, c.projects, c.projects[0]?.id)}
        <div class="card"><h2>Historique des échanges</h2><div id="tl">${timeline(c.interactions)}</div></div>
      </div>
    </div>`;
  const reload = () => clientPage(id);
  $('#cf').addEventListener('submit', guard(async (e) => {
    e.preventDefault(); await api(`/clients/${id}`, { method: 'PUT', body: readClientForm(e.target) }); toast('Fiche enregistrée'); reload();
  }));
  $('#cdel').onclick = guard(async () => {
    if (!confirm('Supprimer cette fiche, ses projets et son historique ? Cette action est définitive.')) return;
    await api(`/clients/${id}`, { method: 'DELETE' }); toast('Fiche supprimée'); location.hash = '#/clients';
  });
  $('#padd').onclick = guard(async () => {
    const title = prompt('Titre du nouveau projet', `Projet ${c.company_name || c.contact_name}`);
    if (!title) return;
    const r = await api('/projects', { method: 'POST', body: { client_id: id, title } });
    location.hash = `#/projets/${r.id}`;
  });
  view().addEventListener('click', (e) => { const tr = e.target.closest('tr[data-href]'); if (tr) location.hash = tr.dataset.href; });
  bindInteractionForm(reload);
  bindTimeline($('#tl'), c.interactions, reload);
}

// ---------------------------------------------------------------- projet
async function projectPage(id) {
  const p = await api(`/projects/${id}`);
  const cats = [];
  for (const m of p.members) { let c = cats.find((x) => x.id === m.category_id); if (!c) cats.push(c = { id: m.category_id, name: m.category, list: [] }); c.list.push(m); }
  const sw = (m, k) => `<label class="switch"><input type="checkbox" data-m="${m.id}" data-k="${k}" ${m[k] ? 'checked' : ''} aria-label="${k === 'quote_received' ? 'Devis reçu' : 'Devis transmis au client'} — ${esc(m.name)}"><span></span></label>`;
  resetView().innerHTML = `
    <div class="page-head"><div><a href="#/clients/${p.client_id}">← ${esc(p.company_name || p.contact_name)}</a>
      <h1>${phaseDot(p.phase)} ${esc(p.title)}</h1><p class="muted">${PHASE[p.phase]} · ${esc(p.contact_name)}${p.participants ? ` · ${esc(p.participants)} participants` : ''}</p></div>
      <div class="actions"><button class="btn danger" id="pdel">Supprimer le projet</button></div></div>
    <div class="cols">
      <div>
        <form class="card" id="pf"><h2>Projet</h2><div class="grid2">
          <label style="grid-column:1/-1">Titre<input name="title" value="${esc(p.title)}" required></label>
          <label style="grid-column:1/-1">Description du projet<textarea name="description" class="big" placeholder="Programme, attentes du client, contraintes, budget…">${esc(p.description)}</textarea></label>
          <label>Date de début<input type="date" name="project_date" value="${p.project_date || ''}"></label>
          <label>Date de fin<input type="date" name="project_end_date" value="${p.project_end_date || ''}"></label>
          <label>Date du devis<input type="date" name="quote_date" value="${p.quote_date || ''}"></label>
          <label>Statut<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="inline"><input type="checkbox" class="check" name="proposal_sent" ${p.proposal_sent ? 'checked' : ''}> Proposition Escale envoyée</label>
          <label>Envoyée le<input type="date" name="proposal_sent_date" value="${p.proposal_sent_date || ''}"></label>
        </div><div class="form-foot"><span class="muted" id="psaved"></span><button class="btn primary">Enregistrer</button></div></form>

        <div class="card"><h2>Membres Escale en Presqu'île</h2>
          <p class="muted" style="margin-top:-6px">Les cases et interrupteurs sont enregistrés immédiatement.</p>
          <div class="table-wrap"><table id="mt"><thead><tr><th>Membre</th><th class="center">Se positionne</th><th class="center">Devis reçu</th><th class="center">Devis transmis au client</th></tr></thead><tbody>
          ${cats.map((c) => `<tr class="cat-row"><td colspan="4">${esc(c.name)}</td></tr>
            ${c.list.map((m) => `<tr class="${m.positioned ? 'positioned' : ''}"><td>${esc(m.name)}${m.town ? ` <span class="muted">· ${esc(m.town)}</span>` : ''}${m.active ? '' : ' <span class="badge">inactif</span>'}</td>
              <td class="center"><input type="checkbox" class="check" data-m="${m.id}" data-k="positioned" ${m.positioned ? 'checked' : ''} aria-label="Se positionne — ${esc(m.name)}"></td>
              <td class="center">${sw(m, 'quote_received')}</td><td class="center">${sw(m, 'quote_sent_to_client')}</td></tr>`).join('')}`).join('')}
          </tbody></table></div></div>
      </div>
      <div>
        ${interactionForm(p.client_id, null, p.id)}
        <div class="card"><h2>Échanges liés à ce projet</h2><div id="tl">${timeline(p.interactions, false)}</div>
          <p class="muted"><a href="#/clients/${p.client_id}">Voir tout l'historique du client</a></p></div>
      </div>
    </div>`;
  const reload = () => projectPage(id);
  $('#pf').addEventListener('submit', guard(async (e) => {
    e.preventDefault();
    const d = formData(e.target); d.proposal_sent = e.target.proposal_sent.checked;
    await api(`/projects/${id}`, { method: 'PUT', body: d }); toast('Projet enregistré'); reload();
  }));
  $('#pf').proposal_sent.addEventListener('change', (e) => { if (e.target.checked && !$('#pf').proposal_sent_date.value) $('#pf').proposal_sent_date.value = new Date().toISOString().slice(0, 10); });
  $('#mt').addEventListener('change', guard(async (e) => {
    const el = e.target; if (!el.dataset.m) return;
    try {
      await api(`/projects/${id}/members/${el.dataset.m}`, { method: 'PUT', body: { [el.dataset.k]: el.checked } });
      if (el.dataset.k === 'positioned') el.closest('tr').classList.toggle('positioned', el.checked);
      toast('Enregistré');
    } catch (err) { el.checked = !el.checked; throw err; }
  }));
  $('#pdel').onclick = guard(async () => {
    if (!confirm('Supprimer ce projet ?')) return;
    await api(`/projects/${id}`, { method: 'DELETE' }); toast('Projet supprimé'); location.hash = `#/clients/${p.client_id}`;
  });
  bindInteractionForm(reload);
  bindTimeline($('#tl'), p.interactions, reload);
}

// ---------------------------------------------------------------- répertoire
async function directoryPage() {
  resetView().innerHTML = `<div class="page-head"><div><h1>Répertoire des contacts clients</h1></div>
      <div class="actions"><a class="btn" href="/api/clients.csv">⤓ Exporter (CSV)</a></div></div>
    <div class="card"><label>Recherche<input type="search" id="dq" placeholder="Nom, société, e-mail, téléphone"></label></div>
    <div id="dl" class="contacts"></div>`;
  const load = guard(async () => {
    const rows = (await api('/clients?q=' + encodeURIComponent($('#dq').value)))
      .sort((a, b) => (a.company_name || a.contact_name).localeCompare(b.company_name || b.contact_name, 'fr'));
    $('#dl').innerHTML = rows.length ? rows.map((c) => `<div class="contact">
      ${c.company_name ? `<div class="co">${esc(c.company_name)}</div>` : ''}
      <a class="nm" href="#/clients/${c.id}">${esc(c.contact_name)}</a>
      ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
      ${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : ''}
      <span class="muted" style="font-size:12px">${c.last_interaction ? `Dernier échange : ${fmtDate(c.last_interaction)}` : 'Aucun échange'}</span></div>`).join('')
      : '<div class="empty">Aucun contact.</div>';
  });
  $('#dq').addEventListener('input', debounce(load, 250));
  load();
}

// ---------------------------------------------------------------- membres Escale
async function membersPage() {
  const [cats, members] = await Promise.all([api('/categories'), api('/members')]);
  const catOpts = (sel) => cats.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  resetView().innerHTML = `<div class="page-head"><div><h1>Membres Escale en Presqu'île</h1><p class="muted">${members.filter((m) => m.active).length} membres actifs</p></div></div>
    <form class="card" id="mf"><h2>Ajouter un membre</h2><div class="grid2">
      <label>Nom *<input name="name" required></label><label>Type d'activité *<select name="category_id">${catOpts()}</select></label>
      <label>Commune<input name="town"></label><label>Contact<input name="contact_name"></label>
      <label>E-mail<input name="email" type="email"></label><label>Téléphone<input name="phone"></label>
    </div><div class="form-foot"><button class="btn primary">Ajouter</button></div></form>
    <div class="card"><div class="table-wrap"><table id="mtab"><thead><tr><th>Nom</th><th>Type d'activité</th><th>Commune</th><th>Contact</th><th>E-mail</th><th>Téléphone</th><th class="center">Actif</th><th></th></tr></thead><tbody>
      ${cats.map((c) => `<tr class="cat-row"><td colspan="8">${esc(c.name)}</td></tr>${members.filter((m) => m.category_id === c.id).map((m) => `
        <tr data-id="${m.id}"><td><input name="name" value="${esc(m.name)}"></td><td><select name="category_id">${catOpts(m.category_id)}</select></td>
        <td><input name="town" value="${esc(m.town)}"></td><td><input name="contact_name" value="${esc(m.contact_name)}"></td>
        <td><input name="email" value="${esc(m.email)}"></td><td><input name="phone" value="${esc(m.phone)}"></td>
        <td class="center"><label class="switch"><input type="checkbox" name="active" ${m.active ? 'checked' : ''} aria-label="Actif"><span></span></label></td>
        <td><button class="btn small danger m-del" type="button">Supprimer</button></td></tr>`).join('')}`).join('')}
    </tbody></table></div><p class="muted">Les modifications sont enregistrées dès que vous quittez un champ. Un membre inactif n'apparaît plus dans les nouveaux projets.</p></div>
    <div class="card"><h2>Types d'activité</h2>
      <table><tbody>${cats.map((c) => `<tr data-cat="${c.id}"><td><input name="name" value="${esc(c.name)}"></td><td class="muted">${c.member_count} membre(s)</td>
        <td><button class="btn small danger c-del" type="button">Supprimer</button></td></tr>`).join('')}</tbody></table>
      <form id="catf" class="actions" style="margin-top:12px"><input name="name" placeholder="Nouveau type (ex. Salles de séminaire)" required style="max-width:320px"><button class="btn">Ajouter</button></form></div>`;
  $('#mf').addEventListener('submit', guard(async (e) => { e.preventDefault(); await api('/members', { method: 'POST', body: formData(e.target) }); toast('Membre ajouté'); membersPage(); }));
  $('#mtab').addEventListener('change', guard(async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    await api(`/members/${tr.dataset.id}`, { method: 'PUT', body: { [e.target.name]: val } });
    toast('Membre enregistré');
    if (e.target.name === 'category_id') membersPage();
  }));
  $('#mtab').addEventListener('click', guard(async (e) => {
    if (!e.target.classList.contains('m-del')) return;
    const tr = e.target.closest('tr[data-id]');
    if (!confirm('Supprimer ce membre ? Ses positionnements sur les projets seront aussi supprimés. (Pour le masquer sans perdre l\'historique, désactivez-le.)')) return;
    await api(`/members/${tr.dataset.id}`, { method: 'DELETE' }); toast('Membre supprimé'); membersPage();
  }));
  view().addEventListener('change', guard(async (e) => {
    const tr = e.target.closest('tr[data-cat]'); if (!tr) return;
    await api(`/categories/${tr.dataset.cat}`, { method: 'PUT', body: { name: e.target.value } }); toast('Type renommé'); membersPage();
  }));
  view().addEventListener('click', guard(async (e) => {
    if (!e.target.classList.contains('c-del')) return;
    const tr = e.target.closest('tr[data-cat]');
    if (!confirm('Supprimer ce type d\'activité ?')) return;
    await api(`/categories/${tr.dataset.cat}`, { method: 'DELETE' }); toast('Type supprimé'); membersPage();
  }));
  $('#catf').addEventListener('submit', guard(async (e) => { e.preventDefault(); await api('/categories', { method: 'POST', body: formData(e.target) }); toast('Type ajouté'); membersPage(); }));
}

// ---------------------------------------------------------------- utilisateurs (admin)
async function usersPage() {
  if (ME.role !== 'admin') { resetView().innerHTML = '<div class="empty">Réservé aux administrateurs.</div>'; return; }
  const users = await api('/users');
  resetView().innerHTML = `<div class="page-head"><div><h1>Utilisateurs</h1><p class="muted">Seul un administrateur peut créer ou supprimer des comptes.</p></div></div>
    <form class="card" id="uf"><h2>Créer un utilisateur</h2><div class="grid2">
      <label>Nom *<input name="name" required></label><label>E-mail (identifiant) *<input name="email" type="email" required></label>
      <label>Mot de passe provisoire * (8 caractères min.)<input name="password" type="text" minlength="8" required></label>
      <label>Rôle<select name="role"><option value="user">Utilisateur</option><option value="admin">Administrateur</option></select></label>
    </div><div class="form-foot"><button class="btn primary">Créer</button></div></form>
    <div class="card"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Créé le</th><th></th></tr></thead><tbody>
      ${users.map((u) => `<tr data-id="${u.id}"><td>${esc(u.name)}</td><td>${esc(u.email)}</td>
        <td><select name="role" ${u.id === ME.id ? 'disabled' : ''}><option value="user">Utilisateur</option><option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrateur</option></select></td>
        <td>${fmtDate(u.created_at)}</td>
        <td class="actions"><button class="btn small u-pw" type="button">Nouveau mot de passe</button>${u.id === ME.id ? '' : '<button class="btn small danger u-del" type="button">Supprimer</button>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  $('#uf').addEventListener('submit', guard(async (e) => { e.preventDefault(); await api('/users', { method: 'POST', body: formData(e.target) }); toast('Utilisateur créé'); usersPage(); }));
  view().addEventListener('change', guard(async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr || e.target.name !== 'role') return;
    await api(`/users/${tr.dataset.id}`, { method: 'PUT', body: { role: e.target.value } }); toast('Rôle modifié');
  }));
  view().addEventListener('click', guard(async (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    if (e.target.classList.contains('u-del')) {
      if (!confirm('Supprimer cet utilisateur ?')) return;
      await api(`/users/${tr.dataset.id}`, { method: 'DELETE' }); toast('Utilisateur supprimé'); usersPage();
    } else if (e.target.classList.contains('u-pw')) {
      const pw = prompt('Nouveau mot de passe (8 caractères minimum)');
      if (!pw) return;
      await api(`/users/${tr.dataset.id}`, { method: 'PUT', body: { password: pw } }); toast('Mot de passe modifié');
    }
  }));
}

// ---------------------------------------------------------------- mon compte
function accountPage() {
  resetView().innerHTML = `<div class="page-head"><div><h1>Mon compte</h1><p class="muted">${esc(ME.name)} · ${esc(ME.email)}</p></div></div>
    <form class="card" id="af" style="max-width:480px"><h2>Changer de mot de passe</h2><div class="grid2" style="grid-template-columns:1fr">
      <label>Mot de passe actuel<input type="password" name="current" required autocomplete="current-password"></label>
      <label>Nouveau mot de passe (8 caractères min.)<input type="password" name="next" minlength="8" required autocomplete="new-password"></label>
    </div><div class="form-foot"><button class="btn primary">Modifier</button></div></form>`;
  $('#af').addEventListener('submit', guard(async (e) => { e.preventDefault(); await api('/me/password', { method: 'POST', body: formData(e.target) }); e.target.reset(); toast('Mot de passe modifié'); }));
}

boot();
