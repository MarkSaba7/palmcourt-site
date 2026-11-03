/*! Palm Court (c) 2026. All rights reserved. */
import{UI as i,$ as c}from"./ui.js";import{Bus as p}from"./events.js";import{Profile as n}from"./profile.js";import{Progress as h}from"./progress.js";import{Tour as b}from"./tour.js";import{has as g}from"./editions.js";import{ACTS as f,syncStats as x,chapterView as l}from"./career.js";const a=r=>String(r??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),d=r=>Math.round(r||0).toLocaleString("en-US"),y=`
.cr-slab { width: min(900px, 100%); gap: 14px; }
.cr-sum { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; }
.cr-sum b { font: 900 34px/1 var(--display); color: var(--optic); }
.cr-act h3 { margin: 12px 0 2px; font: 900 26px/1 var(--display); text-transform: uppercase; }
.cr-act > p { margin: 0 0 8px; font-size: 13px; color: var(--mist); }
.cr-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.cr-ch { display: grid; grid-template-columns: 38px 1fr; gap: 4px 12px; border: 1px solid var(--edge); background: rgba(242,245,238,.04); padding: 10px 12px; }
.cr-ch > :not(.n) { grid-column: 2; }
.cr-ch .n { grid-row: 1 / span 5; grid-column: 1; font: 900 30px/1 var(--display); color: var(--mist); align-self: start; }
.cr-ch.done { border-color: rgba(214,240,74,.45); }
.cr-ch.done .n { color: var(--optic); }
.cr-ch.now { border-color: var(--optic); background: rgba(214,240,74,.07); }
.cr-ch.later { opacity: .72; }
.cr-ch h4 { margin: 0; font: 900 22px/1 var(--display); text-transform: uppercase; }
.cr-ch p { margin: 0; font-size: 13px; color: var(--mist); }
.cr-ch .story { color: var(--chalk); }
.cr-rw { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: var(--mist); }
.cr-rw b { color: var(--optic); font-weight: 600; }
.cr-strip { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; border: 1px solid var(--edge); background: rgba(242,245,238,.04); padding: 10px 14px; }
.cr-strip p { margin: 0; font-size: 13px; color: var(--mist); }
.cr-strip b { color: var(--chalk); }`,v=`<main id="career" class="screen center" hidden aria-labelledby="crTitle">
  <section class="slab cr-slab">
    <header><p class="eyebrow">World Tour</p><h2 id="crTitle">Career story</h2></header>
    <div class="cr-sum" id="crSum"></div>
    <div id="crBody"></div>
    <div class="actions row"><button type="button" class="btn" id="crBack" data-back>World Tour</button></div>
  </section>
</main>`;export const CareerUI={built:!1,init(){if(this.built||!g("career"))return;this.built=!0;const r=document.createElement("style");r.id="crCss",r.textContent=y,document.head.append(r);const e=document.createElement("div");e.innerHTML=v;const o=c("over")||c("hud");o?o.before(e.firstElementChild):document.body.append(e.firstElementChild),c("crBack").onclick=()=>i.go("tour");const t=c("tourRun");t&&t.insertAdjacentHTML("afterend",'<section class="cr-strip" id="crStrip" aria-label="Career story" hidden></section>'),document.addEventListener("click",s=>{s.target.closest&&s.target.closest("[data-open-career]")&&this.open()}),n.ready.then(()=>this.sync()),p.on("tour:result",()=>setTimeout(()=>this.sync(),0)),p.on("screen",({screen:s})=>{s==="tour"&&(this.sync(),this.strip())})},sync(){if(!n.loaded)return[];try{return x(n.stats,b.t)&&n.changed(),h.checkNow()}catch(r){return console.warn("[career]",r),[]}},strip(){const r=c("crStrip");if(!r||!n.loaded)return;const e=l(n.stats,n.data.achievements),o=e.current;r.hidden=!1,r.innerHTML=o?`<p><b>Career story</b> · chapter ${o.n} of ${e.total}: <b>${a(o.name)}</b>. ${a(o.goal)}.</p><button type="button" class="btn small ghost" data-open-career>Open the story</button>`:`<p><b>Career story</b> · all ${e.total} chapters done. World number one.</p><button type="button" class="btn small ghost" data-open-career>Read it again</button>`},open(){this.render(),i.go("career");const r=c("crBack");r&&r.focus({preventScroll:!0})},render(){const r=l(n.stats,n.data.achievements);c("crSum").innerHTML=`<b>${r.done} / ${r.total}</b><span>chapters done</span>`,c("crBody").innerHTML=f.map(e=>{const o=r.rows.filter(t=>t.act===e.id);return`<section class="cr-act" aria-label="${a(e.name)}"><h3>${a(e.name)}</h3><p>${a(e.blurb)}</p><ol class="cr-list">${o.map(t=>{const s=t.done?"done":t===r.current?"now":"later",m=t.progress?` · ${d(t.progress.value)} / ${d(t.progress.goal)}`:"";return`<li class="cr-ch ${s}"><span class="n">${t.n}</span><h4>${a(t.name)}${t.done?" ✓":""}</h4><p>${a(t.goal)}${s==="now"?a(m):""}</p>${t.done||s==="now"?`<p class="story">${a(t.story)}</p>`:""}<div class="cr-rw">${t.rewards.map(u=>`<span>${a(u)}</span>`).join("")}</div></li>`}).join("")}</ol></section>`}).join("")}};
