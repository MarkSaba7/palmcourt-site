/*! Palm Court (c) 2026. All rights reserved. */
const r=new Map,c={on(t,e){return r.has(t)||r.set(t,new Set),r.get(t).add(e),()=>r.get(t).delete(e)},once(t,e){const o=this.on(t,s=>{o(),e(s)});return o},emit(t,e){const o=r.get(t);if(o)for(const s of[...o])try{s(e)}catch(n){console.error(`[bus] ${t} handler failed`,n)}}};export{c as Bus};
