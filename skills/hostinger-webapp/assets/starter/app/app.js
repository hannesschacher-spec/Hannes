'use strict';
(function () {
const $ = s => document.querySelector(s);
const CSRF = document.querySelector('meta[name=csrf]').content;
const ME = JSON.parse(document.querySelector('meta[name=user]').content);
const canWrite = ME.role !== 'lesen', isAdmin = ME.role === 'admin';
const ROLLEN = {admin: 'Administration', mitarbeit: 'Mitarbeit', lesen: 'Nur lesen'};

let state = {eintraege: [], users: []}, loaded = false, offline = false, busy = false, view = 'start', editUserId = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmtT = iso => { const d = new Date(iso); return isNaN(d) ? '–' : d.toLocaleString('de-CH', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'}); };
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 3200); }

/* ---------- Server: jede Aktion liefert den ganzen neuen Stand zurück ---------- */
async function load() {
  try {
    const r = await fetch('api.php?a=state', {credentials: 'same-origin', cache: 'no-store'});
    if (r.status === 401) { location.reload(); return; }
    state = await r.json(); loaded = true; offline = false;
  } catch (_) { offline = true; }
  render();
}
async function call(action, body) {
  busy = true;
  try {
    const r = await fetch('api.php?a=' + encodeURIComponent(action), {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-CSRF': CSRF}, body: JSON.stringify(body || {})});
    if (r.status === 401) { location.reload(); return null; }
    const d = await r.json().catch(() => ({error: 'Unerwartete Antwort vom Server.'}));
    if (!r.ok || d.error) { toast(d.error === 'csrf' ? 'Die Seite war zu lange offen. Bitte neu laden.' : (d.error || 'Speichern hat nicht geklappt.')); return null; }
    if (d.eintraege) { state = d; loaded = true; }
    offline = false; render(); return d;
  } catch (_) { toast('Keine Verbindung zum Server. Bitte Internet prüfen.'); return null; }
  finally { busy = false; }
}

/* ---------- Ansicht ---------- */
function render() {
  $('#banners').innerHTML = (offline ? '<div class="banner err">Keine Verbindung zum Server.</div>' : '') + (!canWrite ? '<div class="banner warn">Sie haben nur Leserechte.</div>' : '');
  renderStart(); renderBenutzer();
}
function renderStart() {
  const el = $('#view-start');
  if (!loaded) { el.innerHTML = '<p class="muted">Wird geladen …</p>'; return; }
  el.innerHTML = `<div class="stack">
    ${canWrite ? `<form class="card stack" id="form-eintrag"><h2>Neuer Eintrag</h2>
      <div class="field"><label for="e-titel">Titel</label><input id="e-titel" name="titel" required maxlength="120"></div>
      <div class="field"><label for="e-notiz">Notiz</label><textarea id="e-notiz" name="notiz" maxlength="2000"></textarea></div>
      <button class="btn primary" type="submit">Speichern</button></form>` : ''}
    <h2>Einträge</h2>
    ${state.eintraege.length ? state.eintraege.map(e => `<div class="card"><strong>${esc(e.titel)}</strong><p class="muted small">${fmtT(e.updatedAt)} · ${esc(e.von)}</p>${e.notiz ? `<p>${esc(e.notiz)}</p>` : ''}</div>`).join('') : '<div class="empty">Noch keine Einträge.</div>'}
  </div>`;
}
function renderBenutzer() {
  const el = $('#view-benutzer'); if (!isAdmin || !el) return;
  el.innerHTML = `<div class="stack"><div class="row-between"><h2>Benutzer</h2><button class="btn primary" data-action="new-user">+ Benutzer anlegen</button></div>
    ${(state.users || []).map(u => `<div class="card row-between"><div><strong>${esc(u.name)}</strong><br><span class="small muted">${esc(u.email)}</span></div>
      <div class="small">${ROLLEN[u.role] || esc(u.role)}${u.active ? '' : ' · gesperrt'}<br><span class="muted">Zuletzt: ${u.lastLogin ? fmtT(u.lastLogin) : 'noch nie'}</span></div>
      <button class="btn" data-action="edit-user" data-id="${u.id}">Bearbeiten</button></div>`).join('')}</div>`;
}
function genPw() { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint32Array(12); crypto.getRandomValues(a); return [...a].map(x => c[x % c.length]).join(''); }
function openUser(id) {
  editUserId = id || null; const u = id ? state.users.find(x => x.id === id) : null, f = $('#form-user'); f.reset();
  $('#user-title').textContent = u ? 'Benutzer bearbeiten' : 'Benutzer anlegen';
  $('#u-pass-lbl').textContent = u ? 'Neues Passwort (leer = unverändert)' : 'Startpasswort (mind. 10 Zeichen)';
  f.password.required = !u;
  if (u) { f.name.value = u.name; f.email.value = u.email; f.role.value = u.role; f.active.value = u.active ? '1' : '0'; } else f.password.value = genPw();
  $('#dlg-user').showModal();
}
function showView() { for (const s of document.querySelectorAll('main > section')) s.hidden = s.id !== 'view-' + view; for (const t of document.querySelectorAll('.tab')) t.setAttribute('aria-selected', t.dataset.view === view); }

/* ---------- Ereignisse ---------- */
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.id === 'form-eintrag') { e.preventDefault(); if (await call('eintrag_save', {titel: f.titel.value, notiz: f.notiz.value})) toast('Gespeichert'); }
  if (f.id === 'form-user') { e.preventDefault(); if (await call('user_save', {id: editUserId, name: f.name.value, email: f.email.value, role: f.role.value, active: f.active.value === '1', password: f.password.value})) { $('#dlg-user').close(); toast('Gespeichert. Passwort persönlich weitergeben.'); } }
  if (f.id === 'form-pw') { e.preventDefault(); if (await call('password', {old: f.old.value, neu: f.neu.value})) { $('#dlg-pw').close(); toast('Passwort geändert'); } }
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { e.target.closest('dialog')?.close(); return; }
  const t = e.target.closest('.tab'); if (t) { view = t.dataset.view; showView(); return; }
  const a = e.target.closest('[data-action]'); if (!a) return;
  if (a.dataset.action === 'new-user') openUser();
  if (a.dataset.action === 'edit-user') openUser(a.dataset.id);
  if (a.dataset.action === 'pw') { $('#form-pw').reset(); $('#dlg-pw').showModal(); }
});

showView(); render(); load();
// Neuen Stand holen, solange sichtbar und kein Dialog offen ist
setInterval(() => { if (document.visibilityState === 'visible' && !document.querySelector('dialog[open]') && !busy) load(); }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
})();
