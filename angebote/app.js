'use strict';
(function () {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CSRF = $('meta[name=csrf]').content;
const ME = JSON.parse($('meta[name=user]').content);
const canWrite = ME.role !== 'lesen', isAdmin = ME.role === 'admin';
const ROLLEN = {admin: 'Administration', mitarbeit: 'Mitarbeit', lesen: 'Nur lesen'};
const STATUS = {entwurf: 'Entwurf', versendet: 'Versendet', gewonnen: 'Gewonnen', verloren: 'Verloren'};
const TYPEN = {passt: 'Zubehör', passtAn: 'Zubehör für', benoetigt: 'Benötigt', ausschluss: 'Nicht kombinierbar mit'};

let S = {angebote: [], kunden: [], pakete: [], verlustGruende: {}, settings: {}, users: [], katalogRev: null}, loaded = false, offline = false, busy = false;
let view = 'angebote', editKontaktId = null, kontaktKundeId = null, editUserId = null, editArtikelId = null, kundeId = null, editKundeId = null, backTo = 'angebote';
// Katalog mit schnellen Nachschlagetabellen
const K = {rev: null, loaded: false, list: [], byId: new Map(), byNr: new Map(), kategorien: [],
  passt: new Map(), passtAn: new Map(), benoetigt: new Map(), benoetigtVon: new Map(), ausschluss: new Map()};
// Geöffnetes Angebot im Editor
let A = null, dirty = false, saving = false, saveAgain = false, saveT = null;

/* ---------- Hilfen ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmtT = iso => { const d = new Date(iso); return isNaN(d) ? '–' : d.toLocaleString('de-DE', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'}); };
const fmtD = d => /^\d{4}-\d{2}-\d{2}/.test(d || '') ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : '';
const today = (plusDays = 0) => { const d = new Date(Date.now() + plusDays * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const r2 = v => Math.round((+v || 0) * 100) / 100;
let nf = null, nfCur = null;
function money(v) {
  const cur = S.settings.waehrung || 'EUR';
  if (nfCur !== cur) { try { nf = new Intl.NumberFormat('de-DE', {style: 'currency', currency: cur}); } catch (_) { nf = new Intl.NumberFormat('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2}); } nfCur = cur; }
  return nf.format(v || 0);
}
const numIn = v => (+v || 0).toLocaleString('de-DE', {maximumFractionDigits: 2, useGrouping: false});
// Akzeptiert 1234.5 · 1.234,50 · 1'234.50 · 1 234,5
function parseNum(s) {
  if (typeof s === 'number') return s;
  s = String(s ?? '').replace(/[\s' €$£]|CHF|EUR/g, '');
  if (!s) return 0;
  const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (c > -1) s = s.replace(',', '.');
  else if (d > -1 && /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s); return isFinite(n) ? n : 0;
}
const posTotal = p => r2(p.menge * p.preis * (1 - p.rabatt / 100));
function totals(a) {
  let sum = 0, opt = 0;
  for (const p of a.positionen) { if (p.optional) opt += posTotal(p); else sum += posTotal(p); }
  const rab = r2(sum * a.rabatt / 100), netto = r2(sum - rab), mwstSatz = parseNum(S.settings.mwst), mwst = r2(netto * mwstSatz / 100);
  return {sum: r2(sum), rab, netto, mwstSatz, mwst, brutto: r2(netto + mwst), opt: r2(opt)};
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 3600); }
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
function matches(art, q) { if (!q) return true; return norm(q).split(/\s+/).filter(Boolean).every(t => art._s.includes(t)); }
// Treffer in der Artikelnummer zuerst
function search(list, q) {
  if (!q.trim()) return list;
  const n = norm(q).replace(/\s+/g, ''), score = a => { const nr = norm(a.nr).replace(/[\s-]/g, ''), x = n.replace(/-/g, ''); return nr === x ? 0 : nr.startsWith(x) ? 1 : norm(a.b).includes(norm(q).trim()) ? 2 : 3; };
  return list.map(a => [score(a), a]).sort((p, r) => p[0] - r[0]).map(p => p[1]);
}
const artLabel = id => { const a = K.byId.get(id); return a ? `${a.nr} ${a.b}` : 'unbekannter Artikel'; };

/* ---------- Server ---------- */
async function get(a, params) {
  const r = await fetch('api.php?' + new URLSearchParams({a, ...(params || {})}), {credentials: 'same-origin', cache: 'no-store'});
  if (r.status === 401) { location.reload(); throw new Error('login'); }
  const d = await r.json().catch(() => ({error: 'Unerwartete Antwort vom Server.'}));
  if (!r.ok || d.error) throw new Error(d.error || 'Fehler beim Laden.');
  return d;
}
async function load() {
  try { setState(await get('state')); offline = false; await syncKatalog(); }
  catch (e) { if (e.message !== 'login') offline = true; }
  render();
}
function setState(st) { S = st; S.users = S.users || []; S.kunden = S.kunden || []; S.pakete = S.pakete || []; S.verlustGruende = S.verlustGruende || {}; loaded = true; }
const nrLabel = a => a.revision > 1 ? `${a.nummer} Rev. ${a.revision}` : (a.nummer || '');
// Nur die neueste Version jedes Angebots (ältere Versionen bleiben über das Angebot erreichbar)
function aktuelle(list) {
  const best = new Map(), anz = new Map();
  for (const a of list) { anz.set(a.gruppe, (anz.get(a.gruppe) || 0) + 1); const b = best.get(a.gruppe); if (!b || a.revision > b.revision) best.set(a.gruppe, a); }
  return list.filter(a => best.get(a.gruppe) === a).map(a => ({...a, versionen: anz.get(a.gruppe)}));
}
const faellig = a => a.status === 'versendet' && a.nachfassen && a.nachfassen <= today();
async function syncKatalog() { if (S.katalogRev !== K.rev) buildKatalog(await get('katalog')); }
async function call(action, body, {quiet = false} = {}) {
  busy = true;
  try {
    const r = await fetch('api.php?a=' + encodeURIComponent(action), {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json', 'X-CSRF': CSRF}, body: JSON.stringify(body || {})});
    if (r.status === 401) { location.reload(); return null; }
    const d = await r.json().catch(() => ({error: 'Unerwartete Antwort vom Server.'}));
    if (!r.ok || d.error) { if (!quiet) toast(d.error === 'csrf' ? 'Die Seite war zu lange offen. Bitte neu laden.' : (d.error || 'Speichern hat nicht geklappt.')); return null; }
    offline = false;
    if (d.state) { setState(d.state); await syncKatalog(); render(); }
    return d;
  } catch (_) { if (!quiet) toast('Keine Verbindung zum Server. Bitte Internet prüfen.'); return null; }
  finally { busy = false; }
}

function buildKatalog(d) {
  K.rev = d.rev; K.loaded = true; K.list = d.artikel; K.byId = new Map(); K.byNr = new Map();
  for (const k of ['passt', 'passtAn', 'benoetigt', 'benoetigtVon', 'ausschluss']) K[k] = new Map();
  for (const a of K.list) { a._s = norm(`${a.nr} ${a.b} ${a.k} ${a.d}`); K.byId.set(a.id, a); K.byNr.set(a.nr.toLowerCase(), a); }
  const add = (m, x, y) => { if (!m.has(x)) m.set(x, new Set()); m.get(x).add(y); };
  for (const [von, zu, typ] of d.bez) {
    if (typ === 'benoetigt') { add(K.benoetigt, von, zu); add(K.benoetigtVon, zu, von); }
    else if (typ === 'passt') { add(K.passt, von, zu); add(K.passtAn, zu, von); } // «von» hat «zu» als passendes Zubehör
    else { add(K.ausschluss, von, zu); add(K.ausschluss, zu, von); } // gilt in beide Richtungen
  }
  K.kategorien = [...new Set(K.list.map(a => a.k).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'de'));
  $('#kat-list').innerHTML = K.kategorien.map(k => `<option value="${esc(k)}">`).join('');
  if (A && view === 'editor') { renderPositionen(); renderCheck(); }
}
const relOf = (typ, id) => [...(K[typ].get(id) || [])];
const katOptions = (sel, all = 'Alle Kategorien') => `<option value="">${all}</option>` + K.kategorien.map(k => `<option${k === sel ? ' selected' : ''}>${esc(k)}</option>`).join('');

/* ---------- Ansicht allgemein ---------- */
function render() {
  $('#banners').innerHTML = (offline ? '<div class="banner err">Keine Verbindung zum Server. Änderungen werden gespeichert, sobald die Verbindung wieder da ist.</div>' : '') + (!canWrite ? '<div class="banner warn">Sie haben nur Leserechte.</div>' : '');
  renderAngebotListe(); renderKundenListe(); renderKunde(); renderKatalogListe(); renderBenutzer();
  if (view === 'editor') renderEdKunde();
}
function showView(v) {
  if (v) view = v;
  for (const s of $$('main > section')) s.hidden = s.id !== 'view-' + view;
  const tabView = view === 'editor' ? (backTo === 'kunde' ? 'kunden' : 'angebote') : view === 'kunde' ? 'kunden' : view;
  for (const t of $$('.tab')) t.setAttribute('aria-selected', t.dataset.view === tabView);
  if (view === 'einstellungen') renderEinstellungen();
  window.scrollTo(0, 0);
}

/* ---------- Angebote: Liste ---------- */
function shellAngebote() {
  $('#view-angebote').innerHTML = `<div class="stack">
    <div class="toolbar">
      <input type="search" id="a-q" placeholder="Suchen: Angebots- oder Kundennummer, Kunde, Betreff" aria-label="Angebote suchen">
      <select id="a-status" aria-label="Status"><option value="">Alle Status</option><option value="nachfassen">🔔 Nachfassen fällig</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      ${canWrite ? '<button class="btn primary" data-action="new-angebot">+ Neues Angebot</button>' : ''}
    </div>
    <div id="a-list" class="stack-s"></div></div>`;
}
function renderAngebotListe() {
  const el = $('#a-list'); if (!el) return;
  if (!loaded) { el.innerHTML = '<p class="muted">Wird geladen …</p>'; return; }
  const q = norm($('#a-q').value), st = $('#a-status').value;
  const alle = aktuelle(S.angebote);
  const list = alle.filter(a => (!st || (st === 'nachfassen' ? faellig(a) : a.status === st)) && (!q || q.split(/\s+/).every(t => norm(`${a.nummer} ${a.kundeNr} ${a.kunde} ${a.titel} ${a.von}`).includes(t))));
  if (!S.angebote.length) { el.innerHTML = `<div class="empty">Noch keine Angebote.${canWrite ? ' Mit «+ Neues Angebot» geht es los.' : ''}${K.list.length ? '' : '<br>Tipp: Zuerst unter «Katalog» die Artikel importieren.'}</div>`; return; }
  const nf = alle.filter(faellig).sort((x, y) => x.nachfassen.localeCompare(y.nachfassen));
  const bald = alle.filter(a => a.status === 'versendet' && a.nachfassen > today() && a.nachfassen <= today(7)).length;
  let h = '';
  if (nf.length && !st && !q) {
    h += `<section class="card stack nf-box"><div class="row-between"><h3>🔔 Heute nachfassen (${nf.length})</h3>${bald ? `<span class="small muted">in den nächsten 7 Tagen: ${bald}</span>` : ''}</div>
      ${nf.map(a => `<div class="nf-row"><button class="linkish" data-action="open-angebot" data-id="${a.id}"><span><strong>${esc(nrLabel(a))}</strong> · ${esc(a.kunde || 'Ohne Kunde')}${a.titel ? ' · ' + esc(a.titel) : ''}</span>
          <span class="small ${a.nachfassen < today() ? 'err-t' : 'muted'}">fällig ${a.nachfassen < today() ? 'seit' : 'am'} ${fmtD(a.nachfassen)}</span></button>
        ${canWrite ? `<span class="btn-row"><button class="btn small-btn" data-action="nf-later" data-id="${a.id}">In ${parseInt(S.settings.nachfass_tage, 10) || 7} Tagen erneut</button><button class="btn small-btn" data-action="nf-done" data-id="${a.id}">Erledigt</button></span>` : ''}</div>`).join('')}
    </section>`;
  }
  if (st === 'verloren' && list.length) {
    const g = {}; for (const a of list) g[a.grund || ''] = (g[a.grund || ''] || 0) + 1;
    h += `<p class="small"><strong>Verlustgründe:</strong> ${Object.entries(g).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${esc(S.verlustGruende[k] || 'nicht angegeben')} ${n}`).join(' · ')}</p>`;
  }
  el.innerHTML = h + (list.length ? list.map(a => angebotCard(a)).join('') : '<div class="empty">Keine Angebote gefunden.</div>');
}
function angebotCard(a, mitKunde = true) {
  return `<button class="card item" data-action="open-angebot" data-id="${a.id}">
      <div class="item-main"><div><strong>${esc(nrLabel(a))}</strong> <span class="pill s-${a.status}">${STATUS[a.status]}</span>${faellig(a) ? ' <span class="pill s-nf">🔔 nachfassen</span>' : ''}${a.versionen > 1 ? ` <span class="small muted">${a.versionen} Versionen</span>` : ''}${a.status === 'verloren' && a.grund ? ` <span class="small muted">· ${esc(S.verlustGruende[a.grund] || '')}</span>` : ''}</div>
        <div>${mitKunde ? (a.kundeNr ? `<span class="muted">${esc(a.kundeNr)}</span> ` : '') + esc(a.kunde || 'Ohne Kunde') : ''}${a.titel ? (mitKunde ? ' · ' : '') + esc(a.titel) : ''}</div>
        <div class="small muted">${fmtD(a.datum)} · ${esc(a.von)} · ${a.anzahl} Pos. · geändert ${fmtT(a.updatedAt)}</div></div>
      <div class="item-side"><strong>${money(a.netto)}</strong><div class="small muted">netto</div></div></button>`;
}

/* ---------- Kunden ---------- */
const ort = k => (k.adresse || '').split('\n').map(x => x.trim()).filter(Boolean).pop() || '';
const kundeAngebote = id => aktuelle(S.angebote).filter(a => a.kundeId === id);
const hauptKontakt = k => (k.kontakte || [])[0] || null;
function shellKunden() {
  $('#view-kunden').innerHTML = `<div class="stack">
    <div class="toolbar">
      <input type="search" id="ku-q" placeholder="Suchen: Kundennummer, Firma, Ort, Ansprechperson" aria-label="Kunden suchen">
      ${canWrite ? '<button class="btn primary" data-action="new-kunde">+ Neuer Kunde</button>' : ''}
    </div>
    <div id="ku-list" class="stack-s"></div></div>`;
}
const kundeMatch = (k, q) => !q || norm(q).split(/\s+/).filter(Boolean).every(t => norm(`${k.nummer} ${k.firma} ${(k.kontakte || []).map(c => c.name).join(' ')} ${k.adresse} ${k.email}`).includes(t));
function renderKundenListe() {
  const el = $('#ku-list'); if (!el) return;
  if (!loaded) { el.innerHTML = '<p class="muted">Wird geladen …</p>'; return; }
  if (!S.kunden.length) { el.innerHTML = `<div class="empty">Noch keine Kunden.${canWrite ? ' Mit «+ Neuer Kunde» legen Sie den ersten an. Die Kundennummer wird automatisch vergeben.' : ''}</div>`; return; }
  const list = S.kunden.filter(k => kundeMatch(k, $('#ku-q').value));
  el.innerHTML = list.length ? list.map(k => {
    const an = kundeAngebote(k.id), offen = an.filter(a => a.status === 'entwurf' || a.status === 'versendet');
    return `<button class="card item" data-action="open-kunde" data-id="${k.id}">
      <div class="item-main"><div><span class="knr">${esc(k.nummer)}</span> <strong>${esc(k.firma)}</strong></div>
        <div class="small muted">${[hauptKontakt(k)?.name, ort(k)].filter(Boolean).map(esc).join(' · ') || '&nbsp;'}</div></div>
      <div class="item-side"><strong>${an.length} Angebot${an.length === 1 ? '' : 'e'}</strong><div class="small muted">${offen.length ? `${offen.length} offen · ${money(offen.reduce((x, a) => x + a.netto, 0))}` : '–'}</div></div></button>`;
  }).join('') : '<div class="empty">Keine Kunden gefunden.</div>';
}
function openKunde(id) {
  kundeId = id; history.replaceState(null, '', '#kunde=' + id);
  renderKunde(); showView('kunde');
}
function renderKunde() {
  const el = $('#view-kunde'); if (!el || !kundeId || !loaded) return;
  const k = S.kunden.find(x => x.id === kundeId);
  if (!k) { el.innerHTML = '<div class="empty">Diesen Kunden gibt es nicht mehr. <button class="btn ghost" data-action="back-kunden">Zu allen Kunden</button></div>'; return; }
  const an = kundeAngebote(k.id), sum = st => an.filter(a => st.includes(a.status)).reduce((x, a) => x + a.netto, 0);
  const row = (l, v) => v ? `<div class="kv"><span class="muted small">${l}</span><span>${v}</span></div>` : '';
  el.innerHTML = `<div class="stack">
    <div class="ed-head">
      <button class="btn ghost" data-action="back-kunden">← Alle Kunden</button>
      <div class="ed-title"><span class="small muted">Kunde ${esc(k.nummer)}</span><h2>${esc(k.firma)}</h2></div>
      <div class="ed-actions">
        ${canWrite ? `<button class="btn primary" data-action="new-angebot-kunde">+ Neues Angebot</button><button class="btn" data-action="edit-kunde">Bearbeiten</button>` : ''}
        ${isAdmin ? '<button class="btn danger" data-action="delete-kunde">Löschen</button>' : ''}
      </div>
    </div>
    <div class="ed-grid">
      <div class="stack">
        <h3>Angebote (${an.length})</h3>
        ${an.length ? an.map(a => angebotCard(a, false)).join('') : `<div class="empty">Noch keine Angebote für diesen Kunden.${canWrite ? ' Mit «+ Neues Angebot» geht es los, die Kundendaten werden übernommen.' : ''}</div>`}
      </div>
      <aside class="stack ed-side">
        <section class="card stack"><div class="row-between"><h3>Ansprechpersonen</h3>${canWrite ? '<button class="btn small-btn" data-action="new-kontakt">+ Person</button>' : ''}</div>
          ${(k.kontakte || []).length ? k.kontakte.map(c => `<div class="kontakt"><div><strong>${esc(c.name)}</strong>${c.funktion ? ` <span class="small muted">${esc(c.funktion)}</span>` : ''}
              <div class="small">${[c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '', c.telefon ? `<a href="tel:${esc(c.telefon.replace(/[^+0-9]/g, ''))}">${esc(c.telefon)}</a>` : ''].filter(Boolean).join(' · ')}</div></div>
              ${canWrite ? `<button class="btn small-btn ghost" data-action="edit-kontakt" data-id="${c.id}">Bearbeiten</button>` : ''}</div>`).join('') : '<p class="small muted">Noch keine Ansprechperson.</p>'}
        </section>
        <section class="card stack"><h3>Kundendaten</h3>
          ${row('Kundennummer', esc(k.nummer))}${row('Anschrift', esc(k.adresse).replace(/\n/g, '<br>'))}
          ${row('E-Mail', k.email ? `<a href="mailto:${esc(k.email)}">${esc(k.email)}</a>` : '')}${row('Telefon', k.telefon ? `<a href="tel:${esc(k.telefon.replace(/[^+0-9]/g, ''))}">${esc(k.telefon)}</a>` : '')}
          ${row('Standardrabatt', k.rabatt ? numIn(k.rabatt) + ' %' : '')}${row('Notiz', esc(k.notiz).replace(/\n/g, '<br>'))}
        </section>
        <section class="card stack"><h3>Übersicht</h3>
          <div class="sumrow"><span>Offen (Entwurf, versendet)</span><strong>${money(sum(['entwurf', 'versendet']))}</strong></div>
          <div class="sumrow"><span>Gewonnen</span><strong>${money(sum(['gewonnen']))}</strong></div>
          <div class="sumrow muted"><span>Verloren</span><span>${money(sum(['verloren']))}</span></div>
          <p class="small muted">Beträge netto, ohne Optionen.</p>
        </section>
      </aside>
    </div></div>`;
}
function openKundeDlg(id, vorlage) {
  const k = id ? S.kunden.find(x => x.id === id) : (vorlage || null), f = $('#form-kunde'); f.reset(); editKundeId = id || null;
  $('#kunde-title').textContent = id ? 'Kunde bearbeiten' : 'Neuer Kunde';
  for (const n of ['nummer', 'firma', 'email', 'telefon', 'adresse', 'notiz']) f[n].value = (k && k[n]) || '';
  f.kontakt.value = (!id && k && k.kontakt) || ''; f.kontakt_email.value = (!id && k && k.kontakt_email) || '';
  $('#k-kontakt-wrap').hidden = !!id;
  f.rabatt.value = k && k.rabatt ? numIn(k.rabatt) : '';
  const next = Math.max(parseInt(S.settings.kunden_start, 10) || 10001, ...S.kunden.map(x => +x.nummer + 1));
  f.nummer.placeholder = `automatisch (${next})`;
  $('#dlg-kunde').dataset.forEditor = vorlage ? '1' : '';
  $('#dlg-kunde').showModal();
}
// Kundendaten für ein Angebot (erste Ansprechperson vorausgewählt)
function kundeFelder(k, c = hauptKontakt(k)) {
  return {kunde_id: k.id, kunde_firma: k.firma, kontakt_id: c ? c.id : null, kunde_kontakt: c ? c.name : '', kunde_email: (c && c.email) || k.email || '', kunde_adresse: k.adresse};
}
// Kunde ins Angebot übernehmen
function applyKunde(k) {
  if (!A || !k) return;
  Object.assign(A, kundeFelder(k));
  if (!A.rabatt && k.rabatt) A.rabatt = k.rabatt;
  for (const n of ['kunde_firma', 'kunde_kontakt', 'kunde_email', 'kunde_adresse']) { const i = $('#ed-' + n); if (i) i.value = A[n] || ''; }
  const r = $('#ed-rabatt'); if (r) r.value = numIn(A.rabatt);
  renderEdKunde(); updateSums(); scheduleSave();
}
function renderEdKunde() {
  const el = $('#ed-kunde'); if (!el || !A) return;
  const k = A.kunde_id ? S.kunden.find(x => x.id === A.kunde_id) : null;
  el.innerHTML = k
    ? `<div class="kunde-box"><div><span class="small muted">Kunde</span><div><span class="knr">${esc(k.nummer)}</span> <strong>${esc(k.firma)}</strong></div></div>
        <div class="btn-row"><button class="btn" data-action="goto-kunde" data-id="${k.id}">Zum Kunden</button>${canWrite ? '<button class="btn ghost" data-action="pick-kunde">Anderen Kunden wählen</button>' : ''}</div>
        <div class="field kontakt-wahl"><label for="ed-kontaktwahl">Ansprechperson für dieses Angebot</label><select id="ed-kontaktwahl"${canWrite ? '' : ' disabled'}>
          ${(k.kontakte || []).map(c => `<option value="${c.id}"${A.kontakt_id === c.id ? ' selected' : ''}>${esc(c.name)}${c.funktion ? ' – ' + esc(c.funktion) : ''}</option>`).join('')}
          <option value=""${A.kontakt_id ? '' : ' selected'}>Andere / frei eintragen</option></select></div></div>`
    : `<div class="kunde-box none"><div><strong>Kein Kunde ausgewählt.</strong><div class="small muted">Kunde auswählen, dann werden Anschrift und Ansprechperson übernommen.</div></div>
        ${canWrite ? `<div class="btn-row"><button class="btn primary" data-action="pick-kunde">Kunde auswählen</button>${A.kunde_firma ? '<button class="btn" data-action="kunde-aus-angebot">Als neuen Kunden anlegen</button>' : ''}</div>` : ''}</div>`;
}
function renderKundeWahl() {
  const q = $('#kw-q').value, list = S.kunden.filter(k => kundeMatch(k, q));
  $('#kw-list').innerHTML = list.length ? list.slice(0, 100).map(k => `<button class="card item" data-action="choose-kunde" data-id="${k.id}">
      <div class="item-main"><div><span class="knr">${esc(k.nummer)}</span> <strong>${esc(k.firma)}</strong></div><div class="small muted">${[hauptKontakt(k)?.name, ort(k)].filter(Boolean).map(esc).join(' · ')}</div></div>
      <div class="item-side small muted">${kundeAngebote(k.id).length} Angebote</div></button>`).join('')
    : `<div class="empty">${S.kunden.length ? 'Kein Kunde gefunden.' : 'Noch keine Kunden angelegt.'}</div>`;
}

/* ---------- Angebot: Editor ---------- */
async function openAngebot(id, fuerKunde = null, from = null) {
  if (!(await flushSave())) return;
  backTo = from || (view === 'kunde' ? 'kunde' : view === 'editor' ? backTo : 'angebote');
  let a;
  if (id) {
    try { a = (await get('angebot', {id})).angebot; }
    catch (e) { toast(e.message); history.replaceState(null, '', location.pathname); showView('angebote'); return; }
  } else {
    a = {id: null, nummer: '', revision: 1, versionen: [], kontakt_id: null, nachfassen_am: '', verlust_grund: '', kunde_id: null, titel: '', kunde_firma: '', kunde_kontakt: '', kunde_email: '', kunde_adresse: '', status: 'entwurf',
      datum: today(), gueltig_bis: today(parseInt(S.settings.gueltigkeit_tage, 10) || 60), rabatt: 0,
      einleitung: S.settings.einleitung || '', notiz_intern: '', erstellt_von: ME.name, positionen: []};
  }
  a.positionen.forEach(p => p._k = Math.random());
  if (fuerKunde) { const k = S.kunden.find(x => x.id === fuerKunde); if (k) Object.assign(a, kundeFelder(k), {rabatt: k.rabatt || 0}); }
  A = a; dirty = false;
  if (A.id) history.replaceState(null, '', '#angebot=' + A.id);
  renderEditor(); showView('editor');
}
function renderEditor() {
  const f = (k, label, extra = '') => `<div class="field"><label for="ed-${k}">${label}</label><input id="ed-${k}" data-f="${k}" value="${esc(A[k])}" ${extra}></div>`;
  $('#view-editor').innerHTML = `<div class="stack">
    <div class="ed-head">
      <button class="btn ghost" data-action="back">${backTo === 'kunde' ? '← Zurück zum Kunden' : '← Alle Angebote'}</button>
      <div class="ed-title"><h2 id="ed-nummer"></h2><span id="ed-save" class="small muted" aria-live="polite"></span></div>
      <div class="ed-actions">
        <button class="btn" data-action="print">Drucken / PDF</button>
        ${canWrite ? '<button class="btn" data-action="new-version" title="Gleiche Nummer, neue Revision">Neue Version</button><button class="btn" data-action="copy-angebot">Kopieren</button>' : ''}
        ${isAdmin ? '<button class="btn danger" data-action="delete-angebot">Löschen</button>' : ''}
      </div>
    </div>
    ${(A.versionen || []).length > 1 ? `<div class="versionen"><span class="small muted">Versionen:</span> ${A.versionen.map(v => `<button class="btn small-btn${v.id === A.id ? ' primary' : ''}" data-action="open-angebot" data-id="${v.id}">Rev. ${v.revision} · ${STATUS[v.status]}</button>`).join('')}${A.versionen[A.versionen.length - 1].id !== A.id ? '<span class="small warn-t">Sie sehen eine ältere Version.</span>' : ''}</div>` : ''}
    <div class="ed-grid">
      <div class="stack">
        <section class="card stack"><h3>Kunde und Angebot</h3>
          <div id="ed-kunde"></div>
          <div class="grid2">
            ${f('kunde_firma', 'Firma', 'maxlength="200" placeholder="Kunde"')}
            ${f('kunde_kontakt', 'Ansprechperson', 'maxlength="120"')}
            <div class="field span2"><label for="ed-kunde_adresse">Anschrift</label><textarea id="ed-kunde_adresse" data-f="kunde_adresse" rows="3" maxlength="1000" placeholder="Strasse, PLZ Ort, Land">${esc(A.kunde_adresse)}</textarea></div>
            ${f('kunde_email', 'E-Mail', 'type="email" maxlength="190"')}
            ${f('titel', 'Betreff / Projekt', 'maxlength="200" placeholder="z. B. Zugprüfmaschine 50 kN für Kunststoffe"')}
            ${f('datum', 'Angebotsdatum', 'type="date"')}
            ${f('gueltig_bis', 'Gültig bis', 'type="date"')}
            <div class="field"><label for="ed-status">Status</label><select id="ed-status" data-f="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${A.status === k ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
            <div id="ed-status-extra"></div>
          </div>
        </section>
        <section class="card stack">
          <div class="row-between"><h3>Konfiguration / Positionen</h3>
            ${canWrite ? '<div class="btn-row"><button class="btn primary" data-action="pick">+ Artikel aus Katalog</button><button class="btn" data-action="pick-paket">+ Paket</button><button class="btn" data-action="free-pos">+ Freie Position</button><button class="btn ghost" data-action="save-paket">Als Paket speichern</button></div>' : ''}</div>
          <div id="ed-pos"></div>
        </section>
        <section class="card stack"><h3>Texte</h3>
          <div class="field"><div class="row-between"><label for="ed-einleitung">Einleitung (steht im Angebot über den Positionen)</label>
            ${canWrite ? `<button class="btn small-btn" data-action="ki-einleitung" title="${S.kiAktiv ? 'Text aus Kunde, Betreff und Positionen formulieren' : 'Noch nicht eingerichtet (Einstellungen)'}">✨ Mit KI formulieren</button>` : ''}</div>
            <textarea id="ed-einleitung" data-f="einleitung" rows="5" maxlength="4000">${esc(A.einleitung)}</textarea></div>
          <div class="field"><label for="ed-notiz_intern">Interne Notiz (erscheint nicht im Angebot)</label><textarea id="ed-notiz_intern" data-f="notiz_intern" rows="3" maxlength="4000">${esc(A.notiz_intern)}</textarea></div>
        </section>
      </div>
      <aside class="stack ed-side">
        <section class="card stack" id="ed-sum">
          <h3>Summe</h3>
          <div class="sumrow"><span>Zwischensumme</span><span id="sum-sum"></span></div>
          <div class="sumrow"><label for="ed-rabatt">Gesamtrabatt %</label><input id="ed-rabatt" class="num-s" data-f="rabatt" inputmode="decimal" value="${numIn(A.rabatt)}"></div>
          <div class="sumrow" id="row-rab"><span>Rabatt</span><span id="sum-rab"></span></div>
          <div class="sumrow strong"><span>Gesamt netto</span><span id="sum-netto"></span></div>
          <div class="sumrow"><span id="sum-mwst-l"></span><span id="sum-mwst"></span></div>
          <div class="sumrow strong big"><span>Gesamt brutto</span><span id="sum-brutto"></span></div>
          <div class="sumrow muted small" id="row-opt"><span>Optionen (nicht enthalten)</span><span id="sum-opt"></span></div>
        </section>
        <section class="card stack" id="ed-check"></section>
      </aside>
    </div></div>`;
  updateHead(); renderStatusExtra(); renderEdKunde(); renderPositionen(); renderCheck(); updateSums(); setSave(A.id ? 'Gespeichert' : '');
  if (!canWrite) for (const i of $$('#view-editor input, #view-editor textarea, #view-editor select')) i.disabled = true;
}
function updateHead() { $('#ed-nummer').textContent = A.nummer ? `Angebot ${nrLabel(A)}` : 'Neues Angebot'; }
// Nachfassen (Entwurf/Versendet) bzw. Verlustgrund (Verloren)
function renderStatusExtra() {
  const el = $('#ed-status-extra'); if (!el || !A) return;
  const ro = canWrite ? '' : ' disabled';
  if (A.status === 'verloren') {
    el.innerHTML = `<div class="field"><label for="ed-verlust_grund">Grund für den Verlust</label><select id="ed-verlust_grund" data-f="verlust_grund"${ro}><option value="">– bitte wählen –</option>
      ${Object.entries(S.verlustGruende).map(([k, v]) => `<option value="${k}"${A.verlust_grund === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select></div>`;
  } else if (A.status === 'versendet' || A.status === 'entwurf') {
    el.innerHTML = `<div class="field"><label for="ed-nachfassen_am">Nachfassen am</label><input id="ed-nachfassen_am" type="date" data-f="nachfassen_am" value="${esc(A.nachfassen_am || '')}"${ro}></div>`;
  } else el.innerHTML = '';
}
function setSave(t, err) { const e = $('#ed-save'); if (e) { e.textContent = t; e.classList.toggle('err-t', !!err); } }
function posLabels() { let n = 0, o = 0; return A.positionen.map(p => p.optional ? 'O' + (++o) : String(++n)); }
function renderPositionen() {
  const el = $('#ed-pos'); if (!el) return;
  if (!A.positionen.length) { el.innerHTML = `<div class="empty">Noch keine Positionen. ${canWrite ? 'Beginnen Sie mit der Grundmaschine über «+ Artikel aus Katalog».' : ''}</div>`; return; }
  const lbl = posLabels(), ro = canWrite ? '' : ' disabled';
  el.innerHTML = `<div class="pos-head small muted"><span>Pos.</span><span>Artikel</span><span>Menge</span><span>Einzelpreis</span><span>Rabatt %</span><span class="r">Gesamt</span></div>` +
    A.positionen.map((p, i) => {
      const art = p.artikel_id ? K.byId.get(p.artikel_id) : null;
      const hint = p.artikel_id && K.loaded && (!art ? ' · nicht mehr im Katalog' : !art.a ? ' · im Katalog inaktiv' : '');
      return `<div class="pos${p.optional ? ' is-opt' : ''}" data-i="${i}">
      <div class="pos-n">${lbl[i]}</div>
      <div class="pos-art">
        <div class="small muted">${p.nr ? esc(p.nr) : 'Freie Position'}${hint ? `<span class="warn-t">${hint}</span>` : ''}${art && art.k ? ' · ' + esc(art.k) : ''}</div>
        <input data-p="bezeichnung" value="${esc(p.bezeichnung)}" maxlength="200" aria-label="Bezeichnung"${ro}>
        <textarea data-p="beschreibung" rows="2" maxlength="4000" placeholder="Beschreibung (optional)" aria-label="Beschreibung"${ro}>${esc(p.beschreibung)}</textarea>
        ${canWrite ? `<div class="pos-act">
          <label class="check small"><input type="checkbox" data-p="optional"${p.optional ? ' checked' : ''}> als Option (nicht im Gesamtpreis)</label>
          <span class="btn-row"><button class="btn icon" data-action="pos-up" title="Nach oben" aria-label="Nach oben"${i === 0 ? ' disabled' : ''}>↑</button><button class="btn icon" data-action="pos-down" title="Nach unten" aria-label="Nach unten"${i === A.positionen.length - 1 ? ' disabled' : ''}>↓</button><button class="btn icon danger" data-action="pos-del" title="Entfernen" aria-label="Position entfernen">✕</button></span>
        </div>` : (p.optional ? '<div class="small muted">Option</div>' : '')}
      </div>
      <label class="pos-f"><span>Menge</span><input data-p="menge" inputmode="decimal" value="${numIn(p.menge)}"${ro}></label>
      <label class="pos-f"><span>Einzelpreis</span><input data-p="preis" inputmode="decimal" value="${numIn(p.preis)}"${ro}></label>
      <label class="pos-f"><span>Rabatt %</span><input data-p="rabatt" inputmode="decimal" value="${numIn(p.rabatt)}"${ro}></label>
      <div class="pos-tot"><span class="small muted">Gesamt</span><strong data-tot>${money(posTotal(p))}</strong></div>
    </div>`;
    }).join('');
}
function updateSums() {
  if (!A || !$('#sum-sum')) return;
  const t = totals(A);
  $('#sum-sum').textContent = money(t.sum); $('#sum-rab').textContent = '− ' + money(t.rab); $('#row-rab').hidden = !t.rab;
  $('#sum-netto').textContent = money(t.netto); $('#sum-mwst-l').textContent = `MwSt. ${numIn(t.mwstSatz)} %`; $('#sum-mwst').textContent = money(t.mwst);
  $('#sum-brutto').textContent = money(t.brutto); $('#sum-opt').textContent = money(t.opt); $('#row-opt').hidden = !t.opt;
}

// Prüft die Konfiguration: fehlende Pflichtteile, Konflikte und passendes Zubehör
function analyse(a) {
  const inA = new Set(a.positionen.map(p => p.artikel_id).filter(Boolean));
  const fehlt = new Map(), konflikte = [], vorschlag = new Map();
  for (const id of inA) {
    for (const z of relOf('benoetigt', id)) if (!inA.has(z)) { if (!fehlt.has(z)) fehlt.set(z, new Set()); fehlt.get(z).add(id); }
    for (const z of relOf('ausschluss', id)) if (inA.has(z) && id < z) konflikte.push([id, z]);
    for (const z of relOf('passt', id)) if (!inA.has(z)) { if (!vorschlag.has(z)) vorschlag.set(z, new Set()); vorschlag.get(z).add(id); }
  }
  for (const z of [...vorschlag.keys()]) {
    const art = K.byId.get(z);
    if (!art || !art.a || relOf('ausschluss', z).some(x => inA.has(x))) vorschlag.delete(z);
  }
  return {inA, fehlt, konflikte, vorschlag};
}
function renderCheck() {
  const el = $('#ed-check'); if (!el || !A) return;
  const {inA, fehlt, konflikte, vorschlag} = analyse(A);
  let h = '<h3>Konfiguration prüfen</h3>';
  if (!inA.size) { el.innerHTML = h + '<p class="small muted">Sobald Katalog-Artikel im Angebot sind, zeigt diese Box fehlende Pflichtteile, nicht kombinierbare Artikel und passendes Zubehör.</p>'; return; }
  const addBtn = id => canWrite ? `<button class="btn small-btn" data-action="add-art" data-id="${id}">+ Hinzufügen</button>` : '';
  for (const [z, von] of fehlt) {
    h += `<div class="chk err"><div><strong>Fehlt:</strong> ${esc(artLabel(z))}<div class="small">benötigt von ${[...von].map(v => esc(K.byId.get(v)?.nr || '')).join(', ')}</div></div>${K.byId.get(z)?.a ? addBtn(z) : ''}</div>`;
  }
  for (const [x, y] of konflikte) h += `<div class="chk err"><div><strong>Nicht kombinierbar:</strong> ${esc(artLabel(x))} und ${esc(artLabel(y))}</div></div>`;
  if (!fehlt.size && !konflikte.length) h += '<div class="chk ok">Alles stimmig: keine Konflikte, alle benötigten Teile sind enthalten.</div>';
  if (vorschlag.size) {
    const groups = new Map();
    for (const [z, von] of vorschlag) { const a = K.byId.get(z), k = a.k || 'Sonstiges'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push([a, von]); }
    h += `<h4>Passendes Zubehör (${vorschlag.size})</h4>` + [...groups].sort((x, y) => x[0].localeCompare(y[0], 'de')).map(([k, items]) =>
      `<details${groups.size <= 3 ? ' open' : ''}><summary>${esc(k)} <span class="muted">(${items.length})</span></summary>` +
      items.map(([a]) => `<div class="sug"><div><span class="small muted">${esc(a.nr)}</span><br>${esc(a.b)}<div class="small muted">${money(a.p)}</div></div>${addBtn(a.id)}</div>`).join('') + '</details>').join('');
  }
  el.innerHTML = h;
}
function addArtikel(id, quiet) {
  const a = K.byId.get(id); if (!a || !A || !canWrite) return;
  A.positionen.push({_k: Math.random(), artikel_id: a.id, nr: a.nr, bezeichnung: a.b, beschreibung: a.d, menge: 1, einheit: a.e || 'Stk.', preis: a.p, rabatt: 0, optional: false});
  changed(true);
  if (!quiet) toast(`${a.nr} hinzugefügt`);
}
function changed(structure) {
  if (structure) renderPositionen();
  renderCheck(); updateSums(); scheduleSave();
  if ($('#dlg-pick').open) renderPick();
}
function scheduleSave() { if (!canWrite || !A) return; dirty = true; setSave('Wird gleich gespeichert …'); clearTimeout(saveT); saveT = setTimeout(saveNow, 900); }
function payload(a) {
  const {positionen, ...head} = a;
  return {...head, positionen: positionen.map(({_k, ...p}) => p)};
}
async function saveNow() {
  clearTimeout(saveT);
  if (!A || !dirty) return true;
  if (saving) { saveAgain = true; return false; }
  saving = true; dirty = false; setSave('Wird gespeichert …');
  const cur = A, d = await call('angebot_save', payload(cur), {quiet: true});
  saving = false;
  if (!d) { if (cur === A) { dirty = true; setSave('Nicht gespeichert – keine Verbindung? Wird erneut versucht.', true); clearTimeout(saveT); saveT = setTimeout(saveNow, 5000); } return false; }
  if (!cur.id) { cur.id = d.angebot.id; cur.nummer = d.angebot.nummer; if (cur === A) { updateHead(); history.replaceState(null, '', '#angebot=' + cur.id); } }
  if (saveAgain || (dirty && cur === A)) { saveAgain = false; dirty = true; return saveNow(); }
  if (cur === A) setSave('Gespeichert');
  return true;
}
async function flushSave() {
  if (!A || !dirty) return true;
  const ok = await saveNow();
  if (!ok && dirty) return confirm('Die letzten Änderungen konnten nicht gespeichert werden. Trotzdem weiter?');
  return true;
}

/* ---------- Pakete ---------- */
const paketPos = pp => { const art = pp.nr ? K.byNr.get(pp.nr.toLowerCase()) : null; return {art, preis: art ? art.p : pp.preis}; };
function renderPakete() {
  const el = $('#paket-list');
  if (!S.pakete.length) { el.innerHTML = '<div class="empty">Noch keine Pakete. Stellen Sie ein Angebot zusammen und tippen Sie auf «Als Paket speichern».</div>'; return; }
  el.innerHTML = S.pakete.map(pk => {
    const sum = pk.positionen.filter(p => !p.optional).reduce((x, p) => x + p.menge * paketPos(p).preis * (1 - p.rabatt / 100), 0);
    const fehlt = pk.positionen.filter(p => p.nr && !paketPos(p).art).length;
    return `<div class="pick"><div class="pick-main"><strong>${esc(pk.name)}</strong>${pk.beschreibung ? `<div class="small muted">${esc(pk.beschreibung)}</div>` : ''}
        <div class="small muted clamp">${pk.positionen.length} Positionen: ${pk.positionen.map(p => esc(p.nr || p.bezeichnung)).join(', ')}</div>
        ${fehlt ? `<div class="badges"><span class="badge warn">${fehlt} Artikel nicht mehr im Katalog</span></div>` : ''}</div>
      <div class="pick-side"><strong>${money(sum)}</strong><span class="btn-row">${isAdmin ? `<button class="btn small-btn danger" data-action="delete-paket" data-id="${pk.id}">Löschen</button>` : ''}<button class="btn primary" data-action="use-paket" data-id="${pk.id}">Übernehmen</button></span></div></div>`;
  }).join('');
}
function usePaket(id) {
  const pk = S.pakete.find(x => x.id === id); if (!pk || !A) return;
  let alt = 0;
  for (const pp of pk.positionen) {
    const {art} = paketPos(pp);
    // aktuelle Katalogdaten verwenden, Menge/Rabatt/Option aus dem Paket
    A.positionen.push(art ? {_k: Math.random(), artikel_id: art.id, nr: art.nr, bezeichnung: art.b, beschreibung: art.d, einheit: art.e || 'Stk.', preis: art.p, menge: pp.menge, rabatt: pp.rabatt, optional: pp.optional}
      : {_k: Math.random(), artikel_id: null, nr: pp.nr, bezeichnung: pp.bezeichnung, beschreibung: pp.beschreibung, einheit: pp.einheit, preis: pp.preis, menge: pp.menge, rabatt: pp.rabatt, optional: pp.optional});
    if (pp.nr && !art) alt++;
  }
  $('#dlg-paket').close(); changed(true);
  toast(`Paket «${pk.name}» übernommen (${pk.positionen.length} Positionen)` + (alt ? `. ${alt} Artikel nicht mehr im Katalog, alter Preis übernommen.` : ''));
}

/* ---------- Ansprechpersonen ---------- */
function openKontaktDlg(id) {
  kontaktKundeId = view === 'editor' && A ? A.kunde_id : kundeId;
  const k = S.kunden.find(x => x.id === kontaktKundeId), c = id && k ? (k.kontakte || []).find(x => x.id === id) : null, f = $('#form-kontakt');
  f.reset(); editKontaktId = c ? c.id : null;
  $('#kontakt-title').textContent = c ? 'Ansprechperson bearbeiten' : 'Neue Ansprechperson';
  if (c) { f.name.value = c.name; f.funktion.value = c.funktion; f.email.value = c.email; f.telefon.value = c.telefon; }
  $('#kt-del').hidden = !c; $('#dlg-kontakt').showModal();
}

/* ---------- Artikel-Auswahl ---------- */
function openPick() {
  $('#pick-kat').innerHTML = katOptions($('#pick-kat').value);
  $('#pick-passend').checked = A.positionen.some(p => p.artikel_id && relOf('passt', p.artikel_id).length);
  renderPick(); $('#dlg-pick').showModal();
}
function renderPick() {
  if (!A) return;
  const q = $('#pick-q').value, kat = $('#pick-kat').value, nurPassend = $('#pick-passend').checked;
  const {inA, vorschlag} = analyse(A);
  const count = new Map(); for (const p of A.positionen) if (p.artikel_id) count.set(p.artikel_id, (count.get(p.artikel_id) || 0) + 1);
  const passend = id => vorschlag.has(id);
  const list = search(K.list.filter(a => a.a && (!kat || a.k === kat) && (!nurPassend || passend(a.id)) && matches(a, q)), q);
  $('#pick-info').textContent = K.list.length ? `${list.length} Artikel${list.length > 150 ? ', die ersten 150 werden angezeigt' : ''}` : '';
  if (!K.list.length) { $('#pick-list').innerHTML = `<div class="empty">Der Katalog ist noch leer.${isAdmin ? ' Unter «Katalog» können Sie ihn importieren.' : ''}</div>`; return; }
  $('#pick-list').innerHTML = list.length ? list.slice(0, 150).map(a => {
    const konflikt = relOf('ausschluss', a.id).filter(x => inA.has(x)), ben = relOf('benoetigt', a.id);
    return `<div class="pick${konflikt.length ? ' is-conflict' : ''}">
      <div class="pick-main"><div class="small muted">${esc(a.nr)}${a.k ? ' · ' + esc(a.k) : ''}</div><strong>${esc(a.b)}</strong>
        ${a.d ? `<div class="small muted clamp">${esc(a.d)}</div>` : ''}
        <div class="badges">${passend(a.id) && !count.get(a.id) ? '<span class="badge ok">passt zur Konfiguration</span>' : ''}${count.get(a.id) ? `<span class="badge">im Angebot${count.get(a.id) > 1 ? ' ×' + count.get(a.id) : ''}</span>` : ''}
          ${konflikt.length ? `<span class="badge err">nicht kombinierbar mit ${konflikt.map(x => esc(K.byId.get(x)?.nr)).join(', ')}</span>` : ''}
          ${ben.length ? `<span class="badge warn">benötigt ${ben.map(x => esc(K.byId.get(x)?.nr)).join(', ')}</span>` : ''}</div></div>
      <div class="pick-side"><strong>${money(a.p)}</strong><button class="btn primary" data-action="add-art" data-id="${a.id}">+ Hinzufügen</button></div></div>`;
  }).join('') : '<div class="empty">Keine passenden Artikel gefunden.</div>';
}

/* ---------- Katalog ---------- */
function shellKatalog() {
  $('#view-katalog').innerHTML = `<div class="stack">
    <div class="toolbar">
      <input type="search" id="k-q" placeholder="Suchen: Nummer, Name, Beschreibung" aria-label="Katalog durchsuchen">
      <select id="k-kat" aria-label="Kategorie"></select>
      <label class="check"><input type="checkbox" id="k-inaktiv"> inaktive zeigen</label>
      ${isAdmin ? '<span class="btn-row"><button class="btn primary" data-action="new-artikel">+ Artikel</button><button class="btn" data-action="import">Import (CSV)</button><button class="btn" data-action="export">Export (CSV)</button></span>' : ''}
    </div>
    <p class="small muted" id="k-info"></p>
    <div id="k-list" class="stack-s"></div></div>`;
}
function renderKatalogListe() {
  const el = $('#k-list'); if (!el) return;
  const sel = $('#k-kat'); sel.innerHTML = katOptions(sel.value);
  if (!K.loaded) { el.innerHTML = '<p class="muted">Wird geladen …</p>'; return; }
  if (!K.list.length) { el.innerHTML = `<div class="empty">Der Katalog ist noch leer.${isAdmin ? ' Importieren Sie Ihre Artikelliste mit «Import (CSV)» oder legen Sie Artikel einzeln an.' : ''}</div>`; $('#k-info').textContent = ''; return; }
  const q = $('#k-q').value, kat = sel.value, inakt = $('#k-inaktiv').checked;
  const list = search(K.list.filter(a => (inakt || a.a) && (!kat || a.k === kat) && matches(a, q)), q);
  $('#k-info').textContent = `${list.length} von ${K.list.length} Artikeln${list.length > 300 ? ' · die ersten 300 werden angezeigt, bitte Suche verfeinern' : ''}`;
  const chips = (typ, id) => { const l = relOf(typ, id); return l.length ? `<div class="small"><span class="muted">${TYPEN[typ]}:</span> ${l.map(x => `<span class="chip">${esc(K.byId.get(x)?.nr)}</span>`).join(' ')}</div>` : ''; };
  el.innerHTML = list.slice(0, 300).map(a => `<button class="card item${a.a ? '' : ' is-off'}" data-action="open-artikel" data-id="${a.id}">
      <div class="item-main"><div class="small muted">${esc(a.nr)}${a.k ? ' · ' + esc(a.k) : ''}${a.a ? '' : ' · inaktiv'}</div><strong>${esc(a.b)}</strong>
        ${a.d ? `<div class="small muted clamp">${esc(a.d)}</div>` : ''}${chips('benoetigt', a.id)}${chips('passt', a.id)}${chips('passtAn', a.id)}${chips('ausschluss', a.id)}</div>
      <div class="item-side"><strong>${money(a.p)}</strong><div class="small muted">${esc(a.e)}</div></div></button>`).join('') || '<div class="empty">Keine Artikel gefunden.</div>';
}
function openArtikel(id) {
  const a = id ? K.byId.get(id) : null, f = $('#form-artikel'); f.reset(); editArtikelId = a ? a.id : null;
  $('#artikel-title').textContent = a ? (isAdmin ? 'Artikel bearbeiten' : 'Artikel') : 'Neuer Artikel';
  const nrs = typ => a ? relOf(typ, a.id).map(x => K.byId.get(x)?.nr).filter(Boolean).join(', ') : '';
  f.nr.value = a?.nr || ''; f.kategorie.value = a?.k || ''; f.bezeichnung.value = a?.b || ''; f.preis.value = a ? numIn(a.p) : '';
  f.einheit.value = a?.e || 'Stk.'; f.beschreibung.value = a?.d || ''; f.aktiv.value = !a || a.a ? '1' : '0';
  f.passt.value = nrs('passt'); f.benoetigt.value = nrs('benoetigt'); f.ausschluss.value = nrs('ausschluss');
  const rev = typ => a ? relOf(typ, a.id).map(x => K.byId.get(x)?.nr).filter(Boolean) : [];
  const von = rev('benoetigtVon'), an = rev('passtAn');
  $('#ar-info').textContent = [von.length ? `Wird zwingend benötigt von: ${von.join(', ')}` : '', an.length ? `Ist Zubehör für: ${an.join(', ')}` : ''].filter(Boolean).join(' · ');
  for (const i of $$('input, textarea, select', f)) i.disabled = !isAdmin;
  $('#ar-del').hidden = !isAdmin || !a; $('#ar-save').hidden = !isAdmin;
  $('#dlg-artikel').showModal();
}
function csvField(v) { v = String(v ?? ''); return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function download(name, text) {
  const url = URL.createObjectURL(new Blob(['﻿' + text], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const CSV_HEAD = ['Artikelnummer', 'Bezeichnung', 'Beschreibung', 'Kategorie', 'Preis', 'Einheit', 'Aktiv', 'Zubehör', 'Benötigt', 'Nicht kombinierbar mit'];
function exportKatalog() {
  const nrs = (typ, id) => relOf(typ, id).map(x => K.byId.get(x)?.nr).filter(Boolean).join(', ');
  const rows = K.list.map(a => [a.nr, a.b, a.d, a.k, numIn(a.p), a.e, a.a ? 'ja' : 'nein', nrs('passt', a.id), nrs('benoetigt', a.id), nrs('ausschluss', a.id)]);
  download(`katalog-${today()}.csv`, [CSV_HEAD, ...rows].map(r => r.map(csvField).join(';')).join('\r\n'));
}
function vorlage() {
  const rows = [CSV_HEAD,
    ['UPM-50', 'Universalprüfmaschine 50 kN', 'Tischgerät, Prüfraum 1100 mm, inkl. Steuerung', 'Grundmaschine', '48500,00', 'Stk.', 'ja', 'KA-5, KA-50, PH-ZUG', 'KA-50', ''],
    ['KA-50', 'Kraftaufnehmer 50 kN', 'Genauigkeitsklasse 0,5 ab 0,2 % Nennkraft', 'Kraftaufnehmer', '3900,00', 'Stk.', 'ja', 'PH-ZUG', '', ''],
    ['PH-ZUG', 'Keilspannprobenhalter 10 kN', 'Für Flachproben bis 10 mm', 'Probenhalter', '2400,00', 'Paar', 'ja', '', '', '']];
  download('katalog-vorlage.csv', rows.map(r => r.map(csvField).join(';')).join('\r\n'));
}

/* ---------- CSV-Import ---------- */
const COLS = {
  nr: ['artikelnummer', 'artikelnr', 'artnr', 'nummer', 'nr', 'materialnummer', 'material', 'sachnummer', 'artikel', 'id'],
  bezeichnung: ['bezeichnung', 'name', 'kurztext', 'titel', 'artikelbezeichnung', 'benennung'],
  beschreibung: ['beschreibung', 'langtext', 'text', 'details', 'artikelbeschreibung'],
  kategorie: ['kategorie', 'gruppe', 'warengruppe', 'produktgruppe', 'typ', 'artikelgruppe'],
  preis: ['preis', 'listenpreis', 'vkpreis', 'vk', 'verkaufspreis', 'nettopreis', 'preiseur', 'preisnetto', 'preischf'],
  einheit: ['einheit', 'me', 'mengeneinheit'],
  aktiv: ['aktiv', 'status'],
  passt: ['zubehor', 'zubehoer', 'passendeszubehor', 'passtzu', 'passendzu', 'passt', 'optionen', 'kompatibel', 'kompatibelmit', 'kombinierbarmit'],
  benoetigt: ['benotigt', 'benoetigt', 'erforderlich', 'voraussetzung', 'braucht', 'pflicht'],
  ausschluss: ['nichtkombinierbarmit', 'nichtkombinierbar', 'schliesstaus', 'ausschluss', 'inkompatibel', 'ausgeschlossen'],
};
const COL_LABEL = {nr: 'Artikelnummer', bezeichnung: 'Bezeichnung', beschreibung: 'Beschreibung', kategorie: 'Kategorie', preis: 'Preis', einheit: 'Einheit', aktiv: 'Aktiv', passt: 'Zubehör', benoetigt: 'Benötigt', ausschluss: 'Nicht kombinierbar'};
let IMP = null;
function decode(buf) { try { return new TextDecoder('utf-8', {fatal: true}).decode(buf); } catch (_) { return new TextDecoder('windows-1252').decode(buf); } }
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0], cnt = ch => first.split(ch).length;
  const sep = [';', '\t', ','].reduce((b, c) => cnt(c) > cnt(b) ? c : b, ';');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"' && f === '') q = true;
    else if (c === sep) { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
const normHead = s => norm(s).replace(/[^a-z0-9]/g, '');
function prepareImport(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return {error: 'Die Datei enthält keine Datenzeilen.'};
  const head = rows[0].map(normHead), map = {};
  for (const [key, names] of Object.entries(COLS)) { const i = head.findIndex(h => names.includes(h)); if (i > -1 && !Object.values(map).includes(i)) map[key] = i; }
  if (map.nr === undefined) return {error: 'Keine Spalte «Artikelnummer» gefunden. Bitte die erste Zeile prüfen (Spaltennamen).'};
  const val = (r, k) => map[k] === undefined ? '' : String(r[map[k]] ?? '').trim();
  const data = rows.slice(1).map(r => {
    const o = {nr: val(r, 'nr')};
    for (const k of ['bezeichnung', 'beschreibung', 'kategorie', 'einheit', 'passt', 'benoetigt', 'ausschluss']) if (map[k] !== undefined) o[k] = val(r, k);
    if (map.preis !== undefined) o.preis = parseNum(val(r, 'preis'));
    if (map.aktiv !== undefined) o.aktiv = !/^(nein|no|0|inaktiv|false|n)$/i.test(val(r, 'aktiv'));
    return o;
  }).filter(o => o.nr);
  const seen = new Set(), dup = new Set();
  for (const o of data) { const k = o.nr.toLowerCase(); if (seen.has(k)) dup.add(o.nr); seen.add(k); }
  return {map, data, dup: [...dup], unmapped: rows[0].filter((_, i) => !Object.values(map).includes(i) && rows[0][i].trim())};
}
function renderImportPreview() {
  const el = $('#imp-preview');
  if (!IMP) { el.innerHTML = ''; $('#imp-go').disabled = true; return; }
  if (IMP.error) { el.innerHTML = `<div class="banner err">${esc(IMP.error)}</div>`; $('#imp-go').disabled = true; return; }
  const keys = Object.keys(IMP.map), neu = IMP.data.filter(o => !K.byNr.has(o.nr.toLowerCase())).length;
  el.innerHTML = `<div class="banner ok"><strong>${IMP.data.length} Artikel</strong> gefunden: ${neu} neu, ${IMP.data.length - neu} werden aktualisiert.</div>
    <p class="small"><strong>Erkannte Spalten:</strong> ${keys.map(k => esc(COL_LABEL[k])).join(', ')}${IMP.unmapped.length ? `<br><span class="muted">Nicht verwendet: ${IMP.unmapped.map(esc).join(', ')}</span>` : ''}</p>
    ${IMP.dup.length ? `<div class="banner warn small">Doppelte Artikelnummern (letzte Zeile gilt): ${IMP.dup.slice(0, 10).map(esc).join(', ')}</div>` : ''}
    <div class="table-wrap"><table class="tbl small"><thead><tr>${keys.map(k => `<th>${esc(COL_LABEL[k])}</th>`).join('')}</tr></thead>
    <tbody>${IMP.data.slice(0, 5).map(o => `<tr>${keys.map(k => `<td>${esc(k === 'preis' ? money(o.preis) : k === 'aktiv' ? (o.aktiv ? 'ja' : 'nein') : o[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${IMP.data.length > 5 ? `<p class="small muted">… und ${IMP.data.length - 5} weitere Zeilen</p>` : ''}`;
  $('#imp-go').disabled = false; $('#imp-go').textContent = `${IMP.data.length} Artikel importieren`;
}
async function runImport() {
  const btn = $('#imp-go'); btn.disabled = true;
  const cols = Object.keys(IMP.map).filter(k => ['bezeichnung', 'beschreibung', 'kategorie', 'preis', 'einheit'].includes(k));
  const rows = IMP.data.map(({passt, benoetigt, ausschluss, ...r}) => r);
  let neu = 0, geaendert = 0;
  for (let i = 0; i < rows.length; i += 400) {
    btn.textContent = `Wird importiert … ${Math.min(i + 400, rows.length)} / ${rows.length}`;
    const d = await call('import_artikel', {cols, rows: rows.slice(i, i + 400)});
    if (!d) { btn.disabled = false; btn.textContent = 'Erneut versuchen'; return; }
    neu += d.neu; geaendert += d.geaendert;
  }
  const relCols = Object.keys(IMP.map).filter(k => ['passt', 'benoetigt', 'ausschluss'].includes(k));
  btn.textContent = 'Beziehungen werden gespeichert …';
  const d = await call('import_finish', {nrs: rows.map(r => r.nr), deaktivieren: $('#imp-deakt').checked, relCols,
    beziehungen: relCols.length ? IMP.data.map(o => ({nr: o.nr, passt: o.passt, benoetigt: o.benoetigt, ausschluss: o.ausschluss})) : []});
  if (!d) { btn.disabled = false; btn.textContent = 'Erneut versuchen'; return; }
  $('#dlg-import').close();
  let msg = `Import fertig: ${neu} neu, ${geaendert} aktualisiert`;
  if (d.deaktiviert) msg += `, ${d.deaktiviert} auf inaktiv gesetzt`;
  toast(msg + '.');
  if (d.unbekanntAnzahl) alert(`Import fertig. Hinweis: ${d.unbekanntAnzahl} Artikelnummern in den Spalten «Zubehör / Benötigt / Nicht kombinierbar» gibt es im Katalog nicht und wurden übersprungen:\n\n${d.unbekannt.join(', ')}${d.unbekanntAnzahl > d.unbekannt.length ? ' …' : ''}`);
}

/* ---------- Einstellungen ---------- */
function renderEinstellungen() {
  const el = $('#view-einstellungen'); if (!isAdmin || !el) return;
  const st = S.settings, f = (k, l, extra = '') => `<div class="field"><label for="st-${k}">${l}</label><input id="st-${k}" name="${k}" value="${esc(st[k])}" ${extra}></div>`;
  const t = (k, l, rows = 3) => `<div class="field span2"><label for="st-${k}">${l}</label><textarea id="st-${k}" name="${k}" rows="${rows}">${esc(st[k])}</textarea></div>`;
  el.innerHTML = `<form class="card stack" id="form-settings"><h2>Einstellungen für Angebote</h2>
    <p class="small muted">Diese Angaben erscheinen auf jedem gedruckten Angebot.</p>
    <div class="grid2">
      ${f('firma_name', 'Firmenname', 'maxlength="200"')}
      ${f('firma_kontakt', 'Kontaktzeile (Fusszeile)', 'maxlength="300"')}
      ${t('firma_adresse', 'Firmenanschrift', 3)}
      ${f('waehrung', 'Währung (EUR, CHF, USD …)', 'maxlength="3"')}
      ${f('mwst', 'MwSt.-Satz in %', 'inputmode="decimal"')}
      ${f('gueltigkeit_tage', 'Angebot gültig (Tage)', 'inputmode="numeric"')}
      ${f('nummer_prefix', 'Kürzel für Angebotsnummer (z. B. A → A-2026-0001)', 'maxlength="10"')}
      ${f('kunden_start', 'Erste Kundennummer (5-stellig)', 'inputmode="numeric" maxlength="5"')}
      ${f('nachfass_tage', 'Nachfassen nach … Tagen (bei «Versendet»)', 'inputmode="numeric" maxlength="2"')}
      ${t('einleitung', 'Standard-Einleitung für neue Angebote')}
      ${t('bedingungen', 'Lieferung und Zahlung (unter den Positionen)', 4)}
      ${t('fusstext', 'Schlusstext')}
    </div>
    <h3>KI-Anschreiben</h3>
    <p class="small muted">Mit einem API-Schlüssel von Anthropic (console.anthropic.com) kann die Einleitung eines Angebots per Klick formuliert werden.
      An die KI gehen nur Firmenname des Kunden, Betreff, interne Notiz und Positionen, keine Ansprechpersonen oder Anschriften. Kosten: wenige Cent pro Text.</p>
    <div class="grid2">
      <div class="field"><label for="st-ki_key">API-Schlüssel ${S.kiAktiv ? '(gespeichert ✓)' : '(noch keiner)'}</label><input id="st-ki_key" name="ki_key" type="password" autocomplete="off" placeholder="${S.kiAktiv ? 'leer lassen = unverändert' : 'sk-ant-…'}"></div>
      <div class="field">${S.kiAktiv ? '<label class="check" style="margin-top:24px"><input type="checkbox" name="ki_key_loeschen" value="1"> Schlüssel entfernen</label>' : ''}</div>
      ${t('ki_stil', 'Stil-Vorgaben für die KI (optional), z. B. «immer Service und Kalibrierung erwähnen»', 2)}
    </div>
    <div><button class="btn primary" type="submit">Speichern</button></div></form>`;
}

/* ---------- Benutzer ---------- */
function renderBenutzer() {
  const el = $('#view-benutzer'); if (!isAdmin || !el) return;
  el.innerHTML = `<div class="stack"><div class="row-between"><h2>Benutzer</h2><button class="btn primary" data-action="new-user">+ Benutzer anlegen</button></div>
    <p class="small muted">Administration: alles, auch Katalog und Einstellungen · Mitarbeit: Angebote erstellen und bearbeiten · Nur lesen: ansehen und drucken.</p>
    ${(S.users || []).map(u => `<div class="card row-between"><div><strong>${esc(u.name)}</strong><br><span class="small muted">${esc(u.email)}</span></div>
      <div class="small">${ROLLEN[u.role] || esc(u.role)}${u.active ? '' : ' · gesperrt'}<br><span class="muted">Zuletzt: ${u.lastLogin ? fmtT(u.lastLogin) : 'noch nie'}</span></div>
      <button class="btn" data-action="edit-user" data-id="${u.id}">Bearbeiten</button></div>`).join('')}</div>`;
}
function genPw() { const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const a = new Uint32Array(12); crypto.getRandomValues(a); return [...a].map(x => c[x % c.length]).join(''); }
function openUser(id) {
  editUserId = id || null; const u = id ? S.users.find(x => x.id === id) : null, f = $('#form-user'); f.reset();
  $('#user-title').textContent = u ? 'Benutzer bearbeiten' : 'Benutzer anlegen';
  $('#u-pass-lbl').textContent = u ? 'Neues Passwort (leer = unverändert)' : 'Startpasswort (mind. 10 Zeichen)';
  f.password.required = !u;
  if (u) { f.name.value = u.name; f.email.value = u.email; f.role.value = u.role; f.active.value = u.active ? '1' : '0'; } else f.password.value = genPw();
  $('#dlg-user').showModal();
}

/* ---------- Ereignisse ---------- */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'a-q') return renderAngebotListe();
  if (t.id === 'k-q') return renderKatalogListe();
  if (t.id === 'pick-q') return renderPick();
  if (t.id === 'ku-q') return renderKundenListe();
  if (t.id === 'kw-q') return renderKundeWahl();
  if (!A || !canWrite || !t.closest('#view-editor')) return;
  if (t.dataset.f) {
    A[t.dataset.f] = t.dataset.f === 'rabatt' ? Math.min(100, Math.max(0, parseNum(t.value))) : t.value;
    if (t.dataset.f === 'rabatt') updateSums();
    if (t.dataset.f === 'kunde_firma' && !A.kunde_id) renderEdKunde();
    if (t.dataset.f === 'status') {
      const tage = parseInt(S.settings.nachfass_tage, 10) || 7;
      if (A.status === 'versendet' && !A.nachfassen_am) A.nachfassen_am = today(tage);
      if (A.status === 'gewonnen' || A.status === 'verloren') A.nachfassen_am = '';
      if (A.status !== 'verloren') A.verlust_grund = '';
      renderStatusExtra();
      if (A.status === 'versendet') toast(`Nachfassen ist für den ${fmtD(A.nachfassen_am)} vorgemerkt.`);
    }
    return scheduleSave();
  }
  if (t.id === 'ed-kontaktwahl') {
    const k = S.kunden.find(x => x.id === A.kunde_id), c = k && (k.kontakte || []).find(x => x.id === t.value);
    A.kontakt_id = c ? c.id : null;
    if (c) { A.kunde_kontakt = c.name; A.kunde_email = c.email || k.email || ''; $('#ed-kunde_kontakt').value = A.kunde_kontakt; $('#ed-kunde_email').value = A.kunde_email; }
    else $('#ed-kunde_kontakt').focus();
    return scheduleSave();
  }
  const row = t.closest('.pos'); if (!row || !t.dataset.p) return;
  const p = A.positionen[+row.dataset.i], k = t.dataset.p;
  if (k === 'optional') { p.optional = t.checked; return changed(true); }
  p[k] = ['menge', 'preis'].includes(k) ? parseNum(t.value) : k === 'rabatt' ? Math.min(100, Math.max(0, parseNum(t.value))) : t.value;
  if (['menge', 'preis', 'rabatt'].includes(k)) { $('[data-tot]', row).textContent = money(posTotal(p)); updateSums(); }
  scheduleSave();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'a-status') return renderAngebotListe();
  if (t.id === 'k-kat' || t.id === 'k-inaktiv') return renderKatalogListe();
  if (t.id === 'pick-kat' || t.id === 'pick-passend') return renderPick();
  if (t.id === 'imp-file' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => { IMP = prepareImport(decode(r.result)); renderImportPreview(); };
    r.readAsArrayBuffer(t.files[0]);
  }
  // Zahlen nach dem Verlassen des Feldes schön darstellen
  if (A && t.closest('#view-editor') && (['menge', 'preis', 'rabatt'].includes(t.dataset.p) || t.dataset.f === 'rabatt')) {
    const v = t.dataset.f ? A.rabatt : A.positionen[+t.closest('.pos').dataset.i][t.dataset.p];
    t.value = numIn(v);
  }
});
document.addEventListener('submit', async e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'form-user') { if (await call('user_save', {id: editUserId, name: f.name.value, email: f.email.value, role: f.role.value, active: f.active.value === '1', password: f.password.value})) { $('#dlg-user').close(); toast('Gespeichert. Passwort persönlich weitergeben.'); } }
  if (f.id === 'form-pw') { if (await call('password', {old: f.old.value, neu: f.neu.value})) { $('#dlg-pw').close(); toast('Passwort geändert'); } }
  if (f.id === 'form-artikel') {
    const d = await call('artikel_save', {id: editArtikelId, nr: f.nr.value, bezeichnung: f.bezeichnung.value, kategorie: f.kategorie.value, preis: parseNum(f.preis.value),
      einheit: f.einheit.value, beschreibung: f.beschreibung.value, aktiv: f.aktiv.value === '1', passt: f.passt.value, benoetigt: f.benoetigt.value, ausschluss: f.ausschluss.value});
    if (d) { $('#dlg-artikel').close(); toast('Artikel gespeichert'); }
  }
  if (f.id === 'form-import' && IMP && !IMP.error) runImport();
  if (f.id === 'form-paket') {
    const name = f.name.value.trim();
    if (S.pakete.some(x => x.name.toLowerCase() === name.toLowerCase()) && !confirm(`Es gibt schon ein Paket «${name}». Ersetzen?`)) return;
    if (await call('paket_save', {name, beschreibung: f.beschreibung.value, positionen: payload(A).positionen})) { $('#dlg-paket-save').close(); toast(`Paket «${name}» gespeichert`); }
  }
  if (f.id === 'form-kontakt') {
    const d = await call('kontakt_save', {id: editKontaktId, kunde_id: kontaktKundeId, name: f.name.value, funktion: f.funktion.value, email: f.email.value, telefon: f.telefon.value});
    if (d) { $('#dlg-kontakt').close(); toast('Ansprechperson gespeichert'); if (A && view === 'editor') renderEdKunde(); }
  }
  if (f.id === 'form-kunde') {
    const v = Object.fromEntries(new FormData(f)); v.id = editKundeId; v.rabatt = parseNum(v.rabatt);
    const d = await call('kunde_save', v);
    if (d) {
      const dlg = $('#dlg-kunde'); dlg.close(); toast(`Kunde ${d.kunde.nummer} gespeichert`);
      if (dlg.dataset.forEditor && A) { applyKunde(S.kunden.find(x => x.id === d.kunde.id)); $('#dlg-kundewahl').close(); }
      else if (!editKundeId) openKunde(d.kunde.id);
    }
  }
  if (f.id === 'form-settings') { const v = Object.fromEntries(new FormData(f)); if (await call('settings_save', v)) { renderEinstellungen(); toast('Einstellungen gespeichert'); } }
});
document.addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) { e.target.closest('dialog')?.close(); return; }
  const t = e.target.closest('.tab');
  if (t) {
    if (view === 'editor') { if (!(await flushSave())) return; A = null; }
    history.replaceState(null, '', location.pathname); kundeId = t.dataset.view === 'kunden' ? null : kundeId;
    showView(t.dataset.view); renderAngebotListe(); renderKundenListe(); return;
  }
  const a = e.target.closest('[data-action]'); if (!a || a.disabled) return;
  const act = a.dataset.action;
  if (act === 'new-angebot') openAngebot(null, null, 'angebote');
  if (act === 'open-angebot') openAngebot(a.dataset.id);
  if (act === 'back') { if (await flushSave()) { A = null; if (backTo === 'kunde' && kundeId) openKunde(kundeId); else { history.replaceState(null, '', location.pathname); showView('angebote'); } } }
  if (act === 'open-kunde' || act === 'goto-kunde') { if (view === 'editor') { if (!(await flushSave())) return; A = null; } openKunde(a.dataset.id); }
  if (act === 'back-kunden') { kundeId = null; history.replaceState(null, '', location.pathname); showView('kunden'); }
  if (act === 'new-kunde') openKundeDlg(null);
  if (act === 'edit-kunde') openKundeDlg(kundeId);
  if (act === 'new-angebot-kunde') openAngebot(null, kundeId, 'kunde');
  if (act === 'delete-kunde') {
    const k = S.kunden.find(x => x.id === kundeId); if (!k) return;
    if (!confirm(`Kunde ${k.nummer} ${k.firma} löschen? Die Angebote bleiben erhalten, sind aber keinem Kunden mehr zugeordnet.`)) return;
    if (await call('kunde_delete', {id: k.id})) { kundeId = null; history.replaceState(null, '', location.pathname); showView('kunden'); toast('Kunde gelöscht'); }
  }
  if (act === 'pick-kunde') { $('#kw-q').value = ''; renderKundeWahl(); $('#dlg-kundewahl').showModal(); }
  if (act === 'choose-kunde') { applyKunde(S.kunden.find(x => x.id === a.dataset.id)); $('#dlg-kundewahl').close(); }
  if (act === 'new-kunde-wahl') openKundeDlg(null, {firma: $('#kw-q').value.trim()});
  if (act === 'kunde-aus-angebot') openKundeDlg(null, {firma: A.kunde_firma, kontakt: A.kunde_kontakt, kontakt_email: A.kunde_email, adresse: A.kunde_adresse});
  if (act === 'pick') openPick();
  if (act === 'pick-paket') { renderPakete(); $('#dlg-paket').showModal(); }
  if (act === 'use-paket') usePaket(a.dataset.id);
  if (act === 'delete-paket') {
    const pk = S.pakete.find(x => x.id === a.dataset.id); if (!pk || !confirm(`Paket «${pk.name}» löschen?`)) return;
    if (await call('paket_delete', {id: pk.id})) { renderPakete(); toast('Paket gelöscht'); }
  }
  if (act === 'save-paket') {
    if (!A.positionen.length) { toast('Das Angebot hat noch keine Positionen.'); return; }
    const f = $('#form-paket'); f.reset(); f.name.value = A.titel || ''; $('#dlg-paket-save').showModal();
  }
  if (act === 'new-version') {
    if (!(await flushSave()) || !A.id) { if (!A.id) toast('Bitte das Angebot zuerst speichern (Positionen hinzufügen).'); return; }
    if (!confirm(`Neue Version von ${A.nummer} anlegen? Die bisherige Version bleibt unverändert erhalten.`)) return;
    const d = await call('angebot_version', {id: A.id});
    if (d) { await openAngebot(d.angebot.id); toast(`${d.angebot.nummer} Rev. ${d.angebot.revision} angelegt`); }
  }
  if (act === 'nf-later' || act === 'nf-done') {
    const tage = parseInt(S.settings.nachfass_tage, 10) || 7;
    if (await call('nachfassen', {id: a.dataset.id, datum: act === 'nf-later' ? today(tage) : null})) toast(act === 'nf-later' ? `Wieder vorgemerkt für ${fmtD(today(tage))}` : 'Nachfassen erledigt');
  }
  if (act === 'new-kontakt' || act === 'edit-kontakt') openKontaktDlg(a.dataset.id || null);
  if (act === 'delete-kontakt') {
    if (!confirm('Diese Ansprechperson löschen?')) return;
    if (await call('kontakt_delete', {id: editKontaktId})) { $('#dlg-kontakt').close(); toast('Ansprechperson gelöscht'); }
  }
  if (act === 'ki-einleitung') {
    if (!S.kiAktiv) { toast(isAdmin ? 'Bitte zuerst unter «Einstellungen» den API-Schlüssel eintragen.' : 'Die KI ist noch nicht eingerichtet. Bitte die Administration fragen.'); return; }
    if (!A.positionen.length) { toast('Bitte zuerst Positionen hinzufügen.'); return; }
    const alt = A.einleitung.trim();
    if (alt && alt !== (S.settings.einleitung || '').trim() && !confirm('Die bisherige Einleitung wird ersetzt. Fortfahren?')) return;
    a.disabled = true; const label = a.textContent; a.textContent = 'KI schreibt …';
    const d = await call('ki_einleitung', payload(A));
    a.disabled = false; a.textContent = label;
    if (d && A) { A.einleitung = d.text; $('#ed-einleitung').value = d.text; scheduleSave(); toast('Einleitung erstellt. Bitte durchlesen und bei Bedarf anpassen.'); }
  }
  if (act === 'add-art') addArtikel(a.dataset.id, $('#dlg-pick').open);
  if (act === 'free-pos') { A.positionen.push({_k: Math.random(), artikel_id: null, nr: '', bezeichnung: '', beschreibung: '', menge: 1, einheit: 'Stk.', preis: 0, rabatt: 0, optional: false}); changed(true); $$('#ed-pos [data-p=bezeichnung]').pop()?.focus(); }
  if (act === 'pos-up' || act === 'pos-down' || act === 'pos-del') {
    const i = +a.closest('.pos').dataset.i, P = A.positionen;
    if (act === 'pos-del') { if (!confirm(`Position «${P[i].bezeichnung || P[i].nr || 'ohne Namen'}» entfernen?`)) return; P.splice(i, 1); }
    else { const j = act === 'pos-up' ? i - 1 : i + 1; if (j < 0 || j >= P.length) return; [P[i], P[j]] = [P[j], P[i]]; }
    changed(true);
  }
  if (act === 'print') {
    if (canWrite && !A.id && !A.positionen.length && !dirty) { toast('Bitte zuerst Positionen hinzufügen.'); return; }
    if (canWrite && (dirty || !A.id)) { dirty = true; if (!(await saveNow())) { toast('Speichern hat nicht geklappt.'); return; } }
    location.href = 'druck.php?id=' + encodeURIComponent(A.id);
  }
  if (act === 'copy-angebot') {
    if (!(await flushSave()) || !A.id) return;
    const d = await call('angebot_copy', {id: A.id}); if (d) { await openAngebot(d.angebot.id); toast(`Kopie ${d.angebot.nummer} angelegt`); }
  }
  if (act === 'delete-angebot') {
    if (!A.id) { A = null; dirty = false; showView('angebote'); return; }
    if (!confirm(`Angebot ${A.nummer} endgültig löschen?`)) return;
    clearTimeout(saveT); dirty = false;
    if (await call('angebot_delete', {id: A.id})) { A = null; history.replaceState(null, '', location.pathname); showView('angebote'); toast('Angebot gelöscht'); }
  }
  if (act === 'open-artikel') openArtikel(a.dataset.id);
  if (act === 'new-artikel') openArtikel(null);
  if (act === 'delete-artikel') {
    const art = K.byId.get(editArtikelId); if (!art) return;
    if (!confirm(`Artikel ${art.nr} löschen? Bestehende Angebote behalten ihre Positionen. Tipp: «Inaktiv» blendet ihn nur aus.`)) return;
    if (await call('artikel_delete', {id: art.id})) { $('#dlg-artikel').close(); toast('Artikel gelöscht'); }
  }
  if (act === 'import') { IMP = null; $('#form-import').reset(); renderImportPreview(); $('#imp-go').textContent = 'Importieren'; $('#dlg-import').showModal(); }
  if (act === 'export') exportKatalog();
  if (act === 'vorlage') vorlage();
  if (act === 'new-user') openUser();
  if (act === 'edit-user') openUser(a.dataset.id);
  if (act === 'pw') { $('#form-pw').reset(); $('#dlg-pw').showModal(); }
});
window.addEventListener('beforeunload', e => { if (A && (dirty || saving)) { saveNow(); e.preventDefault(); e.returnValue = ''; } });

shellAngebote(); shellKunden(); shellKatalog(); showView(); render();
const fromHash = () => {
  const m = location.hash.match(/^#angebot=(\d+)$/); if (m && (!A || A.id !== m[1])) return openAngebot(m[1], null, 'angebote');
  const k = location.hash.match(/^#kunde=(\d+)$/); if (k && kundeId !== k[1]) openKunde(k[1]);
};
load().then(fromHash);
window.addEventListener('hashchange', fromHash);
// Neuen Stand holen, solange sichtbar und kein Dialog offen ist
setInterval(() => { if (document.visibilityState === 'visible' && !document.querySelector('dialog[open]') && !busy && !saving) load(); }, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !busy) load(); });
})();
