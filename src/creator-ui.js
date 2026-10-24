/*! Palm Court (c) 2026. All rights reserved. */
import{Settings as w}from"./core.js";import{UI as v,$ as o}from"./ui.js";import{Bus as T}from"./events.js";import{Profile as x}from"./profile.js";import{Portraits as E}from"./render/portrait.js";import{flatPortrait as b}from"./pros.js";import{ProgressUI as y,myLook as k}from"./progress-ui.js";import*as n from"./creator.js";const C=e=>`#${((e??0)>>>0).toString(16).padStart(6,"0").slice(-6)}`,u=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),L=[["presets","Presets"],["face","Face"],["hair","Hair"],["skin","Skin"],["body","Body"],["eyes","Eyes"]],$=new Set(["face","hair","eyes"]),S=.5,I=.011,z=.2,R=`
.cr-slab{width:min(980px,100%);gap:14px}
.cr-head{display:flex;align-items:flex-end;justify-content:space-between;gap:6px 20px;flex-wrap:wrap}
.cr-desc{margin:0;max-width:46ch;font-size:13px;color:var(--mist);text-align:right}
.cr-main{display:grid;grid-template-columns:minmax(240px,330px) minmax(0,1fr);gap:20px;align-items:start}
.cr-stage{display:grid;gap:8px;justify-items:center;min-width:0}
.cr-view{position:relative;height:min(60vh,500px);aspect-ratio:3/4;max-width:100%;border:1px solid var(--edge);background:radial-gradient(circle at 50% 38%,rgba(242,245,238,.12),rgba(0,0,0,.32) 75%);overflow:hidden;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:pan-y}
.cr-view.drag{cursor:grabbing}
.cr-view:focus-visible{outline:2px solid var(--optic);outline-offset:2px}
html.pad .cr-view:focus{outline:2px solid var(--optic);outline-offset:2px}
.cr-view>canvas,.cr-view>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.cr-view>svg{background:radial-gradient(circle at 50% 38%,rgba(242,245,238,.1),rgba(0,0,0,.3) 75%)}
.cr-view.flat{height:auto;width:min(100%,360px);aspect-ratio:1}
.cr-turns{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.cr-turns .btn{padding:7px 11px;font-size:13px}
.cr-hint{margin:0;font-size:12px;color:var(--mist);text-align:center;max-width:34ch;min-height:1.3em}
.cr-panel{display:grid;gap:12px;min-width:0}
.cr-tabs{display:flex;gap:2px;border-bottom:1px solid var(--edge);overflow-x:auto;scrollbar-width:none}
.cr-tab{appearance:none;background:none;border:0;border-bottom:3px solid transparent;margin-bottom:-1px;padding:9px 10px 8px;flex:0 0 auto;font:800 17px/1 var(--display);letter-spacing:.05em;text-transform:uppercase;color:var(--mist);cursor:pointer;white-space:nowrap}
.cr-tab:hover{color:var(--chalk)}
.cr-tab[aria-pressed=true]{color:var(--chalk);border-bottom-color:var(--optic)}
.cr-tab:focus-visible{outline:2px solid var(--optic);outline-offset:-2px}
html.pad .cr-tab:focus{outline:2px solid var(--optic);outline-offset:-2px}
.cr-sec{display:grid;gap:16px;align-content:start;min-height:280px}
.cr-sec h3{margin:0 0 6px;font:700 11px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--optic)}
.cr-note{margin:0;font-size:12.5px;color:var(--mist)}
.cr-presets{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.cr-preset{appearance:none;display:grid;grid-template-rows:auto auto;gap:5px;padding:6px;border:1px solid var(--edge);background:rgba(242,245,238,.035);color:inherit;text-align:left;cursor:pointer;min-width:0}
.cr-preset:hover{background:rgba(242,245,238,.08)}
.cr-preset[aria-pressed=true]{border-color:var(--optic);box-shadow:inset 0 0 0 1px var(--optic)}
.cr-preset:focus-visible{outline:2px solid var(--optic);outline-offset:1px}
html.pad .cr-preset:focus{outline:2px solid var(--optic);outline-offset:1px}
.cr-preset>span{display:block;aspect-ratio:1;overflow:hidden;background:rgba(0,0,0,.28)}
.cr-preset svg{display:block;width:100%;height:100%}
.cr-preset b{font:800 14px/1.05 var(--display);text-transform:uppercase;letter-spacing:.03em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.1em}
.cr-rows{display:grid;gap:12px}
.cr-row{display:grid;gap:4px}
.cr-row>label{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font:700 13px/1.2 var(--body);letter-spacing:.04em}
.cr-row>label b{font:800 17px/1 var(--display);text-transform:uppercase;letter-spacing:.04em}
.cr-row>label output{color:var(--optic);font:700 12px/1 var(--body);font-variant-numeric:tabular-nums;white-space:nowrap}
.cr-row input[type=range]{width:100%;min-height:30px;accent-color:var(--optic);margin:0;cursor:pointer}
.cr-row input[type=range]:focus-visible,html.pad .cr-row input[type=range]:focus{outline:2px solid var(--optic);outline-offset:2px}
.cr-ends{display:flex;justify-content:space-between;font-size:11px;color:var(--mist);letter-spacing:.06em;text-transform:uppercase}
.cr-chips,.cr-sws{display:flex;flex-wrap:wrap;gap:6px}
.cr-chip,.cr-sw{position:relative;display:block;cursor:pointer}
.cr-chip input,.cr-sw input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.cr-chip span{display:block;padding:9px 12px;border:1px solid var(--edge);font:700 13px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--mist)}
.cr-chip:hover span{color:var(--chalk)}
.cr-chip input:checked+span{background:var(--chalk);color:var(--ink);border-color:var(--chalk)}
.cr-chip:has(input:focus-visible),.cr-sw:has(input:focus-visible){outline:2px solid var(--optic);outline-offset:2px}
html.pad .cr-chip:has(input:focus),html.pad .cr-sw:has(input:focus){outline:2px solid var(--optic);outline-offset:2px}
.cr-sw i{display:block;width:34px;height:34px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25),inset 0 -6px 10px rgba(0,0,0,.22)}
.cr-sw input:checked+i{box-shadow:0 0 0 2px var(--ink),0 0 0 4px var(--optic),inset 0 0 0 1px rgba(255,255,255,.25)}
.cr-sw.dye i::after{content:'';position:absolute;right:-1px;top:-1px;width:9px;height:9px;border-radius:50%;background:var(--optic);box-shadow:0 0 0 2px var(--ink)}
.cr-cap{margin:6px 0 0;font:600 12px/1.2 var(--body);color:var(--chalk);min-height:1.2em}
.cr-foot{display:flex;align-items:center;gap:8px 10px;flex-wrap:wrap}
.cr-foot .fine{flex:1 1 200px;font-size:12px;order:5}
.cr-foot .btn.primary{min-width:120px}
@media (max-width:700px){
  .cr-main{grid-template-columns:1fr;gap:12px}
  .cr-stage{position:sticky;top:0;z-index:3;background:#0a1621;padding:4px 0;margin-top:-4px}
  .cr-view{height:min(36vh,300px)}
  .cr-view.flat{height:auto;width:min(62%,230px)}
  .cr-hint{display:none}
  .cr-desc{text-align:left;font-size:12px}
  .cr-tab{padding:9px 7px 8px;font-size:15px;letter-spacing:.03em}
  .cr-sec{min-height:0}
  .cr-presets{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}
  .cr-foot{position:sticky;bottom:0;z-index:3;background:#0a1621;padding:8px 0 2px;margin-bottom:-2px;flex-wrap:nowrap;gap:6px}
  .cr-foot .btn{flex:1 1 auto;padding:11px 8px;text-align:center;min-width:0}
  .cr-foot .btn.primary{flex:1.3 1 auto;min-width:0}
  .cr-foot .fine,.cr-foot kbd{display:none}
}
@media (max-height:520px) and (min-width:700px){.cr-view{height:min(66vh,330px)}}
@media (prefers-reduced-motion:reduce){.cr-view canvas{transition:none}}
`,A=e=>{const t=Math.round(e/2.54);return`${Math.floor(t/12)}′ ${t%12}″`};export const Creator={built:!1,app:null,section:"presets",turn:0,zoom:0,live:null,liveStarting:!1,from:"hub",saveT:0,dragging:null,build(){if(this.built)return;this.built=!0;const e=document.createElement("style");e.id="crCss",e.textContent=R,document.head.append(e),document.body.insertAdjacentHTML("beforeend",`<main id="creator" class="screen center" hidden aria-labelledby="crTitle">
      <section class="slab wide cr-slab">
        <header class="cr-head"><div><p class="eyebrow">Your player</p><h2 id="crTitle">Customize</h2></div><p class="cr-desc" id="crDesc"></p></header>
        <div class="cr-main">
          <div class="cr-stage">
            <div class="cr-view" id="crView" tabindex="0" role="group" aria-label="Preview of your player. Drag, or use the left and right arrow keys, to turn."></div>
            <div class="cr-turns"><button type="button" class="btn small" id="crTurnL" aria-label="Turn left">◀ Turn</button><button type="button" class="btn small" id="crZoom" aria-pressed="false">Face</button><button type="button" class="btn small" id="crTurnR" aria-label="Turn right">Turn ▶</button></div>
            <p class="cr-hint" id="crHint"></p>
          </div>
          <div class="cr-panel">
            <div class="cr-tabs" role="group" aria-label="Sections">${L.map(([i,c])=>`<button type="button" class="cr-tab" data-sec="${i}" aria-pressed="false">${c}</button>`).join("")}</div>
            <div class="cr-sec" id="crSec" role="region" aria-label="Options"></div>
          </div>
        </div>
        <footer class="cr-foot"><button type="button" class="btn" id="crRandom">Randomize</button><button type="button" class="btn ghost" id="crReset">Reset</button><p class="fine" id="crNote">Free for everyone, and looks only: it never changes how you play. Your outfit and headwear come from the Locker.</p><button type="button" class="btn primary" id="crDone" data-back>Done <kbd>Esc</kbd></button></footer>
      </section></main>`);const t=o("creator");o("crDone").onclick=()=>this.close(),o("crRandom").onclick=()=>{this.apply(n.randomAppearance(),!0),this.say("A new random look.")},o("crReset").onclick=()=>{this.apply(n.defaultAppearance(),!0),this.say("Back to the starting look.")},o("crTurnL").onclick=()=>this.rotate(-S),o("crTurnR").onclick=()=>this.rotate(S),o("crZoom").onclick=()=>{this.zoom=this.zoom?0:1,this.refresh()};for(const i of t.querySelectorAll(".cr-tab"))i.onclick=()=>this.show(i.dataset.sec),i.onfocus=()=>{this.section!==i.dataset.sec&&this.show(i.dataset.sec,!1)};const r=o("crSec");r.addEventListener("input",i=>this.onInput(i)),r.addEventListener("change",i=>this.onInput(i)),r.addEventListener("click",i=>{const c=i.target.closest("button[data-preset]");c&&this.pickPreset(c.dataset.preset,c)});const s=o("crView");s.addEventListener("pointerdown",i=>this.dragStart(i)),s.addEventListener("pointermove",i=>this.dragMove(i));for(const i of["pointerup","pointercancel"])s.addEventListener(i,c=>this.dragEnd(c));s.addEventListener("keydown",i=>{(i.key==="ArrowLeft"||i.key==="ArrowRight")&&(i.preventDefault(),i.stopPropagation(),this.rotate((i.key==="ArrowLeft"?-1:1)*z))}),T.on("screen",({screen:i})=>{i!=="creator"&&this.teardown()}),addEventListener("pagehide",()=>this.flush())},open({from:e}={}){this.build(),this.from=e||(v.screen==="menu"?"menu":"hub"),this.app=n.clean(x.appearance),this.turn=0,this.section=this.section||"presets",this.zoom=$.has(this.section)?1:0,v.go("creator"),this.show(this.section,!1),this.view();const t=document.querySelector(`#creator .cr-tab[data-sec="${this.section}"]`);t&&t.focus({preventScroll:!0})},close(){this.flush();const e=this.from;if(this.teardown(),e==="menu")v.go("menu");else{const t=y.from;y.open("locker"),y.from=t;const r=document.querySelector('#pgBody [data-key="customize"]');r&&r.focus({preventScroll:!0})}},teardown(){if(this.live){try{this.live.dispose()}catch{}this.live=null}this.liveStarting=!1},flush(){clearTimeout(this.saveT),this.saveT=0,this.app&&!n.same(this.app,x.appearance)&&x.setAppearance(this.app)},look(){return k({},this.app)},apply(e,t=!1){this.app=n.clean(t?e:{...this.app,...e,face:{...this.app.face,...e.face||{}}}),clearTimeout(this.saveT),this.saveT=setTimeout(()=>this.flush(),300),this.refresh(),t&&this.renderSection()},refresh(){o("crDesc").textContent=n.describe(this.app);const e=o("crZoom");e.textContent=this.zoom?"Body":"Face",e.setAttribute("aria-pressed",String(!!this.zoom)),e.setAttribute("aria-label",this.zoom?"Show the whole body":"Zoom in on the face");const t=this.look();if(this.live&&!this.live.dead)this.live.set(t,{hand:w.handed,turn:this.turn,zoom:this.zoom});else{const r=o("crView");r.classList.contains("flat")&&(r.innerHTML=b(t,"cr-flat"))}},async view(){const e=o("crView"),t=this.look();if(e.className="cr-view flat",e.innerHTML=b(t,"cr-flat"),o("crHint").textContent="",this.setTurnEnabled(!1),this.live||this.liveStarting)return;this.liveStarting=!0;const r=Math.min(2,devicePixelRatio||1),s=e.getBoundingClientRect(),i=Math.max(180,Math.round(s.width*r)),c=Math.max(240,Math.round(s.height*r)),m=c>640?2:3;let l=null;try{l=await E.live({width:i,height:c,ss:m,onFail:()=>this.liveFailed()})}catch{l=null}if(this.liveStarting=!1,v.screen!=="creator"){l&&l.dispose();return}if(!l){this.noLive();return}this.live=l,l.set(this.look(),{hand:w.handed,turn:this.turn,zoom:this.zoom});const a=await l.ready;if(!(this.live!==l||l.dead)){if(!a){this.liveFailed();return}e.className="cr-view",e.replaceChildren(l.canvas),this.setTurnEnabled(!0),o("crHint").textContent="Drag to turn."}},noLive(){o("crHint").textContent="The 3D preview is off with Low graphics (or without a graphics card). Turn Graphics up in Settings to see your player from every side."},liveFailed(){if(this.live=null,v.screen!=="creator")return;const e=o("crView");e.className="cr-view flat",e.innerHTML=b(this.look(),"cr-flat"),this.setTurnEnabled(!1),o("crHint").textContent="The 3D preview could not start here, so this is the flat picture."},setTurnEnabled(e){for(const t of["crTurnL","crTurnR","crZoom"])o(t).disabled=!e},rotate(e){this.turn=((this.turn+e+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI,this.refresh()},dragStart(e){if(!(!this.live||e.button>0)){this.dragging={x:e.clientX,id:e.pointerId},o("crView").classList.add("drag");try{o("crView").setPointerCapture(e.pointerId)}catch{}o("crView").focus({preventScroll:!0})}},dragMove(e){const t=this.dragging;if(!t||t.id!==e.pointerId)return;const r=e.clientX-t.x;t.x=e.clientX,r&&this.rotate(r*I)},dragEnd(e){const t=this.dragging;!t||t.id!==e.pointerId||(this.dragging=null,o("crView").classList.remove("drag"))},show(e,t=!1){this.section=e;for(const s of document.querySelectorAll("#creator .cr-tab"))s.setAttribute("aria-pressed",String(s.dataset.sec===e));const r=document.querySelector(`#creator .cr-tab[data-sec="${e}"]`);if(r){const s=r.parentElement,i=r.getBoundingClientRect(),c=s.getBoundingClientRect();(i.left<c.left||i.right>c.right)&&(s.scrollLeft+=i.left-c.left-(c.width-i.width)/2)}this.zoom=$.has(e)?1:0,this.renderSection(),this.refresh(),t&&r&&r.focus({preventScroll:!0})},renderSection(){const e=this.app,t=o("crSec"),r=document.activeElement,s=r&&t.contains(r)?r.dataset.key||r.dataset.preset:null,i=(a,p,d,g,h,f)=>`<label class="${h}" title="${u(d)}"><input type="radio" name="${a}" value="${p}" aria-label="${u(d)}"${f?" checked":""}>${g}</label>`,c=(a,p,d,g)=>`<div class="cr-sws" role="radiogroup" aria-label="${u(g)}">${p.map((h,f)=>i(a,f,h.name,`<i style="--c:${C(h.color)}"></i>`,`cr-sw${h.dyed?" dye":""}`,d===f)).join("")}</div><p class="cr-cap" id="cap-${a}">${u(p[d].name)}${p[d].dyed?" (dyed)":""}</p>`,m=(a,p,d,g)=>`<div class="cr-chips" role="radiogroup" aria-label="${u(g)}">${p.map((h,f)=>i(a,f,h.name,`<span>${u(h.name)}</span>`,"cr-chip",d===f)).join("")}</div>`;let l="";if(this.section==="presets"?l=`<p class="cr-note">Start from one of these, then change anything. They are all free.</p><div class="cr-presets">${n.PRESETS.map(a=>`<button type="button" class="cr-preset" data-preset="${a.id}" aria-pressed="${n.same(e,a.appearance)}" title="${u(a.blurb)}"><span>${b(k({},a.appearance),"cr-pt")}</span><b>${u(a.name)}</b></button>`).join("")}</div>`:this.section==="face"?l=`<div class="cr-rows">${n.FACE.map(a=>`<div class="cr-row"><label for="crf-${a.key}"><b>${a.label}</b><output id="cro-${a.key}">${this.faceWord(a,e.face[a.key])}</output></label><input type="range" id="crf-${a.key}" data-face="${a.key}" data-key="face:${a.key}" min="0" max="${n.FACE_STEPS-1}" step="1" value="${e.face[a.key]}"><div class="cr-ends"><span>${a.less}</span><span>${a.more}</span></div></div>`).join("")}</div><p class="cr-note">Small changes only, so every face stays a real face.</p>`:this.section==="hair"?l=`<div><h3>Style</h3>${m("hair",n.HAIR_STYLES,e.hair,"Hair style")}</div><div><h3>Colour</h3>${c("hairColor",n.HAIR_COLORS,e.hairColor,"Hair colour")}</div><div><h3>Facial hair</h3>${m("beard",n.BEARDS,e.beard,"Facial hair")}</div>`:this.section==="skin"?l=`<div><h3>Skin tone</h3>${c("skin",n.SKIN_TONES,e.skin,"Skin tone")}</div>`:this.section==="body"?l=`<div class="cr-rows"><div class="cr-row"><label for="crf-height"><b>Height</b><output id="cro-height">${this.heightWord(e.height)}</output></label><input type="range" id="crf-height" data-height="1" data-key="height" min="${n.HEIGHT.min}" max="${n.HEIGHT.max}" step="1" value="${e.height}"><div class="cr-ends"><span>${n.HEIGHT.min} cm</span><span>${n.HEIGHT.max} cm</span></div></div></div><div><h3>Build</h3>${m("build",n.BUILDS,e.build,"Build")}</div><p class="cr-note">The ruler in the preview shows your height in metres.</p>`:l=`<div><h3>Eye colour</h3>${c("eyeColor",n.EYE_COLORS,e.eyeColor,"Eye colour")}</div><p class="cr-note">Eye size is in Face. Zoom in on the face to see the colour.</p>`,t.innerHTML=l,s){const a=t.querySelector(`[data-key="${CSS.escape(s)}"], [data-preset="${CSS.escape(s)}"]`);a&&a.focus({preventScroll:!0})}},faceWord(e,t){const r=t-n.FACE_MID,s=r<0?e.less:e.more;return r===0?"Average":Math.abs(r)<=2?`Slightly ${s.toLowerCase()}`:Math.abs(r)===3?s:`Much ${s.toLowerCase()}`},heightWord(e){return`${(e/100).toFixed(2)} m · ${A(e)}`},onInput(e){const t=e.target;if(!(!t||!t.dataset)){if(t.dataset.face){const r=t.dataset.face,s=n.FACE.find(c=>c.key===r);this.apply({face:{[r]:+t.value}});const i=o(`cro-${r}`);i&&(i.textContent=this.faceWord(s,+t.value))}else if(t.dataset.height){this.apply({height:+t.value});const r=o("cro-height");r&&(r.textContent=this.heightWord(+t.value))}else if(t.type==="radio"&&["hair","hairColor","beard","skin","build","eyeColor"].includes(t.name)&&t.checked){this.apply({[t.name]:+t.value});const r=o(`cap-${t.name}`),s={hairColor:n.HAIR_COLORS,skin:n.SKIN_TONES,eyeColor:n.EYE_COLORS}[t.name];r&&s&&(r.textContent=`${s[+t.value].name}${s[+t.value].dyed?" (dyed)":""}`)}}},pickPreset(e,t){const r=n.presetById(e);r&&(this.apply(r.appearance,!0),this.say(`${r.name}: ${r.blurb}.`))},say(e){const t=o("crNote");t&&(t.textContent=e,clearTimeout(this.noteT),this.noteT=setTimeout(()=>{t.textContent="Free for everyone, and looks only: it never changes how you play. Your outfit and headwear come from the Locker."},3500))}};
