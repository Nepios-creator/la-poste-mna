/* La Poste MNA : appels.js
   Appels audio (Jitsi, gratuit) lancés par un responsable de zone (sa zone) ou par l'administration (n'importe qui),
   avec sonnerie dans l'application et compte rendu automatique (participants, heures, notes).
   À charger APRÈS jitsi.js. Ne remplace aucune fonction existante : il les complète. */
(()=>{
const NZ=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const TYP={direct:'Appel individuel',zone:'Appel de toute la zone',group:'Appel de groupe',room:'Appel audio de la réunion'};
const st=document.createElement('style');st.textContent=`
#callring{position:fixed;inset:0;z-index:320;background:linear-gradient(160deg,#0b1b3f,#1c3a78);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center}
#callring .ico{font-size:72px;animation:cring 1s ease-in-out infinite}
#callring h2{margin:0;font-size:26px}#callring p{margin:0 0 18px;font-size:18px;color:#d7def0}
#callring .row{display:flex;gap:14px}#callring button{font-size:18px;padding:14px 22px;border-radius:999px;min-height:56px}
@keyframes cring{50%{transform:scale(1.18) rotate(-8deg)}}
.crow{display:block;padding:8px 4px;border-bottom:1px solid #eef0f6}.crow.h{display:none}
#cl{max-height:46vh;overflow:auto;margin:6px 0}`;
document.head.appendChild(st);
const canCall=()=>me.role_type=='zone_lead'||(me.role_type=='admin'&&can('messages'));
const jurl=room=>'https://meet.jit.si/LaPosteMNA-'+room+'#'+['config.startWithVideoMuted=true','config.startAudioOnly=true','config.disableDeepLinking=true','userInfo.displayName='+encodeURIComponent(JSON.stringify(me.full_name||''))].join('&');
let CS={calls:[],parts:[],dir:[]},SEL=new Set(),DET=null,TM=null,RING=null,DISM=new Set();
const here=()=>typeof pv!='undefined'&&pv=='call'&&!!$('#pb');
async function load(){const c=(await sb.from('pm_calls').select('*').neq('kind','room').order('started_at',{ascending:false}).limit(40)).data||[],ids=c.map(x=>x.id);
 CS.parts=ids.length?(await sb.from('pm_call_parts').select('*').in('call_id',ids)).data||[]:[];CS.calls=c}
const parts=id=>CS.parts.filter(p=>p.call_id==id);
const stale=c=>!c.ended_at&&Date.now()-new Date(c.started_at)>6*3600e3,isOpen=c=>!c.ended_at&&!stale(c);
const stat=(p,c)=>!p.invited?'🎙 Organisateur'+(p.joined_at?' · connecté à '+fh(p.joined_at):''):p.joined_at?'✅ A rejoint à '+fh(p.joined_at):p.declined_at?'⛔ A refusé':isOpen(c)&&Date.now()-new Date(c.started_at)<180e3?'🔔 Sonnerie…':isOpen(c)?'⏳ Pas encore rejoint':'❌ Sans réponse';

/* ---- Ouvrir / rejoindre ---- */
async function joinCall(id){const w=window.open('about:blank','_blank');
 const{data,error}=await sb.rpc('pm_call_join',{p_id:id});
 if(error||!data){if(w)w.close();alert('Impossible : '+(error?.message||'appel indisponible'));return false}
 if(w)w.location.href=jurl(data);else if(!window.open(jurl(data),'_blank'))alert("Le navigateur a bloqué l'ouverture : touchez « Ouvrir l'appel » dans la page Appels.");
 return true}
H.calljoin=async v=>{await joinCall(v);if(here()){await load();refreshNow(true)}};

/* ---- Sonnerie dans l'application ---- */
const closeRing=()=>{const d=$('#callring');if(d)d.remove();RING=null};
function showRing(c){const d=document.createElement('div');d.id='callring';
 d.innerHTML=`<div class=ico>📞</div><h2>${esc(c.caller_name)}</h2><p>vous appelle${c.title?' : '+esc(c.title):''}</p><div class=row><button class=r data-a=callno data-v=${c.id}>✖ Refuser</button><button class=g data-a=callyes data-v=${c.id}>✅ Répondre</button></div>`;
 document.body.appendChild(d);RING=c;try{navigator.vibrate&&navigator.vibrate([500,300,500,300,500])}catch{}
 setTimeout(()=>{if(RING&&RING.id==c.id){DISM.add(c.id);closeRing()}},90000)}
H.callyes=async v=>{DISM.add(v);closeRing();await joinCall(v)};
H.callno=async v=>{DISM.add(v);closeRing();await sb.rpc('pm_call_decline',{p_id:v});if(here()){await load();refreshNow(true)}};
async function ringPoll(){if(typeof me=='undefined'||!me||me.status!='active'||document.hidden||!navigator.onLine)return;
 let d;try{d=(await sb.rpc('pm_my_calls')).data||[]}catch{return}
 if(RING){if(!d.some(c=>c.id==RING.id&&c.ringing))closeRing();return}
 if(typeof ALERT_OPEN!='undefined'&&ALERT_OPEN)return;
 const r=d.find(c=>c.ringing&&!DISM.has(c.id));if(r)showRing(r)}
setInterval(ringPoll,6000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)ringPoll()});

