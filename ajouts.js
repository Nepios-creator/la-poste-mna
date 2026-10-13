/* La Poste MNA : ajouts.js
   Chargé APRÈS le script principal d'index.html. Il ne supprime rien : il complète et remplace uniquement
   les fonctions d'affichage concernées (pastilles, messages, salle de réunion, alerte, bouton retour). */
(()=>{
const css=document.createElement('style');css.textContent=`
.msg{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.msg .mb{display:block;margin:3px 0 2px}
.tk{font-size:12px;color:#777;margin-left:6px;white-space:nowrap}.tk.rd{color:#1d6fe0;font-weight:700}
.rx{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}.rx span{background:#fff;border:1px solid var(--l);border-radius:12px;padding:1px 8px;font-size:13px}.rx span.mine{border-color:var(--g);background:#fff8e1}
.pinb{background:#fff8e1;border-left:4px solid var(--g);border-radius:6px;padding:6px 10px;margin:6px 0;font-size:13px;white-space:normal}
.sheet{position:fixed;inset:0;z-index:150;background:#0008;display:flex;align-items:flex-end}
.sheet>div{background:#fff;width:100%;border-radius:16px 16px 0 0;padding:12px 12px calc(12px + env(safe-area-inset-bottom))}
.sheet button{display:block;width:100%;text-align:left;background:#fff;color:#222;border:0;border-bottom:1px solid var(--l);border-radius:0;margin:0;padding:14px 8px}
.sheet .rr{display:flex;gap:10px;justify-content:center;margin-bottom:6px}
.sheet .rr button{width:auto;font-size:30px;border:0;padding:6px 16px;text-align:center;background:#f3efe2;border-radius:30px}
#rqs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#rqs button{padding:7px 10px;font-size:14px;margin:0}
@keyframes pmr{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}.pmcall .big{animation:pmr 1s infinite}`;
document.head.appendChild(css);
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

/* ===== 1. Pastilles de notification dans chaque espace ===== */
const EX={rep:0,plus:0,it:{}};let exBusy=0,RDET=false;
const sk=n=>'pm_xs_'+n+'_'+me.id;
const unseen=(n,ids)=>{const s=LS(sk(n),null);if(s===null){LSset(sk(n),ids);return 0}const S=new Set(s);return ids.filter(i=>!S.has(i)).length};
const markSeen=(n,ids)=>LSset(sk(n),[...new Set([...(LS(sk(n),[])||[]),...ids])].slice(-600));
const recalc=()=>{EX.plus=Object.values(EX.it).reduce((a,b)=>a+(b||0),0);nav();decorPlus()};
nav=function(){const b={...bad(),msg:UNRT,rep:EX.rep,plus:EX.plus},t=[['inf','Infos'],['fil','Fichiers'],['rep','Rapports'],['msg','Messages'],['plus','Plus']];
 $('#nav').innerHTML=t.map(([k,l])=>`<button class="${tab==k?'on':''}" data-a=tab data-v=${k}>${l}${b[k]?`<span class=bd>${b[k]>99?'99+':b[k]}</span>`:''}</button>`).join('')};
async function refreshEx(){if(!me||me.status!='active'||!navigator.onLine||exBusy)return;exBusy=1;
 try{const adm=me.role_type=='admin',lead=me.role_type=='zone_lead',it={};let rep=0;
  if(lead||(adm&&can('reports'))){const r=await sb.from('pm_reports').select('id,type,author_id').eq('status','submitted').order('period_start',{ascending:false}).limit(300);
   if(!r.error)rep=unseen('rep',(r.data||[]).filter(x=>x.author_id!=me.id&&(adm?x.type=='zone':true)).map(x=>x.id))}
  try{await loadMeets();it.room=unseen('room',MEETS.filter(m=>['future','open'].includes(mState(m))).map(m=>m.id))}catch{}
  const pm=await sb.from('pm_minutes').select('id');if(!pm.error)it.pv=unseen('pv',(pm.data||[]).map(x=>x.id));
  if(has('berger_poste')){const r=await sb.from('pm_referrals').select('id').eq('berger_id',me.id).eq('status','sent');it.ref=r.data?.length||0}
  if(adm&&can('members')){const a=await sb.from('pm_profiles').select('id',{count:'exact',head:true}).eq('status','pending'),b=await sb.from('pm_identity_requests').select('id',{count:'exact',head:true}).eq('status','pending');it.adm=(a.count||0)+(b.count||0)}
  EX.rep=rep;EX.it=it;recalc();decorRep()}
 catch(e){console.warn(e)}finally{exBusy=0}}
function decorPlus(){if(tab!='plus'||pv)return;for(const[k,n]of Object.entries(EX.it)){if(!n)continue;const b=document.querySelector('#app [data-a=pl][data-v='+k+'] b');if(b&&!b.querySelector('.bd'))b.insertAdjacentHTML('beforeend',`<span class=bd>${n}</span>`)}}
function decorRep(){const b=document.querySelector('#app button[data-a=sub][data-v=rec]');if(b&&EX.rep&&!b.querySelector('.bd'))b.insertAdjacentHTML('beforeend',`<span class=bd>${EX.rep}</span>`)}
const pl0=plusView;plusView=function(){const r=pl0.apply(this,arguments);decorPlus();return r};
const rp0=repView;repView=function(){RDET=false;const r=rp0.apply(this,arguments);decorRep();return r};
const rl0=recList;recList=async function(){const r=await rl0.apply(this,arguments);try{const q=await sb.from('pm_reports').select('id').eq('status','submitted').limit(300);if(q.data){markSeen('rep',q.data.map(x=>x.id));EX.rep=0;recalc()}}catch{}return r};
const rv0=roomView;roomView=async function(){const r=await rv0.apply(this,arguments);if(!RMID){try{markSeen('room',MEETS.filter(m=>['future','open'].includes(mState(m))).map(m=>m.id));EX.it.room=0;recalc()}catch{}}return r};
const pvv0=pvView;pvView=async function(){const r=await pvv0.apply(this,arguments);try{const q=await sb.from('pm_minutes').select('id');if(q.data){markSeen('pv',q.data.map(x=>x.id));EX.it.pv=0;recalc()}}catch{}return r};
const dv0=detailView;detailView=async function(){RDET=true;return dv0.apply(this,arguments)};
const sa0=startApp;startApp=async function(){const r=await sa0.apply(this,arguments);refreshEx();return r};
setInterval(()=>{if(!document.hidden)refreshEx()},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshEx()});

/* ===== 2. Messagerie : responsables de zone entre eux ===== */
const mv0=msgView;msgView=async function(){await mv0.apply(this,arguments);
 if(me.role_type=='zone_lead'){Object.values(P).filter(p=>p.role_type=='zone_lead'&&p.id!=me.id).forEach(p=>{const n=p.full_name+' · '+ROLES.zone_lead+(p.zone_id?' ('+zn(p.zone_id)+')':''),t=T.find(x=>x.k==p.id);if(t){delete t.ro;t.n=n}else T.push({k:p.id,n})})}};

/* ===== 3. Messages : appui long, réactions, épingles, accusés « vu / lu », paragraphes ===== */
let RX={},PEER={},MENU_AT=0,SEENDONE=new Set();
const reloadM=async()=>{const r=await sb.from('pm_messages').select('*').order('created_at');if(r.data)M=r.data};
async function loadRX(){const r=await sb.from('pm_msg_reactions').select('message_id,user_id,kind');if(r.error||!r.data)return;const o={};r.data.forEach(x=>(o[x.message_id]??=[]).push(x));RX=o}
async function loadPeer(k){if(!k||k=='ann'||String(k).startsWith('bc:'))return;const a=await sb.rpc('pm_peer_read',{p_peer:k}),b=await sb.rpc('pm_peer_seen',{p_peer:k}),rd=a.data?new Date(a.data).getTime():0,sn=b.error||!b.data?0:new Date(b.data).getTime();PEER[k]={read:rd,seen:Math.max(rd,sn)}}
const tick=m=>{if(m.sender_id!=me.id||!m.recipient_id||m.recipient_id!=cur)return'';const p=PEER[cur]||{},t=new Date(m.created_at).getTime();
 return p.read>=t?'<span class="tk rd">✓✓ Lu</span>':p.seen>=t?'<span class=tk>✓✓ Vu</span>':'<span class=tk>✓ Envoyé</span>'};
drawMsgs=function(){const el=$('#ml');if(!el)return;
 const pins=thread(cur).filter(m=>m.pinned_at&&!m.deleted_at);
 const one=m=>{const mine=m.sender_id==me.id,q=m.reply_to?M.find(x=>x.id==m.reply_to):null;
  const head=`<span class=m>${esc(P[m.sender_id]?.full_name||'')} · ${fd(m.created_at)}${m.pinned_at?' · 📌':''}${m.recipient_id&&m.recipient_id!=me.id&&m.sender_id!=me.id?' · 👫 copie adressée à '+esc(P[m.recipient_id]?.full_name||'votre compagnon'):''}${tick(m)}</span>`;
  if(m.deleted_at)return`<div class="msg ${mine?'me':'ot'}" id=m_${m.id}>${head}<i class="m mb">🚫 Message supprimé</i></div>`;
  const quote=m.reply_to?`<div data-a=qj data-v=${m.reply_to} style="border-left:3px solid var(--g);background:#0000000d;border-radius:6px;padding:4px 8px;margin:4px 0;cursor:pointer;white-space:normal"><span class=m><b>↩ ${esc(q?(q.sender_id==me.id?'Vous':(P[q.sender_id]?.full_name||'—')):'Message')}</b><br>${esc(qtxt(q))}</span></div>`:'';
  const rs=RX[m.id]||[],cn={like:0,love:0};rs.forEach(r=>cn[r.kind]++);const my=rs.find(r=>r.user_id==me.id)?.kind;
  const rx=rs.length?`<div class=rx>${['like','love'].filter(k=>cn[k]).map(k=>`<span class="${my==k?'mine':''}">${k=='like'?'👍':'❤️'} ${cn[k]}</span>`).join('')}</div>`:'';
  const body=String(m.body||'').replace(/\n{3,}/g,'\n\n');
  return`<div class="msg ${mine?'me':'ot'}" id=m_${m.id} data-mid=${m.id}>${head}${quote}${body?`<span class=mb>${esc(body)}</span>`:''}${m.file_path?(m.file_kind=='image'?`<img data-p="${esc(m.file_path)}" style="max-width:100%;border-radius:8px;display:block;margin-top:4px">`:`<a href=# data-a=dl data-v="${esc(m.file_path)}">📎 ${esc(m.file_name)}</a>`):''}${rx}</div>`};
 el.innerHTML=(pins.length?`<div class=pinb>📌 <b>Épinglé${pins.length>1?'s':''}</b>${pins.slice(-3).map(m=>`<div data-a=qj data-v=${m.id} style="cursor:pointer">• ${esc(qtxt(m))}</div>`).join('')}</div>`:'')
  +list(thread(cur).map(one),'<p class=m>Aucun message.</p>')
  +mqGet().filter(x=>x.k==cur).map(x=>`<div class="msg me"><span class=m>⏳ En attente d'envoi</span><span class=mb>${esc(x.row.body||'')}</span></div>`).join('');
 imgs(el);if(!el._lp){el._lp=1;attachLP(el)}};
function attachLP(el){let tm=null,sx=0,sy=0;const cancel=()=>{clearTimeout(tm);tm=null},
 start=e=>{const b=e.target.closest('.msg[data-mid]');if(!b||e.target.closest('a,[data-a=qj]'))return;const p=e.touches?e.touches[0]:e;sx=p.clientX;sy=p.clientY;clearTimeout(tm);tm=setTimeout(()=>{tm=null;menu(b.dataset.mid)},450)},
 move=e=>{const p=e.touches?e.touches[0]:e;if(Math.abs(p.clientX-sx)>10||Math.abs(p.clientY-sy)>10)cancel()};
 el.addEventListener('touchstart',start,{passive:true});el.addEventListener('touchmove',move,{passive:true});el.addEventListener('touchend',cancel);el.addEventListener('touchcancel',cancel);
 el.addEventListener('mousedown',start);el.addEventListener('mouseup',cancel);el.addEventListener('mouseleave',cancel);
 el.addEventListener('contextmenu',e=>{const b=e.target.closest('.msg[data-mid]');if(b){e.preventDefault();cancel();menu(b.dataset.mid)}});
 el.addEventListener('click',e=>{if(Date.now()-MENU_AT<700){e.stopPropagation();e.preventDefault()}},true)}
function menu(mid){if(document.querySelector('.sheet'))return;const m=M.find(x=>x.id==mid);if(!m||m.deleted_at)return;MENU_AT=Date.now();try{navigator.vibrate&&navigator.vibrate(15)}catch{}
 const t=T.find(x=>x.k==cur),mine=m.sender_id==me.id,my=(RX[mid]||[]).find(r=>r.user_id==me.id)?.kind,
  canPin=mine||m.recipient_id==me.id||me.role_type=='admin',canDel=mine&&me.role_type=='admin',on=k=>my==k?'background:#ffe9a8':'';
 const s=document.createElement('div');s.className='sheet';
 s.innerHTML=`<div><div class=rr><button data-s=like style="${on('like')}">👍</button><button data-s=love style="${on('love')}">❤️</button></div><p class=m style="text-align:center;margin:0 0 6px">Aimer · Adorer</p>${t&&!t.ro?'<button data-s=reply>↩ Répondre</button>':''}${canPin?`<button data-s=pin>📌 ${m.pinned_at?'Désépingler':'Épingler'} le message</button>`:''}${m.body?'<button data-s=copy>📋 Copier le texte</button>':''}${canDel?'<button data-s=del style="color:#b3261e">🗑 Supprimer</button>':''}<button data-s=x style="color:#777">Fermer</button></div>`;
 document.body.appendChild(s);
 s.onclick=async e=>{const b=e.target.closest('[data-s]');if(!b&&e.target!==s)return;const a=b?b.dataset.s:'x';s.remove();
  if(a=='like'||a=='love'){const r=await sb.rpc('pm_react',{p_id:mid,p_kind:my==a?null:a});if(r.error)return alert('Réaction impossible : '+r.error.message);await loadRX();drawMsgs()}
  else if(a=='reply')H.rpl(mid);
  else if(a=='pin'){const r=await sb.rpc('pm_pin',{p_id:mid,p_pin:!m.pinned_at});if(r.error)return alert('Épinglage impossible : '+r.error.message);await reloadM();drawMsgs()}
  else if(a=='copy'){try{await navigator.clipboard.writeText(m.body);alert('Texte copié ✓')}catch{}}
  else if(a=='del')H.mdel2(mid)}}
const cv0=convView;convView=function(k){cv0.apply(this,arguments);loadRX().then(()=>cur==k&&drawMsgs());loadPeer(k).then(()=>cur==k&&drawMsgs())};
const sig=()=>[M.length,M.filter(m=>m.deleted_at).length,M.filter(m=>m.pinned_at).length,Object.values(RX).flat().length,JSON.stringify(PEER[cur]||{})].join('|');
setInterval(async()=>{if(tab!='msg'||!cur||document.hidden)return;const s0=sig();await Promise.all([loadRX(),loadPeer(cur),reloadM()]);if(sig()!=s0)drawMsgs()},8000);
const ru0=refreshUnread;refreshUnread=async function(){const r=await ru0.apply(this,arguments);try{Object.keys(UNR).filter(k=>k!='ann'&&!k.startsWith('bc:')&&!SEENDONE.has(k+':'+UNR[k])).forEach(k=>{SEENDONE.add(k+':'+UNR[k]);sb.rpc('pm_mark_seen',{p_k:k})})}catch{}return r};

/* ===== 4. Salle de réunion : écrire (en attente) + signaux rapides ===== */
const SIG=[['motion','🗳 Motion'],['comment','💬 Commentaire'],['addition','➕ Complément'],['question','❓ Question'],['like',"👍 J'aime"],['applause','👏 Bravo'],['agree',"✅ D'accord"],['disagree',"❌ Pas d'accord"],['repeat','🔁 Répéter'],['urgent','🚨 Urgent']];
const dr0=drawRoom;drawRoom=function(force){try{if(CM&&CM.msgs)CM.msgs=CM.msgs.map(x=>x.kind=='signal'?{...x,kind:'system',body:(x.sender_name||'')+' : '+x.body}:x)}catch{}dr0.call(this,force);try{decorEdit();decorRoom()}catch(e){console.warn(e)}};
function decorEdit(){if(!CM||me.role_type!='admin'||mState(CM.m)!='future')return;const r=$('#rbtn');if(r&&!r.querySelector('[data-a=rmedit]'))r.insertAdjacentHTML('afterbegin','<button class=g data-a=rmedit>✏ Modifier le programme</button> ')}
H.rmedit=async()=>{const m=CM.m,nz=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),
 loc=d=>{const x=new Date(d),p=n=>String(n).padStart(2,'0');return[x.getFullYear()+'-'+p(x.getMonth()+1)+'-'+p(x.getDate()),p(x.getHours())+':'+p(x.getMinutes())]},
 all=(await sb.from('pm_dir').select('id,full_name,role_type,zone_id,status').eq('status','active')).data||[],
 ds=all.filter(p=>p.role_type!='admin').sort((a,b)=>a.full_name.localeCompare(b.full_name)),ads=all.filter(p=>p.role_type=='admin'),SEL=new Set(CM.inv.map(x=>x.user_id)),[d1,s1]=loc(m.start_at),[,e1]=loc(m.end_at);
 hs().innerHTML=`<div class=card><h3>✏ Modifier la réunion</h3><form id=mef><input name=title value="${esc(m.title)}" required><textarea name=agenda rows=3 placeholder="Ordre du jour (facultatif)">${esc(m.agenda)}</textarea><label class=m>Date</label><input type=date name=d min="${today()}" value="${d1}" required><div style="display:flex;gap:8px"><div style="flex:1"><label class=m>Début</label><input type=time name=s value="${s1}" required></div><div style="flex:1"><label class=m>Fin</label><input type=time name=e value="${e1}" required></div></div><div class=ins>Tous les participants seront prévenus de la modification. Les rappels seront recalculés sur le nouvel horaire.</div><label class=m>Modérateur principal</label><select name=mod>${ads.map(a=>`<option value=${a.id} ${a.id==m.moderator_id?'selected':''}>${esc(a.full_name)}</option>`).join('')}</select><label class=m>Invités (un invité retiré perd l'accès ; un nouvel invité reçoit son code en privé)</label><input id=iq placeholder="🔎 Chercher un nom…"><div id=il></div><p class=m id=ic></p><button>Enregistrer les changements</button> <button type=button class=s id=mex>Annuler</button></form></div>`;
 const draw=()=>{const q=nz($('#iq').value),f=ds.filter(p=>SEL.has(p.id)||!q||nz(p.full_name).includes(q)).slice(0,60);$('#il').innerHTML=f.map(p=>`<label style="display:block"><input class=ck type=checkbox data-i=${p.id} ${SEL.has(p.id)?'checked':''}>${esc(p.full_name)} <span class=m>· ${ROLES[p.role_type]}${zn(p.zone_id)?' · '+esc(zn(p.zone_id)):''}</span></label>`).join('')||'<p class=m>Aucun résultat.</p>';$('#ic').textContent=SEL.size+' invité(s)'};
 $('#iq').oninput=draw;$('#il').onchange=e=>{const i=e.target.dataset.i;if(!i)return;e.target.checked?SEL.add(i):SEL.delete(i);$('#ic').textContent=SEL.size+' invité(s)'};draw();
 $('#mex').onclick=()=>roomDetail(m.id);
 $('#mef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),st=new Date(f.get('d')+'T'+f.get('s')),en=new Date(f.get('d')+'T'+f.get('e'));
  if(!(en>st))return alert("Impossible : l'heure de fin doit être après l'heure de début.");const b=e.submitter;b.disabled=true;
  const{error}=await sb.rpc('pm_meeting_update',{p_id:m.id,p_title:f.get('title'),p_agenda:f.get('agenda'),p_start:st.toISOString(),p_end:en.toISOString(),p_invitees:[...SEL],p_moderator:f.get('mod')});
  if(error){b.disabled=false;return alert('Impossible : '+error.message)}
  alert('Réunion modifiée ✓ Les participants sont prévenus.');roomDetail(m.id)}};
function decorRoom(){if(!CM||!CM.joined||mState(CM.m)!='open'||CM.m.moderator_id==me.id)return;const c=$('#rmc');if(!c)return;
 if(!c.querySelector('#rmf')&&!c.querySelector('#rmx')){const mu=CM.mutes.includes(me.id);
  c.innerHTML=`<form id=rmx><textarea rows=2 placeholder="Écrivez ici : votre message pourra partir dès que le modérateur vous donnera la parole…"></textarea><button disabled style="opacity:.6">🔒 ${mu?'Écriture bloquée par le modérateur':'En attente de la parole'}</button></form>`;
  c.querySelector('#rmx').onsubmit=e=>e.preventDefault()}
 let bar=$('#rqs');if(!bar){bar=document.createElement('div');bar.id='rqs';c.parentNode.insertBefore(bar,c)}
 const up=CM.hands.some(h=>h.user_id==me.id),key=up?'1':'0';
 if(bar.dataset.k!==key){bar.dataset.k=key;bar.innerHTML=`<button class="${up?'s':'g'}" data-a=rmhand data-v=${up?0:1}>${up?'✋ Baisser la main':'✋ Lever la main'}</button>`+SIG.map(([k,l])=>`<button class=s data-a=rmsig data-v=${k}>${l}</button>`).join('')}}
H.rmsig=async v=>{const r=await sb.rpc('pm_signal',{p_id:CM.m.id,p_kind:v});if(r.error)return alert(/Patientez/.test(r.error.message)?r.error.message:'Signal impossible : '+r.error.message);try{navigator.vibrate&&navigator.vibrate(20)}catch{}await refreshRoom(true)};

/* ===== 5. Début de réunion : plein écran, comme un appel ===== */
let ringT=null,vibT=null,AC=null;
const stopRing=()=>{clearInterval(ringT);clearInterval(vibT);ringT=vibT=null;try{navigator.vibrate&&navigator.vibrate(0)}catch{}try{AC&&AC.close()}catch{}AC=null};
function startRing(){stopRing();
 const beep=()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state=='suspended')AC.resume();const t=AC.currentTime;[[880,0],[660,.28],[880,.56],[660,.84]].forEach(([f,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.35,t+d+.03);g.gain.exponentialRampToValueAtTime(.0001,t+d+.24);o.connect(g);g.connect(AC.destination);o.start(t+d);o.stop(t+d+.26)})}catch{}},
 vib=()=>{try{navigator.vibrate&&navigator.vibrate([700,300,700,300,700])}catch{}};
 beep();vib();ringT=setInterval(beep,2400);vibT=setInterval(vib,3200);setTimeout(stopRing,45000)}
