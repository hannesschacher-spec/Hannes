'use strict';
(function () {
const FARBEN=[['rot','Rot'],['blau','Blau'],['gruen','Grün'],['gelb','Gelb'],['orange','Orange'],['violett','Violett'],['braun','Braun'],['grau','Grau']];
const ARTEN_VORSCHLAG=['Wohnplatz Einzelzimmer','Wohnplatz Doppelzimmer','Betreutes Wohnen (Studio)','Entlastungs- / Ferienplatz','Notfallplatz','Arbeitsplatz Werkstatt','Tagesstruktur','Ausbildungsplatz'];
const STATUS={offen:'Offen',rueckruf:'Rückruf nötig',angeboten:'Platz angeboten',zugesagt:'Zugesagt',abgeschlossen:'Abgeschlossen ohne Platz'};
const ROLLEN={admin:'Administration',mitarbeit:'Mitarbeit',lesen:'Nur lesen'};
const OPEN=['offen','rueckruf','angeboten'];
const STALE_DAYS=14;

const $=s=>document.querySelector(s);
const CSRF=document.querySelector('meta[name=csrf]').content;
const ME=JSON.parse(document.querySelector('meta[name=user]').content);
const canWrite=ME.role!=='lesen', isAdmin=ME.role==='admin';

let haeuser=[],anfragen=[],users=[],retention=12,loaded=false,offline=false;
let view='anruf',iam='',pick=null,aFilter='offen',aHaus='',aSuche='';
let editHausId=null,editPlatz=null,editUserId=null,openId=null,confirmDel=false,busy=false;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=iso=>{if(!iso)return '–';const d=new Date(iso.length===10?iso+'T12:00:00':iso);return isNaN(d)?'–':d.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'})};
const fmtT=iso=>{const d=new Date(iso);return isNaN(d)?'–':d.toLocaleString('de-CH',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})};
const daysSince=iso=>iso?Math.floor((Date.now()-new Date(iso).getTime())/864e5):0;
const farbe=f=>FARBEN.some(x=>x[0]===f)?f:'grau';
const haus=id=>haeuser.find(h=>h.id===String(id));
const hausName=id=>haus(id)?.name||'Unbekanntes Haus';
const plaetze=h=>(h&&Array.isArray(h.plaetze))?h.plaetze:[];
const freiSum=h=>plaetze(h).reduce((s,p)=>s+(p.frei|0),0);
const norm=s=>String(s||'').trim().toLowerCase();
function alleArten(){const m=new Map();for(const h of haeuser)for(const p of plaetze(h))if(p.art&&!m.has(norm(p.art)))m.set(norm(p.art),p.art);return [...m.values()].sort((a,b)=>a.localeCompare(b,'de'))}
const roof=f=>`<svg class="roof" viewBox="0 0 30 26" aria-hidden="true"><path d="M15 2 2 13h4v11h18V13h4z" fill="var(--h-${farbe(f)})"/><rect x="12" y="16" width="6" height="8" fill="var(--surface)" opacity=".85"/></svg>`;

function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,3200)}
function lsGet(k){try{return localStorage.getItem(k)}catch(_){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(_){}}

/* ---------- Server ---------- */
function apply(d){if(d&&Array.isArray(d.haeuser)){haeuser=d.haeuser;anfragen=d.anfragen||[];users=d.users||[];retention=d.retentionMonths||12;loaded=true;if(iam&&!haus(iam))iam=''}}
async function load(){
  try{const r=await fetch('api.php?a=state',{credentials:'same-origin',cache:'no-store'});
    if(r.status===401){location.reload();return}
    const d=await r.json();offline=false;apply(d)}catch(_){offline=true}
  renderAll();
}
async function call(action,body){
  if(busy)await new Promise(r=>setTimeout(r,150));
  busy=true;
  try{
    const r=await fetch('api.php?a='+encodeURIComponent(action),{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF':CSRF},body:JSON.stringify(body||{})});
    if(r.status===401){location.reload();return null}
    const d=await r.json().catch(()=>({error:'Unerwartete Antwort vom Server.'}));
    if(!r.ok||d.error){toast(d.error==='csrf'?'Die Seite war zu lange offen. Bitte neu laden.':(d.error||'Speichern hat nicht geklappt.'));if(r.status===409)await load();return null}
    offline=false;apply(d);renderAll();return d;
  }catch(_){toast('Keine Verbindung zum Server. Bitte Internet prüfen.');return null}
  finally{busy=false}
}

/* ---------- Render ---------- */
function renderAll(){renderBanners();renderIam();renderCallSelects();renderResults();renderPlaetze();renderAnfragen();renderBenutzer();if(openId)renderAnfrage();
  document.querySelectorAll('[data-write]').forEach(b=>b.disabled=!canWrite);
  $('#cnt-open').textContent=anfragen.filter(r=>OPEN.includes(r.status)).length}

function renderBanners(){const o=[];
  if(offline)o.push('<div class="banner err">Keine Verbindung zum Server. Angezeigtes ist eventuell nicht aktuell.</div>');
  if(!canWrite)o.push('<div class="banner warn">Sie haben nur Leserechte.</div>');
  $('#banners').innerHTML=o.join('')}

function hausOptions(sel,empty){return (empty?`<option value="">${empty}</option>`:'')+haeuser.slice().sort((a,b)=>a.name.localeCompare(b.name,'de')).map(h=>`<option value="${h.id}" ${h.id===sel?'selected':''}>${esc(h.name)}</option>`).join('')}
function renderIam(){$('#iam').innerHTML=hausOptions(iam,'Haus wählen');const h=haus(iam);$('#iam-dot').className='dot '+(h?'c-'+farbe(h.farbe):'')}
function renderCallSelects(){
  const hs=$('#c-haus'),cur=hs.value||iam;hs.innerHTML=hausOptions(cur,'Nicht angegeben');
  const as=$('#c-art'),ca=as.value,arten=alleArten();
  as.innerHTML='<option value="">Noch unklar, alle freien Plätze zeigen</option>'+arten.map(a=>`<option ${a===ca?'selected':''}>${esc(a)}</option>`).join('');
  $('#arten-list').innerHTML=[...new Set([...arten,...ARTEN_VORSCHLAG])].map(a=>`<option value="${esc(a)}">`).join('');
  $('#call-now').textContent=new Date().toLocaleString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}

function resultList(art,calledId,opts){opts=opts||{};
  if(!loaded)return '<p class="muted">Wird geladen …</p>';
  if(!haeuser.length)return `<div class="empty"><h3>Noch keine Häuser angelegt</h3><p class="muted small">Unter «Freie Plätze» wird jedes Haus angelegt und eingetragen, welche Art von Platz wie oft frei ist.</p>${isAdmin?'<button class="btn primary" data-action="new-haus">Erstes Haus anlegen</button>':''}</div>`;
  const rows=[];
  for(const h of haeuser)for(const p of plaetze(h)){if(art&&norm(p.art)!==norm(art))continue;if(!art&&(p.frei|0)<1)continue;rows.push({h,p})}
  const missing=art?haeuser.filter(h=>!plaetze(h).some(p=>norm(p.art)===norm(art))):[];
  rows.sort((a,b)=>((b.p.frei|0)>0)-((a.p.frei|0)>0)||(b.h.id===calledId)-(a.h.id===calledId)||(b.p.frei|0)-(a.p.frei|0)||a.h.name.localeCompare(b.h.name,'de'));
  const card=({h,p})=>{const f=p.frei|0,isPick=!opts.assign&&pick&&pick.h===h.id&&pick.p===p.id,stale=daysSince(h.updatedAt)>STALE_DAYS;
    let act='';
    if(f&&opts.assign)act=`<span class="act"><button type="button" class="btn" data-action="assign" data-h="${h.id}" data-p="${p.id}" ${canWrite?'':'disabled'}>Platz zusagen (frei −1)</button></span>`;
    else if(f)act=`<span class="act"><button type="button" class="btn ${isPick?'primary':''}" data-action="pick" data-h="${h.id}" data-p="${p.id}">${isPick?'Vorgemerkt ✓':'Diesen Platz anbieten'}</button></span>`;
    return `<div class="res ${f?'':'zero'} ${isPick?'pick':''}"><span class="dot lg c-${farbe(h.farbe)}"></span>
      <div class="res-head"><strong>${esc(h.name)}${h.id===calledId?' <span class="pill here">Anruf hier</span>':''}</strong><span class="small muted">${esc(p.art)}</span></div>
      <div class="big">${f}<small>frei</small></div>
      <div class="meta">${p.ab?`<span>ab ${fmt(p.ab)}</span>`:''}${p.hinweis?`<span>${esc(p.hinweis)}</span>`:''}${h.kontakt||h.telefon?`<span class="muted">${esc([h.kontakt,h.telefon].filter(Boolean).join(' · '))}</span>`:''}<span class="${stale?'stale':'muted'}">Stand ${fmt(h.updatedAt)}</span>${act}</div></div>`};
  const free=rows.filter(r=>(r.p.frei|0)>0),zero=rows.filter(r=>(r.p.frei|0)<1);
  let html='';
  if(!free.length)html+=`<div class="banner warn">${art?`Zurzeit ist in keinem Haus ein Platz «${esc(art)}» frei.`:'Zurzeit ist in keinem Haus ein Platz frei.'} Anfrage speichern und auf «Rückruf nötig» setzen.</div>`;
  html+=free.map(card).join('');
  if(zero.length)html+='<p class="divider">Belegt</p>'+zero.map(card).join('');
  if(missing.length)html+=`<p class="small muted">Diese Platzart gibt es nicht in: ${missing.map(h=>esc(h.name)).join(', ')}</p>`;
  return html;
}
function renderResults(){
  const art=$('#c-art').value,cid=$('#c-haus').value;
  $('#res-sub').textContent=art||'alle Platzarten';
  if(pick&&!plaetze(haus(pick.h)).some(p=>p.id===pick.p))pick=null;
  $('#results').innerHTML=resultList(art,cid);
  const ph=pick&&haus(pick.h),pp=ph&&plaetze(ph).find(p=>p.id===pick.p);
  $('#pick-info').innerHTML=pp?`<span class="pill free">Angeboten: ${esc(ph.name)} · ${esc(pp.art)}</span>`:'';
}

function renderPlaetze(){
  const el=$('#view-plaetze');
  if(!loaded){el.innerHTML='<p class="muted">Wird geladen …</p>';return}
  if(!haeuser.length){el.innerHTML=`<div class="empty"><h2>Noch keine Häuser angelegt</h2><p class="muted">Legen Sie jedes Haus einmal an, zum Beispiel das Rote Haus und das Blaue Haus. Danach tragen Sie pro Haus ein, welche Art von Platz wie oft frei ist. Mit Plus und Minus halten Sie die Zahl aktuell.</p>${isAdmin?'<button class="btn primary" data-action="new-haus">Erstes Haus anlegen</button>':'<p class="small muted">Häuser legt die Administration an.</p>'}</div>`;return}
  const hs=haeuser.slice().sort((a,b)=>a.name.localeCompare(b.name,'de')),arten=alleArten();
  let html='<div class="stack" style="gap:18px">';
  if(arten.length){
    html+=`<div class="stack-s"><div class="section-head"><h2>Übersicht freie Plätze</h2><span class="muted small">Zahl = freie Plätze · – = Platzart gibt es dort nicht</span></div>
    <div class="matrix-wrap"><table class="matrix"><thead><tr><th>Platzart</th>${hs.map(h=>`<th><span><span class="dot c-${farbe(h.farbe)}"></span>${esc(h.name)}</span></th>`).join('')}<th>Total frei</th></tr></thead><tbody>`;
    for(const a of arten){let tot=0;html+=`<tr><td>${esc(a)}</td>`+hs.map(h=>{const ps=plaetze(h).filter(p=>norm(p.art)===norm(a));if(!ps.length)return '<td class="n z">–</td>';const f=ps.reduce((s,x)=>s+(x.frei|0),0);tot+=f;return `<td class="n ${f?'p':'z'}">${f}</td>`}).join('')+`<td class="n ${tot?'p':'z'}">${tot}</td></tr>`}
    html+=`</tbody><tfoot><tr><td>Total</td>${hs.map(h=>`<td class="n">${freiSum(h)}</td>`).join('')}<td class="n">${hs.reduce((s,h)=>s+freiSum(h),0)}</td></tr></tfoot></table></div></div>`;
  }
  html+=`<div class="section-head"><h2>Häuser</h2>${isAdmin?'<button class="btn" data-action="new-haus">+ Haus anlegen</button>':''}</div><div class="houses">`;
  for(const h of hs){const sum=freiSum(h),age=daysSince(h.updatedAt),stale=age>STALE_DAYS;
    html+=`<article class="house"><div class="house-head"><div>${roof(h.farbe)}<div style="min-width:0"><h3>${esc(h.name)}</h3><p class="small muted">${esc([h.kontakt,h.telefon].filter(Boolean).join(' · ')||'Keine Ansprechperson erfasst')}</p></div></div><div class="house-sum ${sum?'':'z'}">${sum}<small>frei</small></div></div>
    <div>${plaetze(h).length?plaetze(h).map(p=>{const f=p.frei|0;return `<div class="prow"><button type="button" class="art" data-action="edit-platz" data-h="${h.id}" data-p="${p.id}" ${canWrite?'':'disabled'}>${esc(p.art)}</button>
      <div class="stepper"><button type="button" class="btn sq" data-action="dec" data-p="${p.id}" aria-label="Ein freier Platz weniger" ${canWrite&&f>0?'':'disabled'}>−</button><output class="${f?'p':'z'}">${f}</output><button type="button" class="btn sq" data-action="inc" data-p="${p.id}" aria-label="Ein freier Platz mehr" ${canWrite?'':'disabled'}>+</button></div>
      ${p.gesamt||p.ab||p.hinweis?`<div class="info">${p.gesamt?`<span>${f} von ${p.gesamt|0} frei</span>`:''}${p.ab?`<span>frei ab ${fmt(p.ab)}</span>`:''}${p.hinweis?`<span>${esc(p.hinweis)}</span>`:''}</div>`:''}</div>`}).join(''):'<div class="prow"><span class="muted small">Noch keine Platzart eingetragen.</span></div>'}</div>
    <div class="house-foot"><span class="${stale?'stale':'muted'}">Stand ${fmt(h.updatedAt)}${stale?` · ${age} Tage alt`:''}</span>${canWrite?`<span class="row-s" style="gap:2px"><button class="btn ghost" data-action="new-platz" data-h="${h.id}">+ Platzart</button><button class="btn ghost" data-action="confirm-haus" data-h="${h.id}">Stand bestätigen</button>${isAdmin?`<button class="btn ghost" data-action="edit-haus" data-h="${h.id}">Haus bearbeiten</button>`:''}</span>`:''}</div></article>`}
  el.innerHTML=html+'</div></div>';
}

function renderAnfragen(){
  const el=$('#view-anfragen');
  if(!loaded){el.innerHTML='<p class="muted">Wird geladen …</p>';return}
  if(!anfragen.length){el.innerHTML='<div class="empty"><h2>Noch keine Anfragen</h2><p class="muted">Jeder Anruf, bei dem nach einem Platz gefragt wird, wird unter «Anruf aufnehmen» erfasst. Hier sehen alle Häuser, welche Anfragen offen sind und wer zurückgerufen werden muss.</p><button class="btn primary" data-view-go="anruf">Anruf aufnehmen</button></div>';return}
  const q=norm(aSuche);
  const list=anfragen.filter(r=>aFilter==='alle'||(aFilter==='offen'?OPEN.includes(r.status):r.status===aFilter)).filter(r=>!aHaus||r.hausId===aHaus||r.angebotHausId===aHaus)
    .filter(r=>!q||norm([r.anrufer,r.fuer,r.art,r.notiz,r.aufgenommenVon,r.telefon].join(' ')).includes(q));
  const cnt=s=>anfragen.filter(r=>s==='offen'?OPEN.includes(r.status):r.status===s).length;
  let html=`<div class="stack"><div class="toolbar"><div class="chips">
   ${[['offen','Alle offenen'],['rueckruf','Rückruf nötig'],['angeboten','Angeboten'],['zugesagt','Zugesagt'],['abgeschlossen','Ohne Platz'],['alle','Alle']].map(([k,l])=>`<button class="chip" data-af="${k}" aria-pressed="${aFilter===k}">${l}${k!=='alle'?` <span class="num">${cnt(k)}</span>`:''}</button>`).join('')}</div>
   <select id="a-haus" aria-label="Haus">${hausOptions(aHaus,'Alle Häuser')}</select><span class="spacer"></span>
   <input type="search" id="a-suche" placeholder="Anrufer, Kürzel, Platzart" value="${esc(aSuche)}" aria-label="Anfragen suchen"></div><div class="calls">`;
  html+=list.map(r=>{const h=haus(r.hausId),ah=haus(r.angebotHausId);return `<button class="call" data-action="open" data-id="${r.id}">
    <span class="l1"><span class="st st-${r.status}">${STATUS[r.status]||esc(r.status)}</span><strong>${esc(r.anrufer)}</strong>${r.fuer?`<span class="muted">für ${esc(r.fuer)}</span>`:''}</span>
    <span class="muted small num">${fmtT(r.createdAt)}</span>
    <span class="l2"><span>${esc(r.art||'Platzart offen')}</span>${h?`<span><span class="dot sm c-${farbe(h.farbe)}"></span> Anruf im ${esc(h.name)}</span>`:''}${ah?`<span>Angeboten: ${esc(ah.name)}</span>`:''}${r.telefon?`<span class="num">${esc(r.telefon)}</span>`:''}</span></button>`}).join('')||'<p class="muted">Keine Anfragen in dieser Auswahl.</p>';
  el.innerHTML=html+`</div><p class="small muted">Zugesagte und abgeschlossene Anfragen werden nach ${retention} Monaten automatisch gelöscht.</p></div>`;
}

function renderAnfrage(){
  const r=anfragen.find(x=>x.id===openId),box=$('#anfrage');
  if(!r){box.innerHTML='<div class="dlg-body"><p>Diese Anfrage wurde gelöscht.</p></div><div class="dlg-foot"><span></span><button class="btn" data-close>Schliessen</button></div>';return}
  const ah=haus(r.angebotHausId),ap=ah&&plaetze(ah).find(p=>p.id===r.angebotPlatzId);
  const keepNote=$('#note-in')?.value||'';
  box.innerHTML=`<div class="dlg-head"><div><span class="st st-${r.status}">${STATUS[r.status]}</span><h2>${esc(r.anrufer)}${r.fuer?` <span class="muted" style="font-weight:400">für ${esc(r.fuer)}</span>`:''}</h2><p class="small muted num">Aufgenommen ${fmtT(r.createdAt)}${r.aufgenommenVon?' von '+esc(r.aufgenommenVon):''}</p></div><button class="btn ghost" data-close>Schliessen</button></div>
  <div class="dlg-body"><div class="split"><div class="panel">
    <h3>Status</h3><div class="stbtns">${Object.entries(STATUS).map(([k,l])=>`<button class="btn" data-action="status" data-s="${k}" aria-pressed="${r.status===k}" ${canWrite?'':'disabled'}>${l}</button>`).join('')}</div>
    <h3>Angaben</h3><dl class="facts">
     <dt>Rückrufnummer</dt><dd class="num">${esc(r.telefon||'–')}</dd>
     <dt>Anruf im</dt><dd>${r.hausId?esc(hausName(r.hausId)):'–'}</dd>
     <dt>Platzart</dt><dd>${esc(r.art||'noch unklar')}</dd>
     <dt>Gewünscht ab</dt><dd>${fmt(r.ab)}</dd>
     <dt>Anliegen</dt><dd>${esc(r.notiz||'–')}</dd>
     <dt>Angeboten</dt><dd>${ah?esc(ah.name)+(ap?' · '+esc(ap.art):''):'–'}${r.platzVergeben?' <span class="pill free">Platz abgezogen</span>':''}</dd></dl>
    <h3>Verlauf</h3>
    ${canWrite?'<div class="addnote"><input id="note-in" maxlength="300" placeholder="Notiz, z. B. Rückruf vereinbart für Montag"><button class="btn" data-action="note">Hinzufügen</button></div>':''}
    <ul class="log">${(r.verlauf||[]).slice().reverse().map(e=>`<li><time>${fmtT(e.d)}</time><span>${esc(e.t)}${e.u?` <span class="who">· ${esc(e.u)}</span>`:''}</span></li>`).join('')||'<li><span class="muted">Noch keine Einträge.</span></li>'}</ul>
   </div><div class="panel"><h3>Verfügbarkeit jetzt</h3><p class="small muted">${r.art?'Aktueller Stand für «'+esc(r.art)+'».':'Alle freien Plätze.'} Mit «Platz zusagen» wird die Zahl im Haus um eins reduziert.</p>
    <div class="results">${r.platzVergeben?'<p class="small">Für diese Anfrage wurde bereits ein Platz vergeben.</p>':resultList(r.art,r.hausId,{assign:true})}</div></div></div></div>
  <div class="dlg-foot"><span>${isAdmin?(confirmDel?'<span class="confirm">Wirklich löschen? <button class="btn danger" data-action="del">Ja, löschen</button><button class="btn" data-action="nodel">Nein</button></span>':'<button class="btn ghost" style="color:var(--danger)" data-action="askdel">Anfrage löschen</button>'):''}</span><button class="btn" data-close>Schliessen</button></div>`;
  if(keepNote&&$('#note-in'))$('#note-in').value=keepNote;
}

function renderBenutzer(){
  const el=$('#view-benutzer');if(!el||!isAdmin)return;
  el.innerHTML=`<div class="stack"><div class="section-head"><h2>Benutzer</h2><button class="btn primary" data-action="new-user">+ Benutzer anlegen</button></div>
  <p class="small muted">Jede Person erhält einen eigenen Zugang. Wer nicht mehr dabei ist, wird gesperrt statt gelöscht, damit der Verlauf nachvollziehbar bleibt.</p>
  <div class="users">${users.map(u=>`<div class="urow"><div><strong>${esc(u.name)}</strong>${u.id===String(ME.id)?' <span class="pill here">Sie</span>':''}<br><span class="small muted">${esc(u.email)}</span></div>
   <div class="small">${ROLLEN[u.role]||esc(u.role)}${u.active?'':' · <strong style="color:var(--danger)">gesperrt</strong>'}<br><span class="muted">Zuletzt angemeldet: ${u.lastLogin?fmtT(u.lastLogin):'noch nie'}</span></div>
   <button class="btn" data-action="edit-user" data-id="${u.id}">Bearbeiten</button></div>`).join('')}</div></div>`;
}

/* ---------- Dialoge ---------- */
function openHaus(id){editHausId=id||null;const h=id?haus(id):null,f=$('#form-haus');f.reset();
  $('#haus-title').textContent=h?'Haus bearbeiten':'Haus anlegen';
  const used=haeuser.map(x=>x.farbe);const def=h?farbe(h.farbe):(FARBEN.find(x=>!used.includes(x[0]))||FARBEN[0])[0];
  $('#h-farben').innerHTML=FARBEN.map(([k,l])=>`<label><input type="radio" name="farbe" value="${k}" ${k===def?'checked':''}><span class="dot lg c-${k}"></span>${l}</label>`).join('');
  if(h){f.name.value=h.name||'';f.kontakt.value=h.kontakt||'';f.telefon.value=h.telefon||''}
  $('#haus-del').innerHTML=h?'<button type="button" class="btn ghost" style="color:var(--danger)" data-action="askdel-haus">Haus löschen</button>':'';
  $('#dlg-haus').showModal()}
function openPlatz(hid,pid){const h=haus(hid);if(!h)return;editPlatz={h:hid,p:pid||null};const p=pid?plaetze(h).find(x=>x.id===pid):null,f=$('#form-platz');f.reset();
  $('#platz-haus').textContent=h.name;$('#platz-title').textContent=p?'Platzart bearbeiten':'Platzart hinzufügen';
  f.art.value=p?p.art:'';f.frei.value=p?(p.frei|0):1;f.gesamt.value=p&&p.gesamt!=null?p.gesamt:'';f.ab.value=p?p.ab||'':'';f.hinweis.value=p?p.hinweis||'':'';
  $('#platz-del').innerHTML=p?'<button type="button" class="btn ghost" style="color:var(--danger)" data-action="askdel-platz">Platzart entfernen</button>':'';
  $('#dlg-platz').showModal()}
function openUser(id){editUserId=id||null;const u=id?users.find(x=>x.id===id):null,f=$('#form-user');f.reset();
  $('#user-title').textContent=u?'Benutzer bearbeiten':'Benutzer anlegen';
  $('#u-pass-lbl').textContent=u?'Neues Passwort setzen (leer lassen = unverändert)':'Startpasswort (mindestens 10 Zeichen)';
  f.password.required=!u;
  if(u){f.name.value=u.name;f.email.value=u.email;f.role.value=u.role;f.active.value=u.active?'1':'0'}
  else f.password.value=genPw();
  $('#dlg-user').showModal()}
function genPw(){const c='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';const a=new Uint32Array(12);crypto.getRandomValues(a);return [...a].map(x=>c[x%c.length]).join('')}

$('#form-haus').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  const d=await call('haus_save',{id:editHausId,name:f.name.value,farbe:(f.querySelector('input[name=farbe]:checked')||{}).value,kontakt:f.kontakt.value,telefon:f.telefon.value});
  if(d){if(!iam&&d.newId){iam=d.newId;lsSet('pb-iam',iam);renderAll()}$('#dlg-haus').close();toast('Haus gespeichert')}});
$('#form-platz').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  let art=f.art.value.trim();const known=alleArten().find(a=>norm(a)===norm(art));if(known)art=known;
  const d=await call('platz_save',{id:editPlatz.p,hausId:editPlatz.h,art,frei:f.frei.value,gesamt:f.gesamt.value,ab:f.ab.value,hinweis:f.hinweis.value});
  if(d){$('#dlg-platz').close();toast('Gespeichert')}});