/* ---- Écran « Appels audio » ---- */
function cands(){const L=CS.dir.filter(p=>p.id!=me.id);
 if(me.role_type=='zone_lead')return L.filter(p=>p.zone_id==me.zone_id&&p.role_type!='admin');
 return L.filter(p=>me.is_super||!me.scope_zones||p.role_type=='admin'||me.scope_zones.includes(p.zone_id))}
function cnt(){const b=$('#cgo');if(b){b.textContent='📞 Appeler ('+SEL.size+')';b.disabled=!SEL.size}}
function filt(){const q=NZ(($('#cq')||{}).value),z=($('#czs')||{}).value||'';document.querySelectorAll('#cl .crow').forEach(r=>r.classList.toggle('h',!!((q&&!r.dataset.n.includes(q))||(z&&r.dataset.z!=z))))}
function newCard(){const el=$('#cnew');
 if(!canCall()){el.innerHTML=me.role_type=='admin'?'<div class=ins>Pour lancer des appels, le droit « Envoyer des messages » est nécessaire : demandez-le à l\'administrateur principal.</div>':'';return}
 const L=cands().sort((a,b)=>a.full_name.localeCompare(b.full_name)),adm=me.role_type=='admin';
 el.innerHTML=`<div class=card><h4 style="margin-top:0">📞 Nouvel appel</h4><input id=ctt placeholder="Objet (ex. Réunion d'évaluation)" maxlength=80><input id=cq placeholder="🔎 Chercher une personne…">${adm?`<select id=czs><option value="">Toutes les zones</option>${zones.map(z=>`<option value=${z.id}>${esc(z.name)}</option>`).join('')}</select>`:''}
 <button type=button class=s data-a=callall>${adm?'☑ Cocher les personnes affichées':'☑ Toute ma zone'}</button> <button type=button class=s data-a=callnone>☐ Effacer</button>
 <div id=cl>${L.map(p=>`<label class=crow data-n="${esc(NZ(p.full_name))}" data-z="${p.zone_id||''}"><input class=ck type=checkbox data-cs=${p.id}>${esc(p.full_name)} <span class=m>· ${ROLES[p.role_type]}${zn(p.zone_id)?' · '+esc(zn(p.zone_id)):''}</span></label>`).join('')||'<p class=m>Personne à appeler pour le moment.</p>'}</div>
 <button class=g id=cgo data-a=callgo disabled>📞 Appeler (0)</button><p class=m>Chaque personne appelée reçoit aussi un message de notification.</p></div>`;cnt()}
