/*! Palm Court (c) 2026. All rights reserved. */
import{Settings as w,Clock as P}from"./core.js";import{Game as g}from"./game.js";import{UI as k,$ as i}from"./ui.js";import{Bus as T}from"./events.js";import{Profile as M}from"./profile.js";import{Replay as A}from"./replay.js";import{proById as L,proName as I,proPortrait as q}from"./pros.js";import{fmtFuzz as C,fmtXP as R}from"./economy.js";import{Tour as m,TIERS as y,WEEKS as U,eventById as W,roundName as S,pairOf as Y,fullTour as G,steamUrl as N,reqOf as V,levelLabel as K,STYLES as X,fieldPlayer as _,FIELD as j,defending as J}from"./tour.js";const d=t=>String(t??"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r]),f=t=>Math.round(t||0).toLocaleString("en-US"),B=t=>String(t||"").charAt(0).toUpperCase()+String(t||"").slice(1),Q={day:"Day",golden:"Golden hour",night:"Night"},O={short:"Short sets",full:"Full sets",tiebreak:"Tiebreaks"},F=t=>`<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="${t}" d="M9 3h14v7.5a7 7 0 0 1-14 0zM4.5 5H9v2.2H6.6c.2 2.2 1.3 3.6 2.9 4.3l-.6 2C6 12.4 4.5 9.8 4.5 6.2zM27.5 5H23v2.2h2.4c-.2 2.2-1.3 3.6-2.9 4.3l.6 2c2.9-1.1 4.4-3.7 4.4-7.3zM14.2 17.6h3.6V22h-3.6zM10 23h12v2.6H10zM8.5 26.4h15V29h-15z"/><path fill="#fff" opacity=".28" d="M11.2 4.6h2.2v6.6c0 1.6.5 3 1.4 4-2.3-.5-3.6-2.3-3.6-4.8z"/></svg>`;function z(){const t=L(w.playAs);return{name:t?t.name:w.name||"You",short:I(w.playAs,w.name||"You"),country:t?t.country:"",pro:t?t.id:null}}const Z=(t,r)=>{const o=[t>>16&255,t>>8&255,t&255],c=[r>>16&255,r>>8&255,r&255];return Math.hypot(o[0]-c[0],o[1]-c[1],o[2]-c[2])<80},tt=`
.tour-slab { width: min(920px, 100%); gap: 16px; }
.tour-head { display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: flex-end; justify-content: space-between; }
.tour-rank { display: grid; justify-items: end; gap: 2px; }
.tour-head > div:first-child { flex: 1 1 320px; min-width: 0; }
#tourEvent .tour-rank b { font-size: 40px; }
.tour-rank .tr-label { font: 700 11px/1 var(--body); letter-spacing: .14em; text-transform: uppercase; color: var(--mist); }
.tour-rank b { font: 900 52px/.9 var(--display); color: var(--optic); }
.tour-rank .tr-sub { font-size: 13px; color: var(--mist); }
.tour-h { margin: 0 0 8px; font: 700 12px/1 var(--body); letter-spacing: .14em; text-transform: uppercase; color: var(--mist); }
.tour-note { margin: 0; font-size: 13px; color: var(--mist); }
.tour-note a { color: var(--optic); }
.tour-events { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
.tev { border: 1px solid var(--edge); border-top: 3px solid var(--tier, var(--edge)); background: rgba(242,245,238,.04); padding: 12px 14px 14px; display: grid; gap: 6px; align-content: start; }
.tev h4 { margin: 0; font: 900 26px/.95 var(--display); text-transform: uppercase; }
.tev .tev-meta { margin: 0; font-size: 13px; color: var(--mist); }
.tev .tev-prize { margin: 0; font-size: 13px; }
.tev .tev-prize b { color: var(--optic); }
.tev .btn { margin-top: 4px; }
.tev .tev-lock { margin: 4px 0 0; font-size: 13px; color: var(--coral); }
.tev.steam .tev-lock { color: var(--mist); }
.tev.steam { opacity: .72; }
.tier-badge { justify-self: start; font: 700 11px/1 var(--body); letter-spacing: .12em; text-transform: uppercase; padding: 4px 7px; color: var(--ink); background: var(--tier, var(--chalk)); }
.tour-run { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: space-between; border: 1px solid var(--optic); background: rgba(214,240,74,.08); padding: 12px 14px; }
.tour-run p { margin: 0; }
.tour-upcoming { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: 13px; }
.tour-upcoming li { display: grid; grid-template-columns: 64px 1fr; gap: 10px; padding: 6px 0; border-top: 1px solid var(--line); color: var(--mist); }
.tour-upcoming b { color: var(--chalk); font-weight: 600; }
.tour-upcoming .lk { color: var(--mist); opacity: .7; }
.tour-cols { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 18px; }
.tour-cabinet { display: flex; flex-wrap: wrap; gap: 8px; }
.tour-cabinet .tc { display: grid; justify-items: center; gap: 3px; width: 86px; padding: 8px 4px; border: 1px solid var(--edge); background: rgba(242,245,238,.04); text-align: center; font-size: 11px; line-height: 1.15; color: var(--mist); }
.tour-cabinet .tc svg { width: 34px; height: 34px; }
.tour-cabinet .tc b { color: var(--chalk); font-weight: 600; }
.tour-table { margin: 0; padding: 0; list-style: none; font-size: 13px; display: grid; }
.tour-table li { display: grid; grid-template-columns: 44px 1fr auto; gap: 8px; padding: 5px 6px; border-top: 1px solid var(--line); }
.tour-table li.you { background: rgba(214,240,74,.12); color: var(--optic); font-weight: 700; }
.tour-table li.gap { border: 0; padding: 0 6px; color: var(--mist); }
.tour-table .rk { font-variant-numeric: tabular-nums; color: var(--mist); }
.tour-table li.you .rk { color: inherit; }
.tour-table .pt { font-variant-numeric: tabular-nums; color: var(--mist); }
.te-top { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; border: 1px solid var(--edge); background: rgba(242,245,238,.04); padding: 14px; }
.te-opp { display: grid; grid-template-columns: 76px 1fr; gap: 14px; align-items: center; }
.te-opp svg { width: 76px; height: 76px; display: block; background: rgba(242,245,238,.05); }
.te-opp .eyebrow { margin-bottom: 6px; }
.te-opp h3 { margin: 0; font: 900 30px/.95 var(--display); text-transform: uppercase; }
.te-opp p { margin: 4px 0 0; font-size: 13px; color: var(--mist); }
.te-opp p b { color: var(--chalk); font-weight: 600; }
.te-go { display: grid; gap: 8px; min-width: 190px; }
.te-result { border: 1px solid var(--edge); border-top: 3px solid var(--tier, var(--optic)); padding: 14px; display: grid; gap: 8px; background: rgba(242,245,238,.04); }
.te-result h3 { margin: 0; font: 900 40px/.95 var(--display); text-transform: uppercase; color: var(--optic); }
.te-result.out h3 { color: var(--chalk); }
.te-result ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 14px; }
.te-result li b { color: var(--optic); }
.te-result p { margin: 0; color: var(--mist); font-size: 13px; }
.bracket { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px, 1fr); gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.br-col { display: grid; grid-template-rows: auto 1fr; gap: 6px; min-width: 0; }
.br-col > h4 { margin: 0; font: 700 11px/1 var(--body); letter-spacing: .12em; text-transform: uppercase; color: var(--mist); }
.br-ms { display: flex; flex-direction: column; justify-content: space-around; gap: 6px; }
.bm { border: 1px solid var(--edge); background: rgba(8,18,29,.6); font-size: 12px; }
.bm.mine { border-color: var(--optic); }
.bp { display: grid; grid-template-columns: 16px 1fr auto; gap: 6px; padding: 4px 6px; align-items: center; color: var(--mist); min-width: 0; }
.bp + .bp { border-top: 1px solid var(--line); }
.bp .sd { font-size: 10px; opacity: .8; }
.bp .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bp.win { color: var(--chalk); font-weight: 700; }
.bp.you { color: var(--optic); }
.bp.lost { text-decoration: line-through; text-decoration-color: rgba(242,245,238,.35); }
.bp .sc { font-variant-numeric: tabular-nums; font-weight: 600; font-size: 11px; color: var(--chalk); }
.bp.tbd { font-style: italic; opacity: .6; }
#btnTour .tour-menu-rank { margin-left: auto; font-weight: 600; opacity: .7; }
#tourOverNote { margin: 10px 0 0; font-weight: 600; color: var(--optic); }
#tourOverNote.out { color: var(--chalk); }
@media (max-width: 720px) {
  .tour-cols, .te-top { grid-template-columns: 1fr; }
  .tour-rank { justify-items: start; }
  .tour-rank b { font-size: 42px; }
  .te-go { min-width: 0; }
}`,et=`
<main id="tour" class="screen center" hidden aria-labelledby="tourTitle">
  <section class="slab tour-slab">
    <header class="tour-head">
      <div><p class="eyebrow" id="tourWeek"></p><h2 id="tourTitle">World Tour</h2></div>
      <div class="tour-rank"><span class="tr-label">World ranking</span><b id="tourRank"></b><span class="tr-sub" id="tourPts"></span></div>
    </header>
    <div id="tourRun" hidden></div>
    <section aria-labelledby="tourWeekH"><h3 class="tour-h" id="tourWeekH">This week</h3><div id="tourThisWeek" class="tour-events"></div></section>
    <p class="tour-note" id="tourEdition" hidden></p>
    <section aria-labelledby="tourNextH"><h3 class="tour-h" id="tourNextH">Coming up</h3><ol id="tourNext" class="tour-upcoming"></ol></section>
    <div class="tour-cols">
      <section aria-labelledby="tourCabH"><h3 class="tour-h" id="tourCabH">Trophy cabinet</h3><div id="tourCabinet" class="tour-cabinet"></div></section>
      <section aria-labelledby="tourTabH"><h3 class="tour-h" id="tourTabH">Rankings</h3><ol id="tourTable" class="tour-table"></ol></section>
    </div>
    <div class="actions row"><button id="btnTourBack" class="btn" data-back>Main menu</button><button id="btnTourSkip" class="btn ghost">Skip this week</button></div>
  </section>
</main>
<main id="tourEvent" class="screen center" hidden aria-labelledby="teName">
  <section class="slab tour-slab">
    <header class="tour-head">
      <div><p class="eyebrow" id="teMeta"></p><h2 id="teName"></h2></div>
      <div class="tour-rank"><span class="tr-label" id="teRoundL">Round</span><b id="teRound"></b><span class="tr-sub" id="teSub"></span></div>
    </header>
    <div id="teMain"></div>
    <section aria-labelledby="teDrawH"><h3 class="tour-h" id="teDrawH">Draw</h3><div id="teBracket" class="bracket"></div></section>
    <div class="actions row"><button id="btnTeBack" class="btn" data-back>World Tour</button></div>
  </section>
</main>`;export const TourUI={pendingEvent:!1,lastMatch:null,init(){if(i("tour"))return;const t=document.createElement("style");t.id="tourCss",t.textContent=tt,document.head.append(t);const r=document.createElement("div");r.innerHTML=et;const o=i("over")||i("hud");for(const n of[...r.children])o?o.before(n):document.body.append(n);const c=document.createElement("button");c.id="btnTour",c.className="btn",c.innerHTML='World Tour <span class="tour-menu-rank"></span>',c.onclick=()=>this.open();const a=i("btnPractice");a&&a.after(c);const s=document.createElement("button");s.id="btnTourNext",s.className="btn primary",s.hidden=!0,s.textContent="Continue",s.onclick=()=>this.leaveMatch();const p=document.createElement("p");p.id="tourOverNote",p.hidden=!0,p.setAttribute("role","status"),i("btnRematch")&&i("btnRematch").before(s),i("overTitle")&&i("overTitle").after(p),i("btnTourBack").onclick=()=>k.go("menu"),i("btnTourSkip").onclick=()=>{m.skipWeek()&&this.renderHub()},i("btnTeBack").onclick=()=>this.open(),T.on("screen",({screen:n})=>this.onScreen(n)),T.on("match:start",({cfg:n})=>this.onMatchStart(n)),T.on("tour:match",n=>{this.lastMatch=n,n.retired&&(this.pendingEvent=!0)}),M.on("change",()=>this.menuRank()),M.ready.then(()=>this.menuRank())},menuRank(){const t=document.querySelector("#btnTour .tour-menu-rank");t&&M.loaded&&(t.textContent=`#${m.rank}`)},open(){this.renderHub(),k.go("tour");const t=document.querySelector("#tour .tev .btn.primary, #tourRun .btn");t&&t.focus({preventScroll:!0})},renderHub(){const t=m.t,r=m.rank,o=m.run,c=J(t);i("tourWeek").textContent=`Season ${t.season} · Week ${t.week+1} of ${U}`,i("tourRank").textContent=`#${r}`,i("tourPts").textContent=`${f(m.points)} pts · best #${Math.min(t.best,r)}${c?` · defending ${f(c)}`:""}`;const a=i("tourRun");if(a.hidden=!o,o){const e=W(o.ev),u=m.next();a.className="tour-run",a.innerHTML=`<p><b>${d(e.name)}</b> · ${u?`${d(u.name)} vs ${d(u.opp.name)}`:""}</p><button class="btn primary small" id="btnTourCont">Continue</button>`,i("btnTourCont").onclick=()=>this.openEvent()}i("tourThisWeek").innerHTML=m.week().map(e=>this.eventCard(e,!!o)).join("");for(const e of document.querySelectorAll("#tourThisWeek [data-enter]"))e.onclick=()=>this.enter(e.dataset.enter);const s=!G(),p=N();i("tourEdition").hidden=!s,s&&(i("tourEdition").innerHTML=`Web edition: every Challenger event, all season long.${p?` The 500s, Masters, Majors and the Finals are in the <b>full World Tour on Steam</b> · <a href="${d(p)}" target="_blank" rel="noopener">Wishlist on Steam</a> · <button type="button" class="ed-link" data-open-editions>What Steam adds</button>.`:""}${m.week().every(e=>!y[e.tier].web)?" No Challenger this week: skip ahead to the next one.":""}`),i("btnTourSkip").hidden=!!o,i("tourNext").innerHTML=m.upcoming(4).map(e=>`<li><span>Week ${e.week}${e.season!==t.season?`<br>S${e.season}`:""}</span><span>${e.events.map(u=>{const v=y[u.tier],b=!v.web&&s;return`<span class="${b?"lk":""}"><b>${d(u.name)}</b> · ${v.name}, ${E(u)}${b&&N()?" · Steam":b?" · not in the web edition":""}</span>`}).join("<br>")}</span></li>`).join("");const n=new Map;for(const e of t.trophies){const u=e.ev;n.set(u,{...e,n:(n.get(u)?.n||0)+1})}i("tourCabinet").innerHTML=n.size?[...n.values()].map(e=>`<div class="tc" title="${d(e.name)}">${F(y[e.tier]?.color||"#d6f04a")}<b>${d(e.name)}</b><span>${y[e.tier]?.name||""}${e.n>1?` ×${e.n}`:""}</span></div>`).join(""):'<p class="tour-note">Win a title to put your first trophy here.</p>';const l=[],x=new Set,$=e=>{if(!(e<1||e>500||x.has(e)))if(x.add(e),e===r)l.push({r:e,you:!0,name:z().name,pts:m.points});else{const u=e<r?e:e-1;if(u<1||u>j.length-1)return;const v=_(u);l.push({r:e,name:v.name,pts:j[u]})}};[1,2,3].forEach($);for(let e=r-2;e<=r+2;e++)$(e);l.sort((e,u)=>e.r-u.r),i("tourTable").innerHTML=l.map((e,u)=>`${u&&e.r-l[u-1].r>1?'<li class="gap">⋯</li>':""}<li class="${e.you?"you":""}"><span class="rk">#${e.r}</span><span>${d(e.name)}${e.you?" (you)":""}</span><span class="pt">${f(e.pts)}</span></li>`).join("")},eventCard(t,r){const o=y[t.tier],c=m.eligibility(t),a=V(t),s=Math.round(Math.log2(o.draw)),p=m.t.played[t.id],n=a.rank==null&&a.level==null?"Open entry":`Entry: rank #${a.rank}${a.level!=null?` or Level ${a.level}`:""}`;let l;return c.steam?l=`<p class="tev-lock">${d(c.why)}</p>`:c.ok?l=`<button class="btn ${r?"":"primary"}" data-enter="${t.id}" ${r?"disabled":""}>Enter · ${o.draw}-player draw</button>`:l=`<p class="tev-lock">${d(c.why)}</p>`,`<article class="tev${c.steam?" steam":""}" style="--tier:${o.color}">
      <span class="tier-badge">${o.name}</span>
      <h4>${d(t.name)}</h4>
      <p class="tev-meta">${d(t.city)} · ${E(t)} · ${O[o.format]} · ${s} rounds</p>
      <p class="tev-prize">Champion: <b>${f(o.pts[s])} pts</b> · ${C(o.fuzz[s])} · ${R(o.xp[s])}</p>
      <p class="tev-meta">${n}${p&&p.titles?` · Titles here: ${p.titles}`:""}</p>
      ${l}
    </article>`},enter(t){m.enter(t,z())?this.openEvent():this.renderHub()},openEvent(){this.renderEvent(),k.go("tourEvent");const t=i("btnTePlay")||i("btnTeDone");t&&t.focus({preventScroll:!0})},renderEvent(){const t=m.t,r=t.run,o=r||t.last;if(!o){this.open();return}const c=W(o.ev),a=y[c.tier],s=r?r.R:o.R;i("teMeta").textContent=`${a.name} · ${E(c)} · ${O[a.format]} · Season ${o.season}`,i("teName").textContent=c.name;const p=i("teMain");if(r){const n=m.next(),l=n.opp;i("teRoundL").textContent="Next",i("teRound").textContent=n.name,i("teSub").textContent=`You: #${r.rank}${r.draw[r.me].seed?` · seed ${r.draw[r.me].seed}`:""}`;const x=l.pro?L(l.pro)?.blurb:X[l.style]?.label;p.innerHTML=`<div class="te-top">
        <div class="te-opp">${q(l.look||{})}<div><p class="eyebrow">${d(n.name)} opponent</p><h3>${d(l.name)}</h3>
          <p><b>#${l.rank}</b>${l.seed?` · seed ${l.seed}`:""}${l.country?` · ${d(l.country)}`:""} · ${l.handed==="L"?"Left-handed":"Right-handed"}</p>
          <p>${d(x||"")} · Level: <b>${K(l.skill)}</b></p></div></div>
        <div class="te-go"><button class="btn primary" id="btnTePlay">Play the ${d(n.name.toLowerCase())}</button><button class="btn ghost small" id="btnTeWithdraw">Withdraw</button></div>
      </div>`,i("btnTePlay").onclick=()=>this.play(),i("btnTeWithdraw").onclick=()=>{confirm("Withdraw from this tournament? It counts as a loss in this round.")&&(m.withdraw(),this.renderEvent())}}else{const n=o,l=n.title;i("teRoundL").textContent="World ranking",i("teRound").textContent=`#${n.rankTo}`,i("teSub").textContent=n.rankTo<n.rankFrom?`up ${n.rankFrom-n.rankTo} from #${n.rankFrom}`:`was #${n.rankFrom}`,p.innerHTML=`<div class="te-result${l?"":" out"}" style="--tier:${a.color}">
        <p class="eyebrow">${n.retired?"Retired":l?"Title won":`Out in the ${d(S(n.R,n.reached).toLowerCase())}`}</p>
        <h3>${l?"Champion!":d(n.label)}</h3>
        <ul><li><b>+${f(n.pts)}</b> ranking points</li><li><b>+${C(n.fuzz)}</b></li><li><b>+${R(n.xp)}</b></li>${l?"<li>Trophy added to your cabinet</li>":""}</ul>
        <p>World ranking #${n.rankFrom} → <b>#${n.rankTo}</b>${!l&&n.champion?` · ${d(n.champion.name)} won the title`:""}</p>
        <div class="actions row"><button class="btn primary" id="btnTeDone" data-back>Back to World Tour</button></div>
      </div>`,i("btnTeDone").onclick=()=>this.open()}this.renderBracket(o,s,a)},renderBracket(t,r){const o=[];for(let a=0;a<r;a++){const s=[],p=t.n/2**(a+1),n=t.me!=null?Math.floor(t.me/2**(a+1)):-1;for(let l=0;l<p;l++){const[x,$]=Y(t,a,l),e=t.wins[a]?t.wins[a][l]:null,u=t.scores[a]?t.scores[a][l]:"",v=b=>{if(b==null)return'<div class="bp tbd"><span class="sd"></span><span class="nm">TBD</span><span class="sc"></span></div>';const h=t.draw[b],H=e!=null&&e===b,D=e!=null&&e!==b;return`<div class="bp${H?" win":""}${D?" lost":""}${h.you?" you":""}"><span class="sd">${h.seed||""}</span><span class="nm" title="${d(h.name)} #${h.rank}">${d(h.you?`${h.short||h.name} (you)`:h.short)}</span><span class="sc">${H?d(u):""}</span></div>`};s.push(`<div class="bm${l===n&&(a===0||t.wins[a-1]&&t.wins[a-1][Math.floor(t.me/2**a)]===t.me)?" mine":""}">${v(x)}${v($)}</div>`)}o.push(`<div class="br-col"><h4>${S(r,a)}</h4><div class="br-ms">${s.join("")}</div></div>`)}const c=t.wins[r-1]&&t.wins[r-1][0];c!=null&&o.push(`<div class="br-col"><h4>Champion</h4><div class="br-ms"><div class="bm"><div class="bp win${t.draw[c].you?" you":""}"><span class="sd">${F(t.draw[c].you?"#d6f04a":"#93a7bb")}</span><span class="nm">${d(t.draw[c].name)}</span><span class="sc"></span></div></div></div></div>`),i("teBracket").innerHTML=o.join("");for(const a of document.querySelectorAll("#teBracket .sd svg"))a.setAttribute("style","width:14px;height:14px")},play(){const t=m.matchOpts(z());if(!t){this.renderEvent();return}k.startCpu(t)},onMatchStart(t){if(!t||!t.tour||t.mode!=="cpu"||t.localIdx<0)return;const r=m.cpuFor(t.tour),o=g.players[1-t.localIdx],c=g.players[t.localIdx];if(!o||o.ctl!=="cpu")return;o.level=r.level,r.persona&&(o.persona=r.persona);const a=r.entrant;if(a&&!a.pro&&a.look&&o.avatar)try{const s=a.look,p=o.avatar;Z(s.shirt,c.avatar.kit.shirt)||(p.kit={...p.kit,shirt:s.shirt,accent:s.accent,band:s.band,design:s.design,pants:s.pants}),p.setLook({skin:s.skin,hair:s.hair,hairColor:s.hairColor,headwear:s.headwear,headband:s.headband,beard:s.beard,height:s.height}),A.bones=g.players.map(n=>Object.values(n.avatar.B))}catch(s){console.warn("[tour] opponent look",s)}},onScreen(t){const r=t==="over"&&g.mode==="cpu"&&g.cfg&&g.cfg.tour&&this.lastMatch&&this.lastMatch.tour===g.cfg.tour,o=i("btnTourNext"),c=i("btnRematch"),a=i("tourOverNote");if(o&&(o.hidden=!r,c.hidden=!!r,a.hidden=!r),r){const s=this.lastMatch,p=s.ended,n=s.tour;a.className=p&&!p.title?"out":"",a.textContent=p?p.title?`Champion of the ${n.name}! +${f(p.pts)} ranking points · ${C(p.fuzz)}`:`Out in the ${n.roundName.toLowerCase()} · +${f(p.pts)} ranking points · ${C(p.fuzz)}`:`Through to the ${S(n.rounds,n.round+1).toLowerCase()} of the ${n.name}`,o.textContent=p?"See the results":"Continue",p&&p.title&&T.emit("celebrate",{kind:"title"}),setTimeout(()=>{o.hidden||o.focus({preventScroll:!0})},0)}t==="menu"&&this.pendingEvent&&(this.pendingEvent=!1,setTimeout(()=>this.openEvent(),0))},leaveMatch(){this.lastMatch=null,k.lastCpuOpts=null,P.resume(),k.clearHud(),g.startAttract(),this.openEvent()}};const E=t=>`${B(t.surface)}, ${Q[t.tod]||B(t.tod)}`;
