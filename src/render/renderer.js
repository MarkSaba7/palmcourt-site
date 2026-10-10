/*! Palm Court (c) 2026. All rights reserved. */
import*as l from"three";import{GTAOPass as T}from"three/addons/postprocessing/GTAOPass.js";import{SMAAPass as G}from"three/addons/postprocessing/SMAAPass.js";import{FullScreenQuad as C}from"three/addons/postprocessing/Pass.js";import{FXAAShader as k}from"three/addons/shaders/FXAAShader.js";import{Settings as d}from"../core.js";export const canvas=document.getElementById("gl");const h={w:Math.max(1,innerWidth),h:Math.max(1,innerHeight)};function x(){return innerWidth>0&&innerHeight>0?(h.w=innerWidth,h.h=innerHeight,!0):!1}export const renderer=new l.WebGLRenderer({canvas,antialias:!1,stencil:!1,powerPreference:"high-performance"});renderer.setPixelRatio(1),renderer.setSize(h.w,h.h,!1),renderer.shadowMap.enabled=!0,renderer.shadowMap.type=l.PCFShadowMap,renderer.toneMapping=l.NeutralToneMapping,renderer.toneMappingExposure=1;export const scene=new l.Scene,camera=new l.PerspectiveCamera(48,h.w/h.h,.25,1400);camera.position.set(0,12,34),camera.lookAt(0,0,0);const g="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",z={uniforms:{tDiffuse:{value:null},tBloom:{value:null},tGlare:{value:null},uBloom:{value:0},uGlare:{value:0},uGlareTint:{value:new l.Vector3(1,1,1)},uExposure:{value:1},uTime:{value:0},uVignette:{value:.22},uSaturation:{value:1.06},uContrast:{value:1.04},uLift:{value:new l.Vector3(0,0,0)},uGain:{value:new l.Vector3(1,1,1)},uGrain:{value:.018},uAspect:{value:16/9},uTexel:{value:new l.Vector2(1/1280,1/720)},uSharpen:{value:.16},uPunch:{value:.2},uVibrance:{value:.12},uFilm:{value:0}},vertexShader:g,fragmentShader:`
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
    }`},B={uniforms:{tDiffuse:{value:null},uTexel:{value:new l.Vector2},uThreshold:{value:1},uKnee:{value:.5}},vertexShader:g,fragmentShader:`
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
    }`},L={uniforms:{tDiffuse:{value:null},tBase:{value:null},uTexel:{value:new l.Vector2},uSpread:{value:1}},vertexShader:g,fragmentShader:`
    uniform sampler2D tDiffuse, tBase; uniform vec2 uTexel; uniform float uSpread; varying vec2 vUv;
    void main() {   // 3x3 tent over the smaller level, added to this level's own downsample
      vec2 t = uTexel;
      vec3 s = texture2D(tDiffuse, vUv).rgb * 4.0;
      s += (texture2D(tDiffuse, vUv + vec2(-t.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(t.x, 0.0)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, -t.y)).rgb + texture2D(tDiffuse, vUv + vec2(0.0, t.y)).rgb) * 2.0;
      s += texture2D(tDiffuse, vUv - t).rgb + texture2D(tDiffuse, vUv + t).rgb + texture2D(tDiffuse, vUv + vec2(t.x, -t.y)).rgb + texture2D(tDiffuse, vUv + vec2(-t.x, t.y)).rgb;
      gl_FragColor = vec4(texture2D(tBase, vUv).rgb + s / 16.0 * uSpread, 1.0);
    }`},_={uniforms:{tDiffuse:{value:null},uTexel:{value:new l.Vector2},uStep:{value:1}},vertexShader:g,fragmentShader:`
    uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uStep; varying vec2 vUv;
    void main() {
      vec3 s = vec3(0.0); float tot = 0.0;
      for (int i = -6; i <= 6; i++) {
        float w = exp(-abs(float(i)) * 0.45);
        s += texture2D(tDiffuse, vUv + vec2(float(i) * uStep * uTexel.x, 0.0)).rgb * w; tot += w;
      }
      gl_FragColor = vec4(s / tot, 1.0);
    }`},O={uniforms:{tDiffuse:{value:null},tDepth:{value:null},uRes:{value:new l.Vector2(1,1)},uFocus:{value:5},uAperture:{value:0},uMax:{value:14},cameraNear:{value:.25},cameraFar:{value:1400}},vertexShader:g,fragmentShader:`
    #include <packing>
    uniform sampler2D tDiffuse, tDepth; uniform vec2 uRes; uniform float uFocus, uAperture, uMax, cameraNear, cameraFar;
    varying vec2 vUv;
    float viewDist(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
    float blurSize(float z) { return clamp(uAperture * abs(z - uFocus) / max(z, 0.01), 0.0, uMax); }
    void main() {
      float cz = viewDist(vUv), cs = blurSize(cz);
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      float tot = 1.0, radius = 1.6;
      for (int i = 0; i < 80; i++) {
        if (radius >= uMax) break;
        float ang = float(i) * 2.39996323;
        vec2 tc = vUv + vec2(cos(ang), sin(ang)) * radius / uRes;
        vec3 sc = texture2D(tDiffuse, tc).rgb;
        float sz = viewDist(tc), ss = blurSize(sz);
        if (sz > cz) ss = clamp(ss, 0.0, cs * 2.0);
        float m = smoothstep(radius - 0.5, radius + 0.5, ss);
        col += mix(col / tot, sc, m);
        tot += 1.0;
        radius += 1.6 / radius;
      }
      gl_FragColor = vec4(col / tot, 1.0);
    }`};export const PRESETS={low:{label:"Low",maxDpr:1,scale:.8,shadow:1024,radius:1.2,ao:!1,bloom:!1,samples:0,aa:"fxaa",sunCascade:0,floodShadow:0,crowd:.55,detail:0,sharpen:!1},medium:{label:"Medium",maxDpr:1.25,scale:1,shadow:2048,radius:1.6,ao:!1,bloom:!0,samples:2,aa:"smaa",sunCascade:1024,floodShadow:512,crowd:1,detail:1,sharpen:!0},high:{label:"High",maxDpr:1.5,scale:1,shadow:2048,radius:2,ao:!0,bloom:!0,samples:4,aa:"smaa",sunCascade:2048,floodShadow:1024,crowd:1,detail:2,sharpen:!0},ultra:{label:"Ultra",maxDpr:2,scale:1,shadow:4096,radius:2.6,ao:!0,bloom:!0,samples:4,aa:"smaa",sunCascade:2048,floodShadow:2048,crowd:1,detail:3,sharpen:!0}};let c=null;export const Perf={scale:1,max:1,min:.5,avg:16.7,fps:60,lastAdjust:0,goodSince:0,gpu:"",software:!1,integrated:!1,preset:"high",detectGpu(){try{const e=renderer.getContext(),t=e.getExtension("WEBGL_debug_renderer_info");this.gpu=String(t&&e.getParameter(t.UNMASKED_RENDERER_WEBGL)||e.getParameter(e.RENDERER)||"")}catch{this.gpu=""}return this.software=/swiftshader|llvmpipe|softpipe|software|basic render/i.test(this.gpu),this.integrated=/intel|iris|uhd|hd graphics|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics|adreno|mali|powervr|apple m\d/i.test(this.gpu)&&!/rtx|gtx|radeon rx|arc a/i.test(this.gpu),this.software},gpuName(){const e=this.gpu.match(/ANGLE \([^,]*,\s*(.+?)\s*(?:\(0x[0-9a-f]+\))?\s*(?:Direct3D|OpenGL|Vulkan|Metal|,)/i);return(e?e[1]:this.gpu).replace(/\s+/g," ").trim()||"unknown graphics"},presetKey(){const e=d.gfx==="fast"?"low":d.gfx==="sharp"?"ultra":d.gfx;if(PRESETS[e])return e;const t=this.software?"low":this.integrated?"medium":"high",a=Object.keys(PRESETS);return a[Math.min(a.indexOf(t),this.cap)]},cap:9,bad:9,badAt:-1e9,upAt:-1e9,hold:3e4,slowSince:0,cfg(){return PRESETS[this.preset]},mode(){return d.gfx==="auto"||!PRESETS[d.gfx]?"auto":d.gfx},apply(){this.preset=this.presetKey();const e=this.cfg(),t=window.devicePixelRatio||1;this.max=Math.min(t,e.maxDpr)*e.scale,this.min=Math.max(.45,this.max*.5),H(e),this.setScale(this.mode()==="auto"?Math.min(this.max,1.25):this.max);for(const a of this.listeners)a(e);this.lastAdjust=performance.now()+2500,this.goodSince=0},listeners:[],onChange(e){this.listeners.push(e)},sections:null,profile(e=!0){return this.sections=e?{}:null,this},section(e,t){const a=this.sections[e]||(this.sections[e]={avg:t,mean:0,max:0,n:0,sum:0});a.avg+=(t-a.avg)*.05,a.sum+=t,a.n++,a.mean=a.sum/a.n,t>a.max&&(a.max=t)},info(){const e=renderer.info;return{preset:this.preset,scale:+this.scale.toFixed(2),calls:e.render.calls,triangles:e.render.triangles,programs:e.programs?e.programs.length:0,geometries:e.memory.geometries,textures:e.memory.textures}},setScale(e){this.scale=e,x(),renderer.setPixelRatio(e),renderer.setSize(h.w,h.h,!1),c&&(c.setPixelRatio(e),c.setSize(h.w,h.h))},frame(e,t=!0){if(this.avg=this.avg*.92+Math.min(e,50)*.08,this.fps=1e3/this.avg,this.mode()!=="auto")return;const a=performance.now();if(!(a<this.lastAdjust))if(this.avg>21)this.goodSince=0,this.scale>this.min+.01?(this.slowSince=0,a-this.lastAdjust>1200&&(a-this.upAt<1e4&&(this.hold=Math.min(3e5,this.hold*2)),this.bad=this.scale,this.badAt=a,this.setScale(Math.max(this.min,this.scale*.85)),this.lastAdjust=a)):this.avg>24&&this.preset!=="low"?(this.slowSince||(this.slowSince=a),t&&a-this.slowSince>4e3&&(this.cap=Object.keys(PRESETS).indexOf(this.preset)-1,this.slowSince=0,console.warn(`Palm Court: graphics too slow, auto quality steps down to ${PRESETS[Object.keys(PRESETS)[this.cap]].label}.`),this.apply())):this.slowSince=0;else if(this.avg<17.8){this.slowSince=0,this.goodSince||(this.goodSince=a);const i=Math.min(this.max,this.scale*1.1,a-this.badAt<this.hold?this.bad*.95:1/0);a-this.goodSince>5e3&&a-this.lastAdjust>5e3&&i>this.scale+.01&&(this.setScale(i),this.lastAdjust=this.upAt=a,this.goodSince=a)}else this.goodSince=this.slowSince=0}};const V=new l.Scene;function w(e){const t=renderer.getContext();if(t.isContextLost())return!1;for(let a=0;a<16&&t.getError()!==t.NO_ERROR;a++);try{renderer.setRenderTarget(e);let a=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;renderer.render(V,camera);const i=renderer.properties.get(e).__webglFramebuffer;return a&&e.samples>0&&i&&(renderer.state.bindFramebuffer(t.FRAMEBUFFER,i),a=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE),renderer.setRenderTarget(null),a&&t.getError()===t.NO_ERROR}catch{try{renderer.setRenderTarget(null)}catch{}return!1}}const M=new C(null);function f(e,t){renderer.setRenderTarget(t),M.material=e,M.render(renderer)}const m=(e,t={})=>new l.ShaderMaterial({uniforms:l.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,defines:t,depthTest:!1,depthWrite:!1,blending:l.NoBlending,toneMapped:!1}),p=(e,t)=>new l.WebGLRenderTarget(e,t,{type:l.HalfFloatType,depthBuffer:!1});class N{constructor(t){this.p=t,this.pr=renderer.getPixelRatio(),this.w=h.w,this.h=h.h;const[a,i]=this.px(),u=[[t.samples,!0],[t.samples,!1],[0,!0],[0,!1]].filter(([o],s,r)=>s<2||o!==r[0][0]);for(const[o,s]of u){const r=new l.WebGLRenderTarget(a,i,{type:l.HalfFloatType,samples:o,depthTexture:s?new l.DepthTexture(a,i):null});if(w(r)){this.scene=r;break}r.dispose()}if(this.a=p(a,i),this.b=p(a,i),!this.scene||!w(this.a)){console.warn("Palm Court: this GPU cannot render into half-float targets; drawing without post-processing."),this.direct=!0,this.dispose();return}(this.scene.samples!==t.samples||!this.scene.depthTexture)&&console.warn(`Palm Court: scene target fell back to ${this.scene.samples}x MSAA${this.scene.depthTexture?"":", no depth of field"}.`),t.ao&&this.makeAO(a,i),this.scene.depthTexture&&t.detail>=1&&(this.dof=m(O),this.dof.uniforms.tDepth.value=this.scene.depthTexture),t.bloom&&this.makeBloom(),this.final=m(z,{...t.bloom?{BLOOM:"",GLARE:""}:{},...t.sharpen?{SHARPEN:""}:{}}),t.aa==="smaa"?(this.smaa=new G,t.detail>=2&&(this.smaa._materialEdges.defines.SMAA_THRESHOLD="0.05",this.smaa._materialWeights.defines.SMAA_MAX_SEARCH_STEPS="16")):t.aa==="fxaa"&&(this.fxaa=m(k)),this.setSize(this.w,this.h)}px(){return[Math.max(1,Math.floor(this.w*this.pr)),Math.max(1,Math.floor(this.h*this.pr))]}makeAO(t,a){const i=new T(scene,camera,t,a);if(!w(i.normalRenderTarget)){i.dispose();return}i.output=T.OUTPUT.Default,i.blendIntensity=.85,i.updateGtaoMaterial({radius:.5,distanceExponent:1.6,thickness:1,scale:1,samples:this.p.detail>=3?16:12,distanceFallOff:1}),i.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});const u=i.setSize.bind(i),o=this.p.detail>=3?.75:.5;i.setSize=(r,n)=>u(Math.max(1,Math.round(r*o)),Math.max(1,Math.round(n*o)));const s=i._overrideVisibility.bind(i);i._overrideVisibility=function(){s();const r=this._visibilityCache;this.scene.traverse(n=>{if(!n.visible)return;const v=n.material;(n.userData.noAO||v&&v.transparent&&!v.depthWrite)&&(n.visible=!1,r.push(n))})},this.ao=i}makeBloom(){this.down=[],this.up=[],this.downMat=[],this.upMat=[];for(let t=0;t<6;t++)this.down.push(p(1,1)),this.up.push(p(1,1)),this.downMat.push(m(B,t===0?{PREFILTER:""}:{})),this.upMat.push(m(L));this.glareT=[p(1,1),p(1,1)],this.glareMat=m(_)}setPixelRatio(t){this.pr=t,this.setSize(this.w,this.h)}setSize(t,a){if(this.w=t,this.h=a,this.direct)return;const[i,u]=this.px();if(this.scene.setSize(i,u),this.a.setSize(i,u),this.b.setSize(i,u),this.ao&&this.ao.setSize(i,u),this.down){let o=i,s=u;for(let r=0;r<this.down.length;r++)if(o=Math.max(1,o>>1),s=Math.max(1,s>>1),this.down[r].setSize(o,s),this.up[r].setSize(o,s),r===2)for(const n of this.glareT)n.setSize(o,s)}this.smaa&&this.smaa.setSize(i,u),this.fxaa&&this.fxaa.uniforms.resolution.value.set(1/i,1/u),this.final.uniforms.uAspect.value=i/u,this.final.uniforms.uTexel.value.set(1/i,1/u)}bloom(t){const a=this.down.length;let i=t,u=W.set(1/this.scene.width,1/this.scene.height);for(let s=0;s<a;s++){const r=this.downMat[s],n=r.uniforms;n.tDiffuse.value=i,n.uTexel.value.copy(u),s===0&&(n.uThreshold.value=Look.bloomThreshold,n.uKnee.value=Look.bloomThreshold*.5),f(r,this.down[s]),i=this.down[s].texture,u.set(1/this.down[s].width,1/this.down[s].height)}let o=this.down[a-1];for(let s=a-2;s>=0;s--){const r=this.upMat[s],n=r.uniforms;n.tDiffuse.value=o.texture,n.tBase.value=this.down[s].texture,n.uTexel.value.set(1/o.width,1/o.height),n.uSpread.value=Look.bloomSpread,f(r,this.up[s]),o=this.up[s]}if(Look.glare>0){const s=this.glareMat.uniforms,r=this.glareT;s.tDiffuse.value=this.up[2].texture,s.uTexel.value.set(1/r[0].width,1/r[0].height),s.uStep.value=1.5,f(this.glareMat,r[0]),s.tDiffuse.value=r[0].texture,s.uStep.value=7,f(this.glareMat,r[1])}return o.texture}render(t){const a=renderer;if(this.direct){a.setRenderTarget(null),a.render(scene,camera);return}a.setRenderTarget(this.scene),a.render(scene,camera);let i=this.scene;const u=()=>i===this.a?this.b:this.a;if(this.ao){const s=u();this.ao.render(a,s,i),i=s}if(this.dof&&Look.dofAperture>0){const s=this.dof.uniforms,r=this.scene.height/720;s.tDiffuse.value=i.texture,s.uRes.value.set(this.scene.width,this.scene.height),s.uFocus.value=Look.dofFocus,s.uAperture.value=Look.dofAperture*r,s.uMax.value=Math.min(26,14*r),s.cameraNear.value=camera.near,s.cameraFar.value=camera.far;const n=u();f(this.dof,n),i=n}const o=this.final.uniforms;if(o.tDiffuse.value=i.texture,o.uTime.value=t||0,o.uExposure.value=a.toneMappingExposure,this.down&&(o.tBloom.value=this.bloom(i.texture),o.uBloom.value=Look.bloom,o.uGlare.value=Look.glare,o.tGlare.value=this.glareT[1].texture),this.smaa||this.fxaa){const s=u();f(this.final,s),this.smaa?(this.smaa.renderToScreen=!0,this.smaa.render(a,null,s)):(this.fxaa.uniforms.tDiffuse.value=s.texture,f(this.fxaa,null))}else f(this.final,null)}dispose(){for(const t of[this.scene,this.a,this.b,...this.down||[],...this.up||[],...this.glareT||[]])t&&t.dispose();for(const t of[this.dof,this.final,this.fxaa,this.glareMat,...this.downMat||[],...this.upMat||[]])t&&t.dispose();this.ao&&this.ao.dispose(),this.smaa&&this.smaa.dispose()}}const W=new l.Vector2;function H(e){c&&c.dispose(),x(),c=new N(e),b()}export const Look={film:0,dofFocus:5,dofAperture:0,bloom:.2,bloomThreshold:2.5,bloomSpread:.8,glare:0,glareTint:[.8,.9,1],dof(e,t=0){this.dofFocus=e,this.dofAperture=t},setFilm(e){this.film=e,c&&c.final&&(c.final.uniforms.uFilm.value=e)},set(e={}){const{bloom:t=.2,bloomThreshold:a=2.5,bloomSpread:i=.8,glare:u=0,glareTint:o=[.8,.9,1],exposure:s=1,saturation:r=1.06,contrast:n=1.04,vignette:v=.22,gain:A=[1,1,1],lift:F=[0,0,0],grain:y=.018,punch:P=.2,vibrance:U=.12}=e;this.last=e,renderer.toneMappingExposure=s,Object.assign(this,{bloom:t,bloomThreshold:a,bloomSpread:i,glare:u,glareTint:o}),this.grade={saturation:r,contrast:n,vignette:v,gain:A,lift:F,grain:y,punch:P,vibrance:U},b()}};function b(){if(!c||!c.final||!Look.grade)return;const e=c.final.uniforms,t=Look.grade;e.uSaturation.value=t.saturation,e.uContrast.value=t.contrast,e.uVignette.value=t.vignette,e.uGrain.value=t.grain,e.uPunch.value=t.punch,e.uVibrance.value=t.vibrance,e.uGain.value.set(...t.gain),e.uLift.value.set(...t.lift),e.uGlareTint.value.set(...Look.glareTint),e.uFilm.value=Look.film}Perf.onChange(()=>b());let S=!1,D=window.devicePixelRatio||1;export function render(e){!innerWidth||!innerHeight||S||!c||((innerWidth!==h.w||innerHeight!==h.h||(window.devicePixelRatio||1)!==D)&&R(),c.render(e))}function R(){if(!x())return;camera.aspect=h.w/h.h,camera.updateProjectionMatrix(),renderer.setSize(h.w,h.h,!1),c&&c.setSize(h.w,h.h);const e=window.devicePixelRatio||1;e!==D&&(D=e,Perf.apply())}addEventListener("resize",R);const E=[];export function onContextRestored(e){E.push(e)}canvas.addEventListener("webglcontextlost",e=>{e.preventDefault(),S=!0,console.warn("Palm Court: WebGL context lost, waiting for it to come back.")}),canvas.addEventListener("webglcontextrestored",()=>{S=!1,console.warn("Palm Court: WebGL context restored.");try{Perf.apply();for(const e of E)e()}catch(e){console.error(e)}});