document.addEventListener('input',e=>{if(e.target.id=='cq')filt()});
document.addEventListener('change',e=>{const t=e.target;if(t.id=='czs')filt();else if(t.dataset&&t.dataset.cs){t.checked?SEL.add(t.dataset.cs):SEL.delete(t.dataset.cs);cnt()}});
H.callall=()=>{document.querySelectorAll('#cl .crow:not(.h) input').forEach(i=>{i.checked=true;SEL.add(i.dataset.cs)});cnt()};
H.callnone=()=>{document.querySelectorAll('#cl input').forEach(i=>i.checked=false);SEL.clear();cnt()};
H.callgo=async(v,b)=>{if(!SEL.size)return;const n=SEL.size,ttl=($('#ctt')||{}).value?.trim()||'';
 if(n>1&&!await yes("Lancer l'appel ?",n+' personnes seront appelées.'))return;
 b.disabled=true;const w=window.open('about:blank','_blank');
 const{data,error}=await sb.rpc('pm_call_start',{p_targets:[...SEL],p_title:ttl||null});
 if(error||!data){if(w)w.close();cnt();return alert('Impossible : '+(error?.message||"l'appel n'a pas pu démarrer"))}
 const j=await sb.rpc('pm_call_join',{p_id:data});
 if(j.error||!j.data){if(w)w.close();alert('Appel lancé, mais impossible de vous connecter : '+(j.error?.message||''))}
 else if(w)w.location.href=jurl(j.data);else if(!window.open(jurl(j.data),'_blank'))alert("Le navigateur a bloqué l'ouverture : touchez « Ouvrir l'appel ».");
 SEL.clear();await callsView()};
const own=c=>{const ps=parts(c.id).filter(p=>p.invited);return`<div class=card data-id=${c.id}><b>📞 ${esc(c.title||TYP[c.kind])}</b> <span class=tag>${TYP[c.kind]}</span><br><span class=m>Lancé à ${fh(c.started_at)} · ${ps.length} invité(s)</span>${ps.map(p=>`<div class=m>${esc(p.user_name)} : ${stat(p,c)}</div>`).join('')}<textarea class=cnotes data-id=${c.id} rows=3 placeholder="Notes, décisions, points importants (ajoutés au compte rendu)">${esc(c.notes)}</textarea><button data-a=calljoin data-v=${c.id}>📞 Ouvrir l'appel</button> <button class=s data-a=callnotes data-v=${c.id}>💾 Notes</button> <button class=r data-a=callend data-v=${c.id}>⏹ Terminer l'appel</button></div>`};
const inc=c=>{const me2=parts(c.id).find(p=>p.user_id==me.id);return`<div class=card><b>📞 ${esc(c.caller_name)}</b> ${esc(c.title||'')}<br><span class=m>Appel lancé à ${fh(c.started_at)}</span><br>${me2&&me2.joined_at?`<button data-a=calljoin data-v=${c.id}>📞 Rejoindre à nouveau</button>`:`<button class=g data-a=calljoin data-v=${c.id}>📞 Répondre</button> <button class=s data-a=callno data-v=${c.id}>Refuser</button>`}</div>`};
const nowHtml=()=>{const m=CS.calls.filter(c=>isOpen(c)&&(c.caller_id==me.id||parts(c.id).some(p=>p.user_id==me.id&&p.invited)));return m.length?'<h4>🟢 Appels en cours</h4>'+m.map(c=>c.caller_id==me.id?own(c):inc(c)).join(''):''};
const histHtml=()=>list(CS.calls.filter(c=>!isOpen(c)).map(c=>{const inv=parts(c.id).filter(p=>p.invited);return`<div class=card data-a=callopen data-v=${c.id}><b>📞 ${esc(c.title||TYP[c.kind])}</b><br><span class=m>${esc(c.caller_name)} · ${fd(c.started_at)} · ${inv.filter(p=>p.joined_at).length}/${inv.length} ont rejoint</span></div>`}),'<p class=m>Aucun appel terminé pour le moment.</p>');
function refreshNow(force){const n=$('#cnow');if(!n||DET)return;const f=document.activeElement;if(force||!(f&&f.closest&&f.closest('#cnow')))n.innerHTML=nowHtml();const h=$('#chist');if(h)h.innerHTML=histHtml()}
async function tick(){if(!here()){clearInterval(TM);return}if(DET||!$('#cnow'))return;await load();refreshNow()}
async function callsView(){const b=$('#pb');DET=null;b.innerHTML='<p class=m>Chargement…</p>';await load();
 if(canCall()&&!CS.dir.length)CS.dir=(await sb.from('pm_dir').select('id,full_name,role_type,zone_id').eq('status','active')).data||[];
 b.innerHTML=`<h3>📞 Appels audio</h3><p class=m>Les appels passent par Jitsi (gratuit). Le contenu parlé n'est pas enregistré : un compte rendu est établi automatiquement (participants, heures, notes de l'organisateur).</p><div id=cnew></div><div id=cnow></div><h4>🗂 Comptes rendus d'appels</h4><div id=chist></div>`;
 newCard();refreshNow(true);clearInterval(TM);TM=setInterval(tick,5000)}