$('#form-user').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  const d=await call('user_save',{id:editUserId,name:f.name.value,email:f.email.value,role:f.role.value,active:f.active.value==='1',password:f.password.value});
  if(d){$('#dlg-user').close();toast(editUserId?'Benutzer gespeichert':'Benutzer angelegt. Passwort persönlich weitergeben.')}});
$('#form-pw').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  const d=await call('password',{old:f.old.value,neu:f.neu.value});if(d){$('#dlg-pw').close();toast('Passwort geändert')}});
$('#form-call').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;
  const d=await call('anfrage_create',{hausId:f.hausId.value,aufgenommenVon:f.aufgenommenVon.value,anrufer:f.anrufer.value,telefon:f.telefon.value,fuer:f.fuer.value,ab:f.ab.value,art:f.art.value,notiz:f.notiz.value,angebotPlatzId:pick?pick.p:null});
  if(d){resetCall();toast('Anfrage gespeichert')}});
function resetCall(){const f=$('#form-call');const von=f.aufgenommenVon.value;f.reset();f.aufgenommenVon.value=von;pick=null;renderCallSelects();$('#c-haus').value=iam;renderResults()}
$('#c-art').addEventListener('change',()=>{pick=null;renderResults()});
$('#c-haus').addEventListener('change',renderResults);
$('#c-von').addEventListener('change',e=>lsSet('pb-von',e.target.value));

