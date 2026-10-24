/*! Palm Court (c) 2026. All rights reserved. */
import{Settings as l}from"./core.js";import{UI as f,$ as a}from"./ui.js";import{Training as m}from"./training.js";import{Profile as p}from"./profile.js";import{Progress as b}from"./progress.js";import{Pad as u}from"./pad.js";import*as h from"./firstrun-logic.js";const d=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),g=()=>{try{return matchMedia("(pointer: coarse)").matches}catch{return!1}},x=`
.fr-slab { width: min(720px, 100%); gap: 14px; }
.fr-slab h2 { font-size: clamp(34px, 6vw, 48px); }
.fr-rec { display: grid; gap: 5px; padding: 12px 14px 13px; border: 1px solid var(--edge); border-left: 4px solid var(--optic); background: rgba(242,245,238,.05); }
.fr-rec p { margin: 0; }
.fr-badge { font: 700 12px/1 var(--body); letter-spacing: .16em; text-transform: uppercase; color: var(--optic); }
.fr-rec h3 { margin: 0; font: 900 clamp(30px, 7vw, 38px)/.95 var(--display); text-transform: uppercase; }
.fr-line { color: var(--chalk); font-size: 15px; }
.fr-need { color: var(--mist); font-size: 13px; }
.fr-hint { color: var(--optic); font-size: 15px; font-weight: 700; }
.fr-play { width: 100%; min-height: 64px; text-align: center; font: 900 clamp(30px, 8vw, 38px)/1 var(--display); text-transform: uppercase; letter-spacing: .04em; }
.fr-more { margin: 4px 0 0; font: 700 12px/1 var(--body); letter-spacing: .16em; text-transform: uppercase; color: var(--mist); }
.fr-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 8px; }
.fr-wrap { display: grid; gap: 6px; grid-template-rows: 1fr; min-width: 0; }
.fr-wrap:has(.fr-sub) { grid-template-rows: 1fr auto; }
.fr-wrap .fr-card { width: 100%; height: 100%; }
.fr-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.fr-cam { appearance: none; display: grid; gap: 2px; justify-items: start; min-height: 44px; padding: 6px 10px; border: 1px solid var(--edge); background: transparent; color: var(--chalk); text-align: left; cursor: pointer; font: inherit; }
.fr-cam b { font: 900 16px/1 var(--display); text-transform: uppercase; }
.fr-cam small { font-size: 12px; opacity: .75; }
.fr-cam[aria-checked="true"] { background: var(--optic); color: var(--optic-ink, #1b2300); border-color: var(--optic); }
.fr-cam:focus-visible { outline: 3px solid var(--chalk); outline-offset: 2px; }
.fr-card { display: grid; gap: 4px; align-content: start; min-height: 92px; padding: 10px 12px 11px; }
.fr-card b { font: 900 16px/1.05 var(--display); text-transform: uppercase; overflow-wrap: break-word; }   /* (16px: "CONTROLLER" must fit a 150 px card on one line) */
.fr-card .l { display: block; font-size: 13px; font-weight: 500; }
.fr-card .n { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; color: var(--mist); }
.fr-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 14px; }
.fr-foot .fine { flex: 1 1 220px; }
@media (max-width: 560px) { .fr-slab { padding: 16px 14px 14px; gap: 10px; } .fr-slab h2 { font-size: 34px; } .fr-card { min-height: 0; } .fr-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } .fr-foot .btn { width: 100%; text-align: center; } }
@media (max-height: 700px) and (min-width: 561px) { .fr-slab { padding-block: 18px 16px; gap: 10px; } }
`,y=`
<main id="firstrun" class="screen center" hidden aria-labelledby="frTitle">
  <section class="slab fr-slab">
    <header><p class="eyebrow">Welcome to Palm Court</p><h2 id="frTitle"></h2></header>
    <div class="fr-rec" id="frRec" aria-live="polite" aria-atomic="true"></div>
    <button type="button" class="btn primary fr-play" id="btnFrPlay" aria-describedby="frRec"></button>
    <section aria-labelledby="frMore"><h3 class="fr-more" id="frMore">Other ways to play</h3><div class="fr-cards" id="frCards"></div></section>
    <footer class="fr-foot"><p class="fine" id="frSettings"></p><button type="button" class="btn ghost small" id="btnFrSkip" data-back>Skip to the menu</button></footer>
  </section>
</main>`;export const FirstRun={shown:!1,dev:null,busy:!1,timer:0,padSeen:!1,who(){const t=p.data&&p.data.tutorial||{};let e=0;try{e=Object.keys(b.training().runs||{}).length}catch{}return{firstRunDone:!!l.firstRunDone,matches:p.stats&&p.stats.matches,history:p.history?p.history.length:0,trainingRuns:e,control:l.control,tutorialDone:!!t.done,tutorialSkipped:!!t.skipped,introStep:l.introStep|0}},async maybeOpen(){let t;try{t=new URLSearchParams(location.search)}catch{t=new URLSearchParams}return await p.ready,h.wantsStep(this.who(),t)?(this.build(),this.dev={coarse:g(),padFound:!!u.id,hasCamera:null,aLabel:this.aLabel(),pick:null,cam:l.camKind==="body"?"body":"hand"},this.padSeen=this.dev.padFound,this.shown=!0,this.render(),f.go("firstrun"),a("btnFrPlay").focus({preventScroll:!0}),this.watch(),!0):!1},build(){if(a("firstrun"))return;const t=document.createElement("style");t.id="firstrunCss",t.textContent=x,document.head.append(t);const e=document.createElement("div");e.innerHTML=y;const i=a("hud"),n=e.firstElementChild;i?i.before(n):document.body.append(n),a("btnFrPlay").onclick=()=>this.choose(h.plan(this.dev).primary.id),a("btnFrSkip").onclick=()=>this.skip(),a("frCards").addEventListener("click",o=>{const c=o.target.closest("[data-cam]");if(c){this.dev.cam=c.dataset.cam==="body"?"body":"hand",this.render();const s=a("frCards").querySelector(`[data-cam="${this.dev.cam}"]`);s&&s.focus({preventScroll:!0});return}const r=o.target.closest("[data-id]");r&&this.choose(r.dataset.id,!0)}),a("frCards").addEventListener("keydown",o=>{const c={ArrowLeft:-1,ArrowRight:1}[o.key],r=[...a("frCards").querySelectorAll("[data-cam]")],s=r.indexOf(document.activeElement);!c||s<0||(o.preventDefault(),r[(s+c+r.length)%r.length].click())})},aLabel(){try{return u.glyph("a")||"A"}catch{return"A"}},render(){const t=h.plan(this.dev),e=document.activeElement,i=e&&e.dataset&&e.dataset.id,n=t.primary;a("frTitle").textContent=t.heading,a("frRec").innerHTML=`<p class="fr-badge">${d(t.badge)}</p><h3>${d(n.title)}</h3><p class="fr-line">${d(n.line)}</p><p class="fr-need">${d(n.need)}</p>${t.hint?`<p class="fr-hint">${d(t.hint)}</p>`:""}`;const o=a("btnFrPlay");o.textContent=t.playLabel,o.setAttribute("aria-label",`${t.playLabel}: ${n.title}`);const c=r=>r.sub?`<div class="fr-sub" role="radiogroup" aria-label="The camera follows">${r.sub.map(s=>`<button type="button" role="radio" aria-checked="${s.on}" class="fr-cam" data-cam="${s.id}" tabindex="${s.on?0:-1}"><b>${d(s.label)}</b><small>${d(s.note)}</small></button>`).join("")}</div>`:"";if(a("frCards").innerHTML=t.cards.map(r=>`<div class="fr-wrap"><button type="button" class="btn fr-card" data-id="${r.id}" aria-describedby="frd-${r.id}"><b>${d(r.title)}</b><span id="frd-${r.id}"><span class="l">${d(r.line)}</span><span class="n">${d(r.need)}</span></span></button>${c(r)}</div>`).join(""),a("frSettings").textContent=t.settings,i){const r=a("frCards").querySelector(`[data-id="${i}"]`);r&&r.focus({preventScroll:!0})}},watch(){const t=()=>{const e=!!u.id;e!==this.padSeen&&(this.padSeen=e,this.dev.padFound=e,this.dev.aLabel=this.aLabel(),this.render())};this.onPad=t,addEventListener("gamepadconnected",t),this.timer=setInterval(t,300);try{navigator.mediaDevices.enumerateDevices().then(e=>{!this.shown||!e.length||(this.dev.hasCamera=e.some(i=>i.kind==="videoinput"),this.dev.hasCamera||this.render())}).catch(()=>{})}catch{}},unwatch(){clearInterval(this.timer),this.timer=0,this.onPad&&removeEventListener("gamepadconnected",this.onPad),this.onPad=null,this.shown=!1},async choose(t,e=!1){const i=h.describe(t,this.dev),n=h.settingsFor(t,this.dev);if(!(!i||!n||this.busy)){if(e&&i.kind==="direct"){this.dev.pick=t,this.render(),a("btnFrPlay").focus({preventScroll:!0});return}this.busy=!0;try{l.firstRunDone=!0,n.mouseMode&&(l.mouseMode=n.mouseMode),f.setControl(n.control),this.unwatch(),m.hideCard(),i.kind==="direct"?await m.start("tutorial"):(m.returnTo="tutorial",f.openControls("menu"))}catch(o){console.error("[firstrun]",o),f.go("menu")}finally{this.busy=!1}}},skip(){l.firstRunDone=!0,l.save(),this.unwatch(),f.go("menu")}};