const saveNotes=async t=>{const{error}=await sb.rpc('pm_call_notes',{p_id:t.dataset.id,p_notes:t.value});if(error)alert('Notes non enregistrées : '+error.message);else{const c=CS.calls.find(x=>x.id==t.dataset.id);if(c)c.notes=t.value.trim()||null}};
document.addEventListener('focusout',e=>{if(e.target.classList&&e.target.classList.contains('cnotes'))saveNotes(e.target)});
const noteEl=v=>document.querySelector('.cnotes[data-id="'+v+'"]');
H.callnotes=async v=>{const t=noteEl(v);if(!t)return;await saveNotes(t);alert('Notes enregistrées ✓')};
H.callend=async(v,b)=>{if(!await yes("Terminer l'appel ?","Le compte rendu sera établi. Les personnes encore connectées dans Jitsi peuvent continuer à parler, mais l'appel sera marqué comme terminé."))return;
 const t=noteEl(v);if(t)await saveNotes(t);
 const{error}=await sb.rpc('pm_call_end',{p_id:v});if(error)return alert('Impossible : '+error.message);await load();H.callopen(v)};
H.callback=()=>callsView();

/* ---- Compte rendu ---- */
const crRows=c=>{const ps=parts(c.id).sort((a,b)=>(a.invited?1:0)-(b.invited?1:0)||a.user_name.localeCompare(b.user_name));return ps.map(p=>[p.user_name,stat(p,c)])};
function crText(c){const inv=parts(c.id).filter(p=>p.invited),ok=inv.filter(p=>p.joined_at),end=c.ended_at?new Date(c.ended_at):null;
 return`COMPTE RENDU D'APPEL AUDIO : La Poste MNA\n${c.title||TYP[c.kind]}\n\nType : ${TYP[c.kind]}\nOrganisateur : ${c.caller_name}\nDébut : ${fd(c.started_at)}\nFin : ${end?fd(end):'non indiquée'}${end?'\nDurée : '+Math.max(1,Math.round((end-new Date(c.started_at))/60000))+' min':''}\nInvités : ${inv.length} · ont rejoint : ${ok.length}\n\nParticipants :\n${crRows(c).map(r=>'• '+r[0]+' : '+r[1]).join('\n')}\n\nNotes de l'organisateur :\n${c.notes||'(aucune)'}\n\nÉtabli automatiquement. Le contenu parlé n'est pas enregistré.`}