/* ---------- Klicks ---------- */
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-close]')){e.target.closest('dialog')?.close();return}
  const tab=e.target.closest('[data-view],[data-view-go]');if(tab){view=tab.dataset.view||tab.dataset.viewGo;showView();return}
  const af=e.target.closest('[data-af]');if(af){aFilter=af.dataset.af;renderAnfragen();return}
  const a=e.target.closest('[data-action]');if(!a||a.disabled)return;const act=a.dataset.action,hid=a.dataset.h,pid=a.dataset.p;
  const r=openId?anfragen.find(x=>x.id===openId):null;
  switch(act){
   case 'new-haus':openHaus();break;
   case 'edit-haus':openHaus(hid);break;
   case 'confirm-haus':if(await call('haus_confirm',{id:hid}))toast('Stand bestätigt');break;
   case 'askdel-haus':a.outerHTML='<span class="confirm">Haus mit allen Platzarten löschen? <button type="button" class="btn danger" data-action="del-haus">Ja</button></span>';break;
   case 'del-haus':if(await call('haus_delete',{id:editHausId})){if(iam===editHausId){iam='';lsSet('pb-iam','')}$('#dlg-haus').close();toast('Haus gelöscht')}break;
   case 'new-platz':openPlatz(hid);break;
   case 'edit-platz':openPlatz(hid,pid);break;
   case 'askdel-platz':a.outerHTML='<span class="confirm">Wirklich entfernen? <button type="button" class="btn danger" data-action="del-platz">Ja</button></span>';break;
   case 'del-platz':if(await call('platz_delete',{id:editPlatz.p})){$('#dlg-platz').close();toast('Platzart entfernt')}break;
   case 'inc':case 'dec':await call('platz_delta',{id:pid,delta:act==='inc'?1:-1});break;
   case 'pick':pick=(pick&&pick.h===hid&&pick.p===pid)?null:{h:hid,p:pid};renderResults();break;
   case 'reset-call':resetCall();break;
   case 'open':openId=a.dataset.id;confirmDel=false;renderAnfrage();$('#dlg-anfrage').showModal();break;
   case 'status':if(r&&r.status!==a.dataset.s)await call('anfrage_status',{id:r.id,status:a.dataset.s});break;
   case 'assign':if(r&&await call('anfrage_assign',{id:r.id,platzId:pid}))toast('Platz zugesagt');break;
   case 'note':{const i=$('#note-in'),t=i.value.trim();if(!t||!r)break;i.value='';await call('anfrage_note',{id:r.id,text:t});break}
   case 'askdel':confirmDel=true;renderAnfrage();break;
   case 'nodel':confirmDel=false;renderAnfrage();break;
   case 'del':if(await call('anfrage_delete',{id:r.id})){$('#dlg-anfrage').close();toast('Anfrage gelöscht')}break;
   case 'new-user':openUser();break;
   case 'edit-user':openUser(a.dataset.id);break;
   case 'pw':$('#form-pw').reset();$('#dlg-pw').showModal();break;
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='note-in'){e.preventDefault();document.querySelector('[data-action="note"]')?.click()}});
document.addEventListener('input',e=>{if(e.target.id==='a-suche'){aSuche=e.target.value;clearTimeout(window._s);window._s=setTimeout(()=>{renderAnfragen();const i=$('#a-suche');i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}});
document.addEventListener('change',e=>{
  if(e.target.id==='a-haus'){aHaus=e.target.value;renderAnfragen()}
  if(e.target.id==='iam'){iam=e.target.value;lsSet('pb-iam',iam);$('#c-haus').value=iam;renderIam();renderResults()}
});
$('#dlg-anfrage').addEventListener('close',()=>{openId=null});
function showView(){const vs=['anruf','plaetze','anfragen'].concat(isAdmin?['benutzer']:[]);if(!vs.includes(view))view='anruf';
  for(const v of vs){$('#view-'+v).hidden=v!==view;$('#tab-'+v).setAttribute('aria-selected',v===view)}lsSet('pb-view',view)}

/* ---------- Start ---------- */
iam=lsGet('pb-iam')||'';view=lsGet('pb-view')||'anruf';
$('#c-von').value=lsGet('pb-von')||ME.name;
showView();renderAll();load();
// Alle 20 Sekunden neuen Stand holen, solange die Seite sichtbar ist und kein Dialog offen ist
setInterval(()=>{if(document.visibilityState==='visible'&&!document.querySelector('dialog[open]')&&!busy)load();
  $('#call-now').textContent=new Date().toLocaleString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})},20000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
})();
