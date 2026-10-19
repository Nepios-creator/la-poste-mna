/* La Poste MNA : jitsi.js
   Bouton « Rejoindre l'appel audio » dans la salle de réunion (Jitsi Meet public, gratuit).
   À charger APRÈS ajouts.js. Le bouton n'apparaît que pour les personnes entrées dans la salle,
   et seulement pendant que la réunion est en cours. Le nom de la salle Jitsi est impossible à deviner. */
(()=>{
const room=()=>'LaPosteMNA-'+String(CM.m.id).replace(/-/g,'');
H.jcall=()=>{if(!CM||!CM.joined||mState(CM.m)!='open')return alert("Impossible : l'appel n'est disponible que pendant la réunion.");
 const h=['config.startWithVideoMuted=true','config.startAudioOnly=true','config.disableDeepLinking=true','userInfo.displayName='+encodeURIComponent(JSON.stringify(me.full_name||''))].join('&');
 window.open('https://meet.jit.si/'+room()+'#'+h,'_blank','noopener')};
function decor(){const ok=CM&&CM.joined&&mState(CM.m)=='open';let d=$('#rmCall');
 if(!ok){if(d)d.remove();return}
 if(!d){const p=$('#rpanel');if(!p)return;d=document.createElement('div');d.id='rmCall';
  d.innerHTML='<div class=card><b>📞 Appel audio</b><p class=m>Ouvre l\'appel dans Jitsi (gratuit). Gardez votre micro coupé tant que vous n\'avez pas la parole.</p><button type=button class=g data-a=jcall>📞 Rejoindre l\'appel audio</button></div>';
  p.before(d)}}
const dr0=drawRoom;drawRoom=function(force){dr0.call(this,force);try{decor()}catch(e){console.warn(e)}};
})();