function detail(){const c=CS.calls.find(x=>x.id==DET);if(!c){DET=null;return callsView()}
 const inv=parts(c.id).filter(p=>p.invited),end=c.ended_at?new Date(c.ended_at):null,mine=c.caller_id==me.id;
 $('#pb').innerHTML=`<button class=s data-a=callback>← Appels</button><div class=card><div style="text-align:center"><div class=m style="letter-spacing:2px">LA POSTE MNA</div><h3 style="margin:6px 0">COMPTE RENDU D'APPEL AUDIO</h3><b>${esc(c.title||TYP[c.kind])}</b></div>
 <table class=tb><tr><th>Type</th><td>${TYP[c.kind]}</td></tr><tr><th>Organisateur</th><td>${esc(c.caller_name)}</td></tr><tr><th>Date</th><td>${new Date(c.started_at).toLocaleDateString('fr',{dateStyle:'full'})}</td></tr><tr><th>Début</th><td>${fh(c.started_at)}</td></tr><tr><th>Fin</th><td>${end?fh(end):isOpen(c)?'en cours':'non indiquée'}</td></tr>${end?`<tr><th>Durée</th><td>${Math.max(1,Math.round((end-new Date(c.started_at))/60000))} min</td></tr>`:''}<tr><th>Invités</th><td>${inv.length} · ${inv.filter(p=>p.joined_at).length} ont rejoint</td></tr></table></div>
 <div class=card><h4 style="margin-top:0">Participants</h4><table class=tb>${crRows(c).map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]}</td></tr>`).join('')}</table></div>
 <div class=card><h4 style="margin-top:0">Notes de l'organisateur</h4>${mine?`<textarea class=cnotes data-id=${c.id} rows=4 placeholder="Décisions, points importants, actions à mener…">${esc(c.notes)}</textarea><button class=s data-a=callnotes data-v=${c.id}>💾 Enregistrer les notes</button>`:c.notes?`<p style="white-space:pre-wrap">${esc(c.notes)}</p>`:"<p class=m>Aucune note saisie par l'organisateur.</p>"}</div>
 <button data-a=callcopy data-v=${c.id}>📋 Copier le compte rendu</button><p class=m style="text-align:center">Établi automatiquement. Le contenu parlé n'est pas enregistré.</p>`}
H.callopen=async v=>{if(!CS.calls.some(c=>c.id==v))await load();DET=v;detail()};
H.callcopy=async(v)=>{const c=CS.calls.find(x=>x.id==v);if(!c)return;try{await navigator.clipboard.writeText(crText(c));alert('Compte rendu copié ✓')}catch{alert('Copie impossible : sélectionnez le texte à la main.')}};

/* ---- Menu « Plus » ---- */
const pv0=plusView;plusView=function(){
 if(pv=='call'){app.innerHTML='<button class=s data-a=pl data-v="">← Menu</button><div id=pb></div>';return callsView()}
 const r=pv0.apply(this,arguments);
 if(!pv){const p=app.querySelector('.card[data-a=pl]');if(p&&!app.querySelector('[data-v=call]'))p.insertAdjacentHTML('afterend','<div class=card data-a=pl data-v=call><b>📞 Appels audio</b></div>')}
 return r};

/* ---- Appel de la salle de réunion : journal + procès-verbal ---- */
const j0=H.jcall;if(j0)H.jcall=function(){try{if(typeof CM!='undefined'&&CM&&CM.m)sb.rpc('pm_call_room_join',{p_meeting:CM.m.id}).then(()=>{},()=>{})}catch(e){}return j0.apply(this,arguments)};
async function roomBlock(id){if(typeof PVID=='undefined'||PVID!=id||$('#pvcall'))return;
 const m=(await sb.from('pm_minutes').select('meeting_id').eq('id',id).maybeSingle()).data;if(!m||!m.meeting_id)return;
 const c=(await sb.from('pm_calls').select('*').eq('meeting_id',m.meeting_id).eq('kind','room').maybeSingle()).data,
  ps=c?(await sb.from('pm_call_parts').select('*').eq('call_id',c.id).order('joined_at')).data||[]:[];
 if(typeof PVID=='undefined'||PVID!=id||$('#pvcall'))return;
 hs().insertAdjacentHTML('beforeend',`<div class=card id=pvcall><h4 style="margin-top:0">📞 Appel audio de la réunion</h4>${ps.length?`<p class=m>${ps.length} personne(s) ont rejoint l'appel audio (premier accès : ${fh(c.started_at)}).</p><table class=tb><tr><th>Nom</th><th>Rejoint à</th></tr>${ps.map(p=>`<tr><td>${esc(p.user_name)}</td><td>${p.joined_at?fh(p.joined_at):'—'}</td></tr>`).join('')}</table>`:"<p class=m>Aucun appel audio n'a été utilisé pendant cette réunion.</p>"}<p class=m>Le contenu parlé n'est pas enregistré ni transcrit.</p></div>`)}
const pd0=pvDetail;pvDetail=async function(){await pd0.apply(this,arguments);try{await roomBlock(typeof PVID!='undefined'?PVID:arguments[0])}catch(e){console.warn(e)}};
})();
