/* La Poste MNA : audio.js
   Messages vocaux (2 min 30 max) dans la salle de réunion.
   À charger APRÈS ajouts.js. Il ne remplace aucune fonction existante : il complète l'affichage de la salle.
   Le droit d'envoyer reste contrôlé par le modérateur (même règle que l'écriture : serveur + écran). */
(()=>{
const MAX=150,MAXB=3e6;
const st=document.createElement('style');st.textContent=`
#rmAud{margin:8px 0}
#rmAud .bar{height:8px;border-radius:99px;background:#e6e9f3;overflow:hidden;margin:8px 0}
#rmAud .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--g),var(--b));transition:width .25s linear}
#rmAud audio,.msg audio{width:100%;margin-top:4px}
#rmAud .rec{color:var(--b);font-weight:800;animation:pmr 1s infinite}`;
document.head.appendChild(st);
let R=null,P=null;
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const pick=()=>[['audio/webm;codecs=opus','webm'],['audio/webm','webm'],['audio/mp4','m4a'],['audio/ogg;codecs=opus','ogg']].find(x=>window.MediaRecorder&&MediaRecorder.isTypeSupported(x[0]));
const box=()=>$('#rmAud');
function ui(){const b=box();if(!b)return;
 if(R)b.innerHTML=`<div class=ins><span class=rec>● Enregistrement</span> <b id=at>0:00</b> / ${fmt(MAX)}<div class=bar><i id=ab></i></div><button type=button class=r data-a=auStop>⏹ Terminer</button> <button type=button class=s data-a=auCancel>Annuler</button></div>`;
 else if(P)b.innerHTML=`<div class=ins>🎤 Message vocal (${fmt(P.dur)})<audio controls src="${P.url}"></audio><button type=button class=g data-a=auSend>Envoyer</button> <button type=button class=s data-a=auCancel>Refaire</button></div>`;
 else b.innerHTML='<button type=button class=s data-a=auStart>🎤 Message vocal (2 min 30 max)</button>'}
H.auStart=async()=>{if(R||P)return;const m=pick();
 if(!m)return alert("Impossible : ce téléphone ne permet pas l'enregistrement audio dans le navigateur.");
 let s;try{s=await navigator.mediaDevices.getUserMedia({audio:true})}catch{return alert("Impossible : autorisez le micro pour ce site dans les réglages du navigateur.")}
 const mr=new MediaRecorder(s,{mimeType:m[0],audioBitsPerSecond:32000}),r={mr,s,ch:[],t0:Date.now(),ext:m[1],base:m[0].split(';')[0],keep:true};R=r;
 mr.ondataavailable=e=>{if(e.data&&e.data.size)r.ch.push(e.data)};
 mr.onstop=()=>{clearInterval(r.tm);r.s.getTracks().forEach(t=>t.stop());R=null;
  const dur=Math.min(MAX,Math.round((Date.now()-r.t0)/1000));
  if(r.keep&&dur>=1){const blob=new Blob(r.ch,{type:r.base});P={blob,dur,ext:r.ext,url:URL.createObjectURL(blob)}}
  ui()};
 r.tm=setInterval(()=>{const e=(Date.now()-r.t0)/1000,a=$('#at'),b=$('#ab');
  if(a)a.textContent=fmt(Math.min(e,MAX));if(b)b.style.width=Math.min(100,e/MAX*100)+'%';
  if(!$('#rmf')){r.keep=false;H.auStop();alert("Enregistrement annulé : vous n'avez plus la parole ou vous avez quitté la salle.");return}
  if(e>=MAX)H.auStop()},250);
 mr.start(1000);ui()};
H.auStop=()=>{if(R&&R.mr.state=='recording')R.mr.stop()};
H.auCancel=()=>{if(R){R.keep=false;H.auStop();return}if(P){URL.revokeObjectURL(P.url);P=null;ui()}};
H.auSend=async(v,b)=>{if(!P)return;
 if(!$('#rmf'))return alert("Impossible : vous n'avez pas la parole en ce moment.");
 if(P.blob.size>MAXB)return alert('Impossible : message vocal trop lourd. Refaites-le plus court.');
 const p=P;b.disabled=true;b.textContent='Envoi…';
 const path=await upl(p.blob,'vocal_'+Date.now()+'.'+p.ext);
 if(!path){b.disabled=false;b.textContent='Envoyer';return}
 const{error}=await sb.from('pm_meeting_msgs').insert({meeting_id:CM.m.id,file_path:path,file_name:'Message vocal ('+fmt(p.dur)+').'+p.ext,file_kind:'document'});
 if(error){await sb.storage.from('pm-files').remove([path]);b.disabled=false;b.textContent='Envoyer';
  return alert('Envoi refusé : '+(/row-level/i.test(error.message)?"vous n'avez pas la parole ou la salle est fermée.":error.message))}
 URL.revokeObjectURL(p.url);P=null;await refreshRoom(true)};
function fixAudios(){const el=$('#rml');if(!el)return;
 el.querySelectorAll('a[data-a=dl]').forEach(a=>{const p=a.dataset.v||'';if(!/\.(webm|m4a|ogg)$/i.test(p))return;
  const w=document.createElement('div');w.innerHTML='<span class=m>🎤 '+esc(a.textContent.replace('📎','').trim())+'</span><audio controls preload=metadata></audio>';
  const au=w.querySelector('audio');a.replaceWith(w);sign(p).then(u=>{if(u)au.src=u})})}
function decor(){const f=$('#rmf');
 if(f&&!box()){const d=document.createElement('div');d.id='rmAud';f.after(d);ui()}
 fixAudios()}
const dr0=drawRoom;drawRoom=function(force){dr0.call(this,force);try{decor()}catch(e){console.warn(e)}};
})();
