/*! Palm Court (c) 2026. All rights reserved. */
import*as l from"three";import{GTAOPass as M}from"three/addons/postprocessing/GTAOPass.js";import{SMAAPass as B}from"three/addons/postprocessing/SMAAPass.js";import{FullScreenQuad as L}from"three/addons/postprocessing/Pass.js";import{FXAAShader as _}from"three/addons/shaders/FXAAShader.js";import{Settings as g}from"../core.js";import{dofGovern as O}from"./camfx.js";import{Bench as V,shouldRun as N,parsePick as F,packPick as y,startPreset as W,PRESET_ORDER as R,STORE_KEY as x,makeDeferrer as H}from"../perf-auto.js";export const canvas=document.getElementById("gl");const h={w:Math.max(1,innerWidth),h:Math.max(1,innerHeight)};function w(){return innerWidth>0&&innerHeight>0?(h.w=innerWidth,h.h=innerHeight,!0):!1}export const renderer=new l.WebGLRenderer({canvas,antialias:!1,stencil:!1,powerPreference:"high-performance"});renderer.setPixelRatio(1),renderer.setSize(h.w,h.h,!1),renderer.shadowMap.enabled=!0,renderer.shadowMap.type=l.PCFShadowMap,renderer.toneMapping=l.NeutralToneMapping,renderer.toneMappingExposure=1;export const scene=new l.Scene,camera=new l.PerspectiveCamera(48,h.w/h.h,.25,1400);camera.position.set(0,12,34),camera.lookAt(0,0,0);const p="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",j={uniforms:{tDiffuse:{value:null},tBloom:{value:null},tGlare:{value:null},uBloom:{value:0},uGlare:{value:0},uGlareTint:{value:new l.Vector3(1,1,1)},uExposure:{value:1},uTime:{value:0},uVignette:{value:.22},uSaturation:{value:1.06},uContrast:{value:1.04},uLift:{value:new l.Vector3(0,0,0)},uGain:{value:new l.Vector3(1,1,1)},uGrain:{value:.018},uAspect:{value:16/9},uTexel:{value:new l.Vector2(1/1280,1/720)},uSharpen:{value:.16},uPunch:{value:.2},uVibrance:{value:.12},uFilm:{value:0}},vertexShader:p,fragmentShader:`
    uniform sampler2D tDiffuse, tBloom, tGlare; uniform float uBloom, uGlare, uExposure, uTime, uVignette, uSaturation, uContrast, uGrain, uAspect;
    uniform vec3 uLift, uGain, uGlareTint; uniform vec2 uTexel; uniform float uSharpen, uPunch, uVibrance, uFilm;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    vec3 neutral(vec3 c) {   // Khronos PBR Neutral, as three's NeutralToneMapping
      float x = min(c.r, min(c.g, c.b)), off = x < 0.08 ? x - 6.25 * x * x : 0.04;
      c -= off;
      float peak = max(c.r, max(c.g, c.b));
      if (peak < 0.76) return c;
      float d = 0.24, np = 1.0 - d * d / (peak + d - 0.76);
      c *= np / peak;
      return mix(c, vec3(np), 1.0 - 1.0 / (0.15 * (peak - np) + 1.0));
    }
    vec3 srgb(vec3 c) { return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }
    vec3 display(vec3 c) { return srgb(clamp(neutral(max(c, 0.0) * uExposure), 0.0, 1.0)); }
    void main() {
      vec3 hdr = texture2D(tDiffuse, vUv).rgb, c = hdr;
      #ifdef BLOOM
      c += texture2D(tBloom, vUv).rgb * uBloom;
      #ifdef GLARE
      c += texture2D(tGlare, vUv).rgb * uGlare * uGlareTint;
      #endif
      #endif
      c = display(c);
      #ifdef SHARPEN
      // Contrast-adaptive sharpening (after AMD's CAS) in display space on the four neighbours: it lifts detail the
      // resolution scale and the AA filters soften (court lines, strings, faces, crowd) and backs off where a pixel
      // already sits near black or white, so there is no halo round the ball or the lines.
      {
        vec3 e = display(hdr), n = display(texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb), s = display(texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb);
        vec3 w = display(texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb), r = display(texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb);
        vec3 mn = min(min(min(n, s), min(w, r)), e), mx = max(max(max(n, s), max(w, r)), e);
        vec3 k = -sqrt(clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-3)), 0.0, 1.0)) * uSharpen;
        c += ((n + s + w + r) * k + e) / (1.0 + 4.0 * k) - e;
      }
      #endif
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);
      c = (c - 0.5) * uContrast + 0.5;
      c = mix(vec3(l), c, 1.0 + uVibrance * (1.0 - clamp(max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)), 0.0, 1.0)));   // vibrance: lifts the dull colours more than the strong ones
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), uPunch);   // an S-curve: deeper shadows and cleaner highlights, for punch
      c = c * uGain + uLift;
      if (uFilm > 0.0) {   // the replay look: a little less colour, warm highlights over cool shadows, a firmer S-curve
        float lf = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(lf), c, 1.0 - 0.2 * uFilm);
        c += uFilm * (vec3(0.03, 0.013, -0.024) * smoothstep(0.35, 1.0, lf) + vec3(-0.02, 0.004, 0.032) * (1.0 - smoothstep(0.0, 0.45, lf)));
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.3 * uFilm);
      }
      vec2 d = (vUv - 0.5) * vec2(uAspect / 1.55, 1.0);
      c *= mix(1.0 - uVignette - 0.2 * uFilm, 1.0, smoothstep(0.78, 0.2, length(d)));
      c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * uGrain * (1.0 + 2.2 * uFilm);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`},K={uniforms:{tDiffuse:{value:null},uTexel:{value:new l.Vector2},uThreshold:{value:1},uKnee:{value:.5}},vertexShader:p,fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uThreshold, uKnee; varying vec2 vUv;
    vec3 tap(vec2 o) { return min(texture2D(tDiffuse, vUv + o * uTexel).rgb, vec3(60.0)); }
    void main() {
      vec3 a = tap(vec2(-1.0, -1.0)), b = tap(vec2(1.0, -1.0)), c = tap(vec2(-1.0, 1.0)), d = tap(vec2(1.0, 1.0)), e = tap(vec2(0.0));
      #ifdef PREFILTER
      float wa = 1.0 / (1.0 + max(a.r, max(a.g, a.b))), wb = 1.0 / (1.0 + max(b.r, max(b.g, b.b))), wc = 1.0 / (1.0 + max(c.r, max(c.g, c.b)));
      float wd = 1.0 / (1.0 + max(d.r, max(d.g, d.b))), we = 4.0 / (1.0 + max(e.r, max(e.g, e.b)));
      vec3 col = (a * wa + b * wb + c * wc + d * wd + e * we) / (wa + wb + wc + wd + we);
      float br = max(col.r, max(col.g, col.b));
      float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
      soft = soft * soft / (4.0 * uKnee + 1e-4);
      col *= max(soft, br - uThreshold) / max(br, 1e-4);
      #else
      vec3 col = (a + b + c + d + e * 4.0) * 0.125;
      #endif
      gl_FragColor = vec4(col, 1.0);
    }`},I={uniforms:{tDiffuse:{value:null},tBase:{value:null},uTexel:{value:new l.Vector2},uSpread:{value:1}},vertexShader:p,fragmentShader:`
    uniform sampler2D tDiffuse, tBase; uniform vec2 uTexel; uniform float uSpread; varying vec2 vUv;
    void main() {   // 3x3 tent over the smaller level, added to this level's own downsample
      vec2 t = uTexel;
      vec3 s = texture2D(tDiffuse, vUv).rgb * 4.0;
      s += (texture2D(tDiffuse, vUv + vec2(-t.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(t.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, -t.y)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, t.y)).rgb) * 2.0;
      s += texture2D(tDiffuse, vUv - t).rgb + texture2D(tDiffuse, vUv + t).rgb + texture2D(tDiffuse, vUv + vec2(t.x, -t.y)).rgb + texture2D(tDiffuse, vUv + vec2(-t.x, t.y)).rgb;
      gl_FragColor = vec4(texture2D(tBase, vUv).rgb + s / 16.0 * uSpread, 1.0);
    }`},$={uniforms:{tDiffuse:{value:null},uTexel:{value:new l.Vector2},uStep:{value:1}},vertexShader:p,fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uStep; varying vec2 vUv;
    void main() {
      vec3 s = vec3(0.0); float tot = 0.0;
      for (int i = -6; i <= 6; i++) {
        float w = exp(-abs(float(i)) * 0.45);
        s += texture2D(tDiffuse, vUv + vec2(float(i) * uStep * uTexel.x, 0.0)).rgb * w; tot += w;
      }
      gl_FragColor = vec4(s / tot, 1.0);
    }`},q={uniforms:{tDiffuse:{value:null},uTexel:{value:new l.Vector2(1,1)}},vertexShader:p,fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 uTexel; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb * 4.0;
      c += texture2D(tDiffuse, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tDiffuse, vUv + uTexel * vec2(1.0, -1.0)).rgb;
      c += texture2D(tDiffuse, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tDiffuse, vUv + uTexel * vec2(1.0, 1.0)).rgb;
      gl_FragColor = vec4(c * 0.125, 1.0);
    }`},X={uniforms:{tDiffuse:{value:null},tDepth:{value:null},uRes:{value:new l.Vector2(1,1)},uFocus:{value:5},uAperture:{value:0},uMax:{value:14},cameraNear:{value:.25},cameraFar:{value:1400}},vertexShader:p,fragmentShader:`
    #include <packing>
    uniform sampler2D tDiffuse, tDepth; uniform vec2 uRes; uniform float uFocus, uAperture, uMax, cameraNear, cameraFar;
    varying vec2 vUv;
    float viewDist(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
    float blurSize(float z) { return clamp(uAperture * abs(z - uFocus) / max(z, 0.01), 0.0, uMax); }
    void main() {
      float cz = viewDist(vUv), cs = blurSize(cz);
      vec3 col = texture2D(tDiffuse, vUv).rgb;   // (between four full-resolution pixels: their average)
      float tot = 1.0, radius = 1.6;
      for (int i = 0; i < 40; i++) {
        if (radius >= uMax) break;
        float ang = float(i) * 2.39996323;
        vec2 tc = vUv + vec2(cos(ang), sin(ang)) * radius / uRes;
        vec3 sc = texture2D(tDiffuse, tc).rgb;
        float sz = viewDist(tc), ss = blurSize(sz);
        if (sz > cz) ss = clamp(ss, 0.0, cs * 2.0);
        float m = smoothstep(radius - 0.5, radius + 0.5, ss);
        col += mix(col / tot, sc, m);
        tot += 1.0;
        radius += 3.2 / radius;
      }
      gl_FragColor = vec4(col / tot, 1.0);
    }`},Z={uniforms:{tDiffuse:{value:null},tBlur:{value:null},tDepth:{value:null},uFocus:{value:5},uAperture:{value:0},uMax:{value:14},cameraNear:{value:.25},cameraFar:{value:1400}},vertexShader:p,fragmentShader:`
    #include <packing>
    uniform sampler2D tDiffuse, tBlur, tDepth; uniform float uFocus, uAperture, uMax, cameraNear, cameraFar;
    varying vec2 vUv;
    void main() {
      float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, cameraNear, cameraFar);
      float coc = clamp(uAperture * abs(z - uFocus) / max(z, 0.01), 0.0, uMax);
      gl_FragColor = vec4(mix(texture2D(tDiffuse, vUv).rgb, texture2D(tBlur, vUv).rgb, smoothstep(0.6, 2.5, coc)), 1.0);
    }`};export const PRESETS={low:{label:"Low",maxDpr:1,scale:.8,shadow:1024,radius:1.2,ao:!1,bloom:!1,samples:0,aa:"fxaa",sunCascade:0,floodShadow:0,crowd:.55,detail:0,sharpen:!1},medium:{label:"Medium",maxDpr:1.25,scale:1,shadow:2048,radius:1.6,ao:!1,bloom:!0,samples:2,aa:"smaa",sunCascade:1024,floodShadow:512,crowd:1,detail:1,sharpen:!0},high:{label:"High",maxDpr:1.5,scale:1,shadow:2048,radius:2,ao:!0,bloom:!0,samples:4,aa:"smaa",sunCascade:2048,floodShadow:1024,crowd:1,detail:2,sharpen:!0},ultra:{label:"Ultra",maxDpr:2,scale:1,shadow:4096,radius:2.6,ao:!0,bloom:!0,samples:4,aa:"smaa",sunCascade:2048,floodShadow:2048,crowd:1,detail:3,sharpen:!0}};let c=null;export const Perf={later:H(),scale:1,max:1,min:.5,avg:16.7,fps:60,lastAdjust:0,goodSince:0,gpu:"",software:!1,integrated:!1,preset:"high",detectGpu(){try{const e=renderer.getContext(),t=e.getExtension("WEBGL_debug_renderer_info");this.gpu=String(t&&e.getParameter(t.UNMASKED_RENDERER_WEBGL)||e.getParameter(e.RENDERER)||"")}catch{this.gpu=""}return this.saved=this.readSaved(),this.software=/swiftshader|llvmpipe|softpipe|software|basic render/i.test(this.gpu),this.integrated=/intel|iris|uhd|hd graphics|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|adreno|mali|powervr|apple m\d/i.test(this.gpu)&&!/rtx|gtx|radeon rx|arc a/i.test(this.gpu),this.software},gpuName(){const e=this.gpu.match(/ANGLE \([^,]*,\s*(.+?)\s*(?:\(0x[0-9a-f]+\))?\s*(?:Direct3D|OpenGL|Vulkan|Metal|,)/i);return(e?e[1]:this.gpu).replace(/\s+/g," ").trim()||"unknown graphics"},presetKey(){const e=g.gfx==="fast"?"low":g.gfx==="sharp"?"ultra":g.gfx;return PRESETS[e]?e:W(this.software?"low":this.integrated?"medium":"high",this.saved,this.cap)},saved:null,bench:null,benchPreset:"",autoPicked:null,autoWhy:"",autoListeners:[],onAuto(e){this.autoListeners.push(e)},readSaved(){try{return/[?&]perf=auto\b/.test(location.search)?null:F(localStorage.getItem(x))}catch{return null}},startAuto(){const e=(()=>{try{return/[?&]perf=auto\b/.test(location.search)}catch{return!1}})(),t=N({mode:this.mode(),software:this.software,preset:this.preset,forced:e,saved:this.saved,capped:this.cap<R.length,automated:!!(typeof navigator<"u"&&navigator.webdriver)});return this.autoWhy=t.reason,this.bench=t.run?new V:null,this.benchPreset=this.preset,t.run},autoStep(e,t){const s=performance.now();if(this.mode()!=="auto"||this.preset!==this.benchPreset){this.bench=null;return}this.bench.add(e,s,t&&!document.hidden);const a=this.bench.verdict(s,this.scale/this.max,this.preset);if(!a.done||(this.bench=null,this.autoWhy=a.reason,!a.change))return;const n=this.preset;this.cap=R.indexOf(a.to),this.autoPicked={from:n,to:a.to,reason:a.reason};try{localStorage.setItem(x,y(a.to)),this.saved=F(y(a.to))}catch{this.saved={preset:a.to,at:Date.now()}}console.info(`Palm Court: quick graphics check, ${n} to ${a.to} (${a.reason}).`),this.apply();for(const u of this.autoListeners)try{u(this.autoPicked)}catch(r){console.warn(r)}},gfxChanged(){try{localStorage.removeItem(x)}catch{}this.saved=null,this.bench=null,this.autoPicked=null,this.mode()==="auto"&&(this.cap=9);for(const e of this.autoListeners)try{e(null)}catch(t){console.warn(t)}},cap:9,bad:9,badAt:-1e9,upAt:-1e9,hold:3e4,slowSince:0,cfg(){return PRESETS[this.preset]},mode(){return g.gfx==="auto"||!PRESETS[g.gfx]?"auto":g.gfx},apply(){this.later.ask(()=>this.applyNow(),2)},applyNow(){this.preset=this.presetKey();const e=this.cfg(),t=window.devicePixelRatio||1;this.max=Math.min(t,e.maxDpr)*e.scale,this.min=Math.max(.45,this.max*.5),ee(e),this.setScale(this.mode()==="auto"?Math.min(this.max,1.25):this.max);for(const s of this.listeners)s(e);this.lastAdjust=performance.now()+2500,this.goodSince=0},listeners:[],onChange(e){this.listeners.push(e)},sections:null,profile(e=!0){return this.sections=e?{}:null,this},section(e,t){const s=this.sections[e]||(this.sections[e]={avg:t,mean:0,max:0,n:0,sum:0});s.avg+=(t-s.avg)*.05,s.sum+=t,s.n++,s.mean=s.sum/s.n,t>s.max&&(s.max=t)},info(){const e=renderer.info;return{preset:this.preset,scale:+this.scale.toFixed(2),calls:e.render.calls,triangles:e.render.triangles,programs:e.programs?e.programs.length:0,geometries:e.memory.geometries,textures:e.memory.textures}},setScale(e){this.scale=e,this.later.ask(()=>this.setScaleNow(),1)},setScaleNow(){const e=this.scale;w(),renderer.setPixelRatio(e),renderer.setSize(h.w,h.h,!1),c&&(c.setPixelRatio(e),c.setSize(h.w,h.h))},frame(e,t=!0,s=!1){this.later.hold(()=>this.judge(e,t,s))},judge(e,t,s){if(this.avg=this.avg*.92+Math.min(e,50)*.08,this.fps=1e3/this.avg,s){this.goodSince=this.slowSince=0;return}if(this.bench&&this.autoStep(e,t),this.mode()!=="auto")return;const a=performance.now();if(!(a<this.lastAdjust))if(this.avg>21)this.goodSince=0,this.scale>this.min+.01?(this.slowSince=0,a-this.lastAdjust>1200&&(a-this.upAt<1e4&&(this.hold=Math.min(3e5,this.hold*2)),this.bad=this.scale,this.badAt=a,this.setScale(Math.max(this.min,this.scale*.85)),this.lastAdjust=a)):this.avg>24&&this.preset!=="low"?(this.slowSince||(this.slowSince=a),t&&a-this.slowSince>4e3&&(this.cap=Object.keys(PRESETS).indexOf(this.preset)-1,this.slowSince=0,console.warn(`Palm Court: graphics too slow, auto quality steps down to ${PRESETS[Object.keys(PRESETS)[this.cap]].label}.`),this.apply())):this.slowSince=0;else if(this.avg<17.8){this.slowSince=0,this.goodSince||(this.goodSince=a);const n=Math.min(this.max,this.scale*1.1,a-this.badAt<this.hold?this.bad*.95:1/0);a-this.goodSince>5e3&&a-this.lastAdjust>5e3&&n>this.scale+.01&&(this.setScale(n),this.lastAdjust=this.upAt=a,this.goodSince=a)}else this.goodSince=this.slowSince=0}};const Q=new l.Scene;function b(e){const t=renderer.getContext();if(t.isContextLost())return!1;for(let s=0;s<16&&t.getError()!==t.NO_ERROR;s++);try{renderer.setRenderTarget(e);let s=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;renderer.render(Q,camera);const a=renderer.properties.get(e).__webglFramebuffer;return s&&e.samples>0&&a&&(renderer.state.bindFramebuffer(t.FRAMEBUFFER,a),s=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE),renderer.setRenderTarget(null),s&&t.getError()===t.NO_ERROR}catch{try{renderer.setRenderTarget(null)}catch{}return!1}}const E=new L(null);function f(e,t){renderer.setRenderTarget(t),E.material=e,E.render(renderer)}const m=(e,t={})=>new l.ShaderMaterial({uniforms:l.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,defines:t,depthTest:!1,depthWrite:!1,blending:l.NoBlending,toneMapped:!1}),v=(e,t)=>new l.WebGLRenderTarget(e,t,{type:l.HalfFloatType,depthBuffer:!1});class Y{constructor(t){this.p=t,this.pr=renderer.getPixelRatio(),this.w=h.w,this.h=h.h;const[s,a]=this.px(),n=[[t.samples,!0],[t.samples,!1],[0,!0],[0,!1]].filter(([u],r,i)=>r<2||u!==i[0][0]);for(const[u,r]of n){const i=new l.WebGLRenderTarget(s,a,{type:l.HalfFloatType,samples:u,depthTexture:r?new l.DepthTexture(s,a):null});if(b(i)){this.scene=i;break}i.dispose()}if(this.a=v(s,a),this.b=v(s,a),!this.scene||!b(this.a)){console.warn("Palm Court: this GPU cannot render into half-float targets; drawing without post-processing."),this.direct=!0,this.dispose();return}(this.scene.samples!==t.samples||!this.scene.depthTexture)&&console.warn(`Palm Court: scene target fell back to ${this.scene.samples}x MSAA${this.scene.depthTexture?"":", no depth of field"}.`),t.ao&&this.makeAO(s,a),this.scene.depthTexture&&t.detail>=1&&(this.dof=m(X),this.dof.uniforms.tDepth.value=this.scene.depthTexture,this.dofMix=m(Z),this.dofMix.uniforms.tDepth.value=this.scene.depthTexture,this.dofDown=m(q),this.dofS=v(1,1),this.dofT=v(1,1)),t.bloom&&this.makeBloom(),this.final=m(j,{...t.bloom?{BLOOM:"",GLARE:""}:{},...t.sharpen?{SHARPEN:""}:{}}),t.aa==="smaa"?(this.smaa=new B,t.detail>=2&&(this.smaa._materialEdges.defines.SMAA_THRESHOLD="0.05",this.smaa._materialWeights.defines.SMAA_MAX_SEARCH_STEPS="16")):t.aa==="fxaa"&&(this.fxaa=m(_)),this.setSize(this.w,this.h)}px(){return[Math.max(1,Math.floor(this.w*this.pr)),Math.max(1,Math.floor(this.h*this.pr))]}makeAO(t,s){const a=new M(scene,camera,t,s);if(!b(a.normalRenderTarget)){a.dispose();return}a.output=M.OUTPUT.Default,a.blendIntensity=.85,a.updateGtaoMaterial({radius:.5,distanceExponent:1.6,thickness:1,scale:1,samples:this.p.detail>=3?16:12,distanceFallOff:1}),a.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});const n=a.setSize.bind(a),u=this.p.detail>=3?.75:.5;a.setSize=(i,o)=>n(Math.max(1,Math.round(i*u)),Math.max(1,Math.round(o*u)));const r=a._overrideVisibility.bind(a);a._overrideVisibility=function(){r();const i=this._visibilityCache;this.scene.traverse(o=>{if(!o.visible)return;const d=o.material;(o.userData.noAO||d&&d.transparent&&!d.depthWrite)&&(o.visible=!1,i.push(o))})},this.ao=a}makeBloom(){this.down=[],this.up=[],this.downMat=[],this.upMat=[];for(let t=0;t<6;t++)this.down.push(v(1,1)),this.up.push(v(1,1)),this.downMat.push(m(K,t===0?{PREFILTER:""}:{})),this.upMat.push(m(I));this.glareT=[v(1,1),v(1,1)],this.glareMat=m($)}setPixelRatio(t){this.pr=t,this.setSize(this.w,this.h)}setSize(t,s){if(this.w=t,this.h=s,this.direct)return;const[a,n]=this.px();if(this.scene.setSize(a,n),this.a.setSize(a,n),this.b.setSize(a,n),this.dofT&&(this.dofS.setSize(Math.max(1,a>>1),Math.max(1,n>>1)),this.dofT.setSize(Math.max(1,a>>1),Math.max(1,n>>1))),this.ao&&this.ao.setSize(a,n),this.down){let u=a,r=n;for(let i=0;i<this.down.length;i++)if(u=Math.max(1,u>>1),r=Math.max(1,r>>1),this.down[i].setSize(u,r),this.up[i].setSize(u,r),i===2)for(const o of this.glareT)o.setSize(u,r)}if(this.smaa&&this.smaa.setSize(a,n),this.fxaa&&this.fxaa.uniforms.resolution.value.set(1/a,1/n),this.final.uniforms.uAspect.value=a/n,this.final.uniforms.uTexel.value.set(1/a,1/n),renderer.initRenderTarget)for(const u of[this.a,this.b,this.dofS,this.dofT])u&&renderer.initRenderTarget(u)}bloom(t){const s=this.down.length;let a=t,n=J.set(1/this.scene.width,1/this.scene.height);for(let r=0;r<s;r++){const i=this.downMat[r],o=i.uniforms;o.tDiffuse.value=a,o.uTexel.value.copy(n),r===0&&(o.uThreshold.value=Look.bloomThreshold,o.uKnee.value=Look.bloomThreshold*.5),f(i,this.down[r]),a=this.down[r].texture,n.set(1/this.down[r].width,1/this.down[r].height)}let u=this.down[s-1];for(let r=s-2;r>=0;r--){const i=this.upMat[r],o=i.uniforms;o.tDiffuse.value=u.texture,o.tBase.value=this.down[r].texture,o.uTexel.value.set(1/u.width,1/u.height),o.uSpread.value=Look.bloomSpread,f(i,this.up[r]),u=this.up[r]}if(Look.glare>0){const r=this.glareMat.uniforms,i=this.glareT;r.tDiffuse.value=this.up[2].texture,r.uTexel.value.set(1/i[0].width,1/i[0].height),r.uStep.value=1.5,f(this.glareMat,i[0]),r.tDiffuse.value=i[0].texture,r.uStep.value=7,f(this.glareMat,i[1])}return u.texture}render(t){const s=renderer;if(this.direct){s.setRenderTarget(null),s.render(scene,camera);return}s.setRenderTarget(this.scene),s.render(scene,camera);let a=this.scene;const n=()=>a===this.a?this.b:this.a;if(this.ao){const o=n();this.ao.render(s,o,a),a=o}const u=!!this.dof&&Look.dofAperture>0,r=O(Look.dofGov,u,Perf.avg,Math.min(50,Perf.avg));if(u&&r>.02){const o=n();this.depthOfField(a,r,o),a=o}const i=this.final.uniforms;if(i.tDiffuse.value=a.texture,i.uTime.value=t||0,i.uExposure.value=s.toneMappingExposure,this.down&&(i.tBloom.value=this.bloom(a.texture),i.uBloom.value=Look.bloom,i.uGlare.value=Look.glare,i.tGlare.value=this.glareT[1].texture),this.smaa||this.fxaa){const o=n();f(this.final,o),this.smaa?(this.smaa.renderToScreen=!0,this.smaa.render(s,null,o)):(this.fxaa.uniforms.tDiffuse.value=o.texture,f(this.fxaa,null))}else f(this.final,null)}depthOfField(t,s,a){const n=this.scene.height/720,u=Look.dofAperture*s*n,r=Math.min(26,14*n),i=this.dof.uniforms,o=this.dofMix.uniforms,d=this.dofDown.uniforms;d.tDiffuse.value=t.texture,d.uTexel.value.set(1/this.scene.width,1/this.scene.height),f(this.dofDown,this.dofS),i.tDiffuse.value=this.dofS.texture,i.uRes.value.set(this.scene.width,this.scene.height),i.uFocus.value=o.uFocus.value=Look.dofFocus,i.uAperture.value=o.uAperture.value=u,i.uMax.value=o.uMax.value=r,i.cameraNear.value=o.cameraNear.value=camera.near,i.cameraFar.value=o.cameraFar.value=camera.far,f(this.dof,this.dofT),o.tDiffuse.value=t.texture,o.tBlur.value=this.dofT.texture,f(this.dofMix,a)}warm(){if(!(!this.dof||this.direct)){try{this.depthOfField(this.a,1,this.b)}catch(t){console.warn("Palm Court: depth-of-field warm-up skipped:",t)}renderer.setRenderTarget(null)}}dispose(){for(const t of[this.scene,this.a,this.b,this.dofS,this.dofT,...this.down||[],...this.up||[],...this.glareT||[]])t&&t.dispose();for(const t of[this.dof,this.dofMix,this.dofDown,this.final,this.fxaa,this.glareMat,...this.downMat||[],...this.upMat||[]])t&&t.dispose();this.ao&&this.ao.dispose(),this.smaa&&this.smaa.dispose()}}const J=new l.Vector2;function ee(e){c&&c.dispose(),w(),c=new Y(e),c.warm(),S()}export const Look={film:0,dofFocus:5,dofAperture:0,dofGov:{f:1,late:0,latched:!1},bloom:.2,bloomThreshold:2.5,bloomSpread:.8,glare:0,glareTint:[.8,.9,1],dof(e,t=0){this.dofFocus=e,this.dofAperture=t},setFilm(e){this.film=e,c&&c.final&&(c.final.uniforms.uFilm.value=e)},set(e={}){const{bloom:t=.2,bloomThreshold:s=2.5,bloomSpread:a=.8,glare:n=0,glareTint:u=[.8,.9,1],exposure:r=1,saturation:i=1.06,contrast:o=1.04,vignette:d=.22,gain:U=[1,1,1],lift:k=[0,0,0],grain:C=.018,punch:G=.2,vibrance:z=.12}=e;this.last=e,renderer.toneMappingExposure=r,Object.assign(this,{bloom:t,bloomThreshold:s,bloomSpread:a,glare:n,glareTint:u}),this.grade={saturation:i,contrast:o,vignette:d,gain:U,lift:k,grain:C,punch:G,vibrance:z},S()}};function S(){if(!c||!c.final||!Look.grade)return;const e=c.final.uniforms,t=Look.grade;e.uSaturation.value=t.saturation,e.uContrast.value=t.contrast,e.uVignette.value=t.vignette,e.uGrain.value=t.grain,e.uPunch.value=t.punch,e.uVibrance.value=t.vibrance,e.uGain.value.set(...t.gain),e.uLift.value.set(...t.lift),e.uGlareTint.value.set(...Look.glareTint),e.uFilm.value=Look.film}Perf.onChange(()=>S());let D=!1,T=window.devicePixelRatio||1;export function render(e){!innerWidth||!innerHeight||D||!c||(Perf.later.flush(),(innerWidth!==h.w||innerHeight!==h.h||(window.devicePixelRatio||1)!==T)&&A(),c.render(e))}function A(){if(!w())return;camera.aspect=h.w/h.h,camera.updateProjectionMatrix(),renderer.setSize(h.w,h.h,!1),c&&c.setSize(h.w,h.h);const e=window.devicePixelRatio||1;e!==T&&(T=e,Perf.apply())}addEventListener("resize",A);const P=[];export function onContextRestored(e){P.push(e)}canvas.addEventListener("webglcontextlost",e=>{e.preventDefault(),D=!0,console.warn("Palm Court: WebGL context lost, waiting for it to come back.")}),canvas.addEventListener("webglcontextrestored",()=>{D=!1,console.warn("Palm Court: WebGL context restored.");try{Perf.apply();for(const e of P)e()}catch(e){console.error(e)}});
