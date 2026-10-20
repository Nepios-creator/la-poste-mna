/* La Poste MNA : clavier.js
   Zone de saisie fixée en bas de l'écran (au-dessus du clavier) dans toutes les conversations
   et dans la salle de réunion, comme WhatsApp. À charger APRÈS ajouts.js, audio.js et jitsi.js.
   Il ne change aucun contenu ni aucune fonction : il enveloppe seulement l'affichage. */
(()=>{
const css=`
html body input,html body select,html body textarea{font-size:16px}
body.has-dock nav{display:none!important}
body.has-dock{padding-bottom:calc(var(--dock-h,84px) + 16px)}
#cdock,#rmc:has(#rmf){position:fixed;left:0;right:0;bottom:var(--kb,0px);z-index:70;max-width:720px;margin:0 auto;padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));background:rgba(255,255,255,.95);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid #e3e6f0;border-radius:18px 18px 0 0;box-shadow:0 -8px 24px rgba(20,40,75,.10)}
#cdock form,#rmf{display:flex;align-items:flex-end;gap:8px;margin:0}
#cdock textarea,#rmf textarea{order:1;flex:1;width:auto;min-width:0;height:44px;min-height:44px;max-height:132px;margin:0;padding:11px 16px;border-radius:22px;resize:none;line-height:1.35}
#cdock input[type=file],#rmf input[type=file]{order:0;flex:0 0 44px;width:44px;height:44px;margin:0;padding:0;border:0;background:none;color:transparent;font-size:0;overflow:hidden}
#cdock input[type=file]::file-selector-button,#rmf input[type=file]::file-selector-button{width:44px;height:44px;margin:0;padding:0;border:0;border-radius:50%;font-size:0;color:transparent;box-shadow:none;cursor:pointer;background:#eef0f8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235a647d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'/%3E%3C/svg%3E") center/22px no-repeat}
#cdock input[type=file][data-has]::file-selector-button,#rmf input[type=file][data-has]::file-selector-button{background-color:#f3e6bf;box-shadow:0 0 0 2px #b8923a}
#cdock form>button,#rmf>button{order:2;flex:0 0 auto;width:auto;height:44px;min-height:44px;margin:0;padding:0 18px;border-radius:22px}
#cdock #rp .ins{margin:0 0 6px;padding:6px 10px}
#cdock #rp button{min-height:0;padding:4px 10px}
#rmc #rmAud{margin:6px 0 0}
#rmc #rmAud>button{width:100%;min-height:38px;padding:6px 12px}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const root=document.documentElement,vv=window.visualViewport;
let nb=true,DK=null,KEY='';
const near=()=>innerHeight+scrollY>=root.scrollHeight-200,bottom=()=>scrollTo(0,root.scrollHeight);
addEventListener('scroll',()=>{nb=near()},{passive:true});
const kb=()=>{if(!vv)return;root.style.setProperty('--kb',Math.max(0,Math.round(innerHeight-vv.height-vv.offsetTop))+'px');if(nb&&DK)setTimeout(bottom,60)};
if(vv){vv.addEventListener('resize',kb);vv.addEventListener('scroll',kb)}
const ro=new ResizeObserver(()=>{if(DK)root.style.setProperty('--dock-h',DK.offsetHeight+'px')});
function sync(){const d=$('#cdock')||($('#rmf')?$('#rmc'):null);document.body.classList.toggle('has-dock',!!d);
 if(d!==DK){ro.disconnect();DK=d;if(d)ro.observe(d)}}
let q=0;new MutationObserver(()=>{cancelAnimationFrame(q);q=requestAnimationFrame(sync)}).observe(app,{childList:true,subtree:true});
const grow=t=>{t.style.height='44px';t.style.height=Math.min(t.scrollHeight,132)+'px'};
document.addEventListener('input',e=>{if(e.target.matches&&e.target.matches('#cdock textarea,#rmf textarea'))grow(e.target)});
document.addEventListener('change',e=>{const i=e.target;if(i.matches&&i.matches('#cdock input[type=file],#rmf input[type=file]'))i.toggleAttribute('data-has',!!i.value)});
document.addEventListener('reset',e=>setTimeout(()=>{const f=e.target;if(!f.querySelectorAll)return;f.querySelectorAll('textarea').forEach(t=>t.style.height='');f.querySelectorAll('input[type=file]').forEach(i=>i.removeAttribute('data-has'))},0));
function prep(f){const fi=f.querySelector('input[type=file]'),t=f.querySelector('textarea');
 if(fi&&!fi.title){fi.title='Joindre un fichier';fi.setAttribute('aria-label','Joindre un fichier')}
 if(t){t.rows=1;if(t.value)grow(t)}}
function dockify(){const f=$('#cf');if(!f||$('#cdock'))return;const d=document.createElement('div'),rp=$('#rp');d.id='cdock';(rp||f).before(d);if(rp)d.appendChild(rp);d.appendChild(f);prep(f)}
const later=()=>{setTimeout(bottom,350);setTimeout(bottom,900)};
const cv0=convView;convView=function(){KEY='';cv0.apply(this,arguments);dockify();sync()};
const dm0=drawMsgs;drawMsgs=function(){const n0=near(),fresh=KEY!='c'+cur;dm0.apply(this,arguments);KEY='c'+cur;if(fresh){bottom();later()}else if(n0)requestAnimationFrame(bottom)};
const rd0=roomDetail;roomDetail=async function(){KEY='';return rd0.apply(this,arguments)};
const dr0=drawRoom;drawRoom=function(){const n0=near(),id=CM&&CM.m?CM.m.id:'',fresh=KEY!='r'+id;dr0.apply(this,arguments);KEY='r'+id;
 const f=$('#rmf');if(f)prep(f);sync();if(fresh){bottom();later()}else if(n0)requestAnimationFrame(bottom)};
})();