showAlertOverlay=function(list,go){return new Promise(res=>{if(!list.length||ALERT_OPEN)return res();ALERT_OPEN=true;let i=0;
 const d=document.createElement('div');d.className='pmcall';
 d.style.cssText='position:fixed;inset:0;z-index:2000;background:radial-gradient(circle at 50% 30%,#1d3a73,#0b1b3f 70%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:max(48px,env(safe-area-inset-top)) 24px max(40px,env(safe-area-inset-bottom));text-align:center;overflow:auto';
 document.body.appendChild(d);document.body.style.overflow='hidden';
 const fin=()=>{stopRing();d.remove();document.body.style.overflow='';ALERT_OPEN=false;res()},
 draw=()=>{const a=list[i],rg=/^r\d+$/.test(a.slot),join=go&&(rg||['s0','m5','m15','m30','h1'].includes(a.slot)),call=join&&(rg||a.slot=='s0'),big=a.title.split(' ')[0],ttl=a.title.replace(big,'').trim();call?startRing():stopRing();
  d.innerHTML=`<div style="color:#cdd6ea;letter-spacing:2px;font-size:13px">${call?'RÉUNION EN COURS':'ALERTE'+(list.length>1?' '+(i+1)+'/'+list.length:'')}</div><div><div class=big style="font-size:84px">${esc(big)}</div><h2 style="margin:10px 0">${esc(ttl)}</h2><p style="white-space:pre-wrap;font-size:19px;line-height:1.5;max-width:520px;margin:0 auto">${esc(a.body)}</p></div><div style="display:flex;gap:38px;align-items:flex-start">${join?`<div><button data-q=later style="width:74px;height:74px;border-radius:50%;background:#b3261e;font-size:28px;padding:0">✕</button><div style="font-size:13px;margin-top:6px">Plus tard</div></div><div><button data-q=go style="width:74px;height:74px;border-radius:50%;background:#1a9a47;font-size:28px;padding:0">🏛</button><div style="font-size:13px;margin-top:6px">Rejoindre</div></div>`:`<button class=g data-q=ok style="font-size:19px;padding:14px 28px">✅ J'ai lu</button>`}</div>`};
 d.onclick=async e=>{const b=e.target.closest('[data-q]');if(!b)return;b.disabled=true;stopRing();const a=list[i];try{await sb.rpc('pm_alert_read',{p_id:a.id})}catch{}
  if(b.dataset.q=='go'){fin();RMID=a.meeting_id;tab='plus';pv='room';nav();plusView();return}
  i++;i<list.length?draw():fin()};
 draw()})};
setInterval(()=>{if(!me||!READY)return;const n=nowS();if(MEETS.some(m=>!m.cancelled_at&&(mState(m)=='open'||(new Date(m.start_at)>n-6e4&&new Date(m.start_at)-n<6e5))))pollAlerts()},6000);

/* ===== 6. Bouton « retour » du téléphone ===== */
let lastBack=0,EXIT=false;
const t0=H.tab;H.tab=function(){RDET=false;return t0.apply(this,arguments)};
function goBack(){
 const sh=document.querySelector('.sheet');if(sh){sh.remove();return true}
 const dl=[...document.body.children].filter(x=>x.tagName=='DIV'&&x.style.position=='fixed'&&x.style.zIndex=='99');
 if(dl.length){const c=dl[dl.length-1].querySelector('[data-q="0"]');c?c.click():dl[dl.length-1].remove();return true}
 if(ALERT_OPEN)return true;
 if(!me||me.status!='active'||!READY)return false;
 if(FORM){H.tab('rep');return true}
 if(cur){msgView();return true}
 const bk=document.querySelector('#app button[data-a=back]');if(bk){bk.click();return true}
 if(RDET){H.tab('rep');return true}
 if(tab=='plus'&&pv){if(pv=='room'&&RMID)H.rmback();else if(pv=='pv'&&PVID)H.pvback();else H.pl('');return true}
 if(tab!='inf'){H.tab('inf');return true}
 return false}
const hs0=history.state;if(!hs0||!hs0.pm){history.replaceState({pm:'base'},'');history.pushState({pm:'app'},'')}else if(hs0.pm=='base')history.pushState({pm:'app'},'');
addEventListener('popstate',e=>{if(EXIT||!e.state||e.state.pm!='base')return;
 if(goBack()){history.pushState({pm:'app'},'');return}
 const n=Date.now();if(n-lastBack<2500){EXIT=true;history.back();return}
 lastBack=n;alert("Appuyez encore une fois sur Retour pour quitter l'application");history.pushState({pm:'app'},'')});

/* ===== Démarrage ===== */
if(typeof me!=='undefined'&&me){nav();refreshEx()}
})();
