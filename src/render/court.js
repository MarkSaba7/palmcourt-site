/*! Palm Court (c) 2026. All rights reserved. */
import*as n from"three";import{COURT as O,netHeight as $,lerp as U}from"../core.js";import{scene as _}from"./renderer.js";import{gpuTexture as he,detailTexture as me,canvasTex as B,NOISE_GLSL as pe}from"./textures.js";import{Perf as E}from"./renderer.js";import{Env as Q}from"./sky.js";export const GROUND={w:24,l:44},LINES={w:.05,base:.08,mark:.1};const j={hard:{inner:"#23578f",outer:"#3a6c4e",line:"#f3f5f0",rough:.6,lineRough:.46,env:.8,tile:1.1,normal:1.2,wobble:8e-4},clay:{inner:"#b65a36",outer:"#b25735",line:"#efe9dd",rough:.93,lineRough:.6,env:.35,tile:1.3,normal:1.55,wobble:0},grass:{inner:"#467f33",outer:"#437b31",line:"#fbfbf5",rough:.82,lineRough:.9,env:.4,tile:.5,normal:1,wobble:.004}},X={hard:0,clay:1,grass:2},m=e=>e.toFixed(4),A=e=>{const o=new n.Color(e);return new n.Vector3(o.r,o.g,o.b)},Z=`
float ellipseMask(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
float baseWear(vec2 w) {
  vec2 a = abs(w);
  float m = ellipseMask(a, vec2(0.0, 12.3), vec2(3.6, 1.35));
  m += 0.55 * ellipseMask(a, vec2(2.4, 12.1), vec2(1.7, 1.0));
  m += 0.25 * ellipseMask(a, vec2(0.0, 6.9), vec2(1.2, 0.8));
  return clamp(m, 0.0, 1.0);
}`,ve=e=>`
#define KIND ${e}
uniform vec3 uInner, uOuter; uniform float uTexel, uWall;
${Z}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// A tapered, gently curved streak along local x.
float streak(vec2 q, float len, float wid, float bend) {
  float t = clamp(abs(q.x) / (0.5 * len), 0.0, 1.0), wd = wid * sqrt(1.0 - t * t) + 1e-4;
  return 1.0 - smoothstep(wd * 0.4, wd, abs(q.y - bend * q.x * q.x));
}
// Occlusion where the run-off meets the courtside boards (a rounded rectangle 12.3 x 22.3 m, corner radius 2.2): a
// tight, soft dark band that sets the boards on the ground. Medium and low have no screen-space occlusion to do it.
float wallAO(vec2 w) {
  vec2 q = abs(w) - vec2(12.3, 22.3) + 2.2;
  float d = 2.2 - length(max(q, 0.0)) - min(max(q.x, q.y), 0.0);   // metres inside the boards
  return 1.0 - uWall * 0.32 * exp(-max(d, 0.0) * 1.5);
}
#if KIND == 0
// Rubber from shoes: short dark curved smears, mostly sideways, thick behind the baselines.
float rubber(vec2 w) {
  const float C = 0.32;
  vec2 g = floor(w / C); float m = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = g + vec2(i, j), c = (id + 0.5) * C;
    if (hash12(id + 3.7) > 0.03 + 0.95 * baseWear(c)) continue;
    vec2 h = hash22(id + 11.3);
    vec2 q = rot((hash12(id + 7.1) - 0.5) * 1.4) * (w - c - (h - 0.5) * C);
    m = max(m, streak(q, 0.08 + 0.3 * h.x, 0.005 + 0.011 * h.y, (hash12(id + 5.9) - 0.5) * 2.0) * (0.25 + 0.55 * hash12(id + 9.2)));
  }
  return m;
}
#elif KIND == 1
// Shoe prints: sole and heel pressed in (x) with a pushed-up rim (y) and herringbone tread when the texture can hold it.
vec2 prints(vec2 w, float tread) {
  const float C = 0.45;
  vec2 g = floor(w / C), res = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = g + vec2(i, j), c = (id + 0.5) * C;
    float p = (abs(c.x) < 6.5 && abs(c.y) < 14.5) ? 0.04 + 0.85 * baseWear(c) : 0.01;
    if (hash12(id + 1.3) > p) continue;
    vec2 h = hash22(id + 2.9);
    vec2 q = rot(hash12(id + 4.4) * 6.2832) * (w - c - (h - 0.5) * C * 0.8);
    float d = min(length((q - vec2(0.045, 0.0)) / vec2(0.1, 0.048)), length((q + vec2(0.09, 0.0)) / vec2(0.055, 0.04)));
    float keep = hash12(id + 6.6) < 0.3 ? smoothstep(-0.02, 0.03, q.x) : 1.0;   // push-offs leave only the forefoot
    float sole = (1.0 - smoothstep(0.85, 1.0, d)) * keep;
    float rim = smoothstep(0.9, 1.02, d) * (1.0 - smoothstep(1.02, 1.3, d)) * keep;
    float tr = 0.5 + 0.5 * sin((q.x + abs(q.y) * 0.9) * 260.0);
    float age = 0.4 + 0.6 * hash12(id + 8.8);
    res = max(res, vec2(sole * (0.75 + 0.25 * mix(1.0, tr, tread)), rim) * age);
  }
  return res;
}
// Slides: long scraped streaks with grooves (x) and the clay they push up at the end (y).
vec2 slides(vec2 w) {
  const float C = 1.1;
  vec2 g = floor(w / C), res = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = g + vec2(i, j), c = (id + 0.5) * C;
    float p = 0.75 * baseWear(c) + ((abs(c.x) < 5.0 && abs(c.y) < 12.0) ? 0.04 : 0.0);
    if (hash12(id + 12.1) > p) continue;
    vec2 h = hash22(id + 13.7);
    float ang = (hash12(id + 14.2) - 0.5) * 1.2 + (hash12(id + 15.5) < 0.5 ? 0.0 : 3.1416);
    vec2 q = rot(ang) * (w - c - (h - 0.5) * C * 0.6);
    float len = 0.5 + 0.8 * h.x, wid = 0.05 + 0.04 * h.y;
    float s = streak(q, len, wid, (hash12(id + 16.1) - 0.5) * 0.6) * (0.75 + 0.25 * sin(q.y / wid * 9.0));
    vec2 e = (q - vec2(0.5 * len + 0.02, 0.0)) / vec2(0.07, wid * 1.4);
    res = max(res, vec2(s, exp(-dot(e, e) * 2.0)) * (0.4 + 0.6 * hash12(id + 17.3)));
  }
  return res;
}
float roundedRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
#else
// Grass wear: bald behind the baselines, at the return spots, just inside the baseline and a track to the T.
float grassWear(vec2 w) {
  vec2 a = abs(w);
  float m = ellipseMask(a, vec2(0.0, 12.35), vec2(3.4, 1.25));
  m = max(m, 0.85 * ellipseMask(a, vec2(3.1, 12.9), vec2(1.3, 0.9)));
  m = max(m, 0.65 * ellipseMask(a, vec2(0.0, 11.2), vec2(1.5, 0.8)));
  m = max(m, 0.35 * ellipseMask(a, vec2(0.0, 6.5), vec2(0.8, 1.0)));
  return m;
}
#endif
void main() {
  vec2 w = vec2(vUv.x * 24.0 - 12.0, 22.0 - vUv.y * 44.0), a = abs(w);
  // The court colour ends under the middle of the outer lines, so filtering never shows a fringe beside the paint.
  vec3 c = (a.x <= ${m(O.halfDW-LINES.w/2)} && a.y <= ${m(O.halfL-LINES.base/2)}) ? uInner : uOuter;
  c *= wallAO(w);
  if (!(a.x <= ${m(O.halfDW)} && a.y <= ${m(O.halfL)})) c *= 1.05 - 0.15 * smoothstep(6.0, 24.0, length(w * vec2(1.7, 1.0)));   // the run-off falls away from the lit court towards the stands (the court itself keeps its colour)
  float wear = clamp(baseWear(w) * (0.6 + 0.8 * fbm(w * 1.2 + 2.0)), 0.0, 1.0);
#if KIND == 0
  // acrylic: re-coat patches, squeegee passes laid down the court, sand speckle, polished and rubber-marked wear
  c *= 1.0 + (fbm(w * 0.25) - 0.5) * 0.07;
  float sq = w.x / 1.05 + (fbm(w * 0.3) - 0.5) * 0.3;
  c *= 1.0 + (hash12(vec2(floor(sq), 3.0)) - 0.5) * 0.035;
  c *= 1.0 - 0.025 * (1.0 - smoothstep(0.0, 0.04, min(fract(sq), 1.0 - fract(sq))));
  c *= 1.0 + (hash12(floor(w * 100.0)) - 0.5) * 0.04;
  vec3 polished = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))), 0.25) * 1.22 + 0.008;
  c = mix(c, polished, wear * 0.5);
  c *= 1.0 - pow(vnoise(vec2(w.x * 0.45, w.y * 2.6) + 3.0), 4.0) * wear * 0.3;
  float r = rubber(w);
  c = mix(c, vec3(0.016, 0.018, 0.022), r * 0.2);
  gl_FragColor = vec4(c, 0.5 - 0.16 * wear + 0.1 * r);
#elif KIND == 1
  // clay: tonal patches, damp watered patches, drag-mat passes looping the court, loose and packed wear, prints, slides
  c *= 1.0 + (fbm(w * 0.2) - 0.5) * 0.12;
  float damp = smoothstep(0.52, 0.72, fbm(w * 0.14 + 7.0) + (fbm(w * 1.6) - 0.5) * 0.12);
  c = mix(c, c * vec3(0.8, 0.74, 0.72), damp * 0.75);
  float tread = 1.0 - smoothstep(0.012, 0.022, uTexel);
  float rr = roundedRect(w, vec2(2.5, 8.5), 3.5) / 1.9 + (fbm(w * 0.18) - 0.5) * 0.7, pf = fract(rr);
  c *= 1.0 + (vnoise(vec2(rr * 1.9 * 38.0, (w.x - w.y) * 0.7)) - 0.5) * 0.08 * (1.0 - 0.6 * wear) * (0.4 + 0.6 * tread);
  c *= 1.0 + 0.045 * (1.0 - smoothstep(0.0, 0.03, min(pf, 1.0 - pf))) * (1.0 - wear);
  float loose = smoothstep(0.38, 0.7, fbm(w * 3.0 + 9.0)) * wear;
  c = mix(c, c * vec3(1.12, 1.08, 1.04) + 0.006, loose * 0.8);
  c = mix(c, c * 0.88, wear * (1.0 - loose) * 0.3);
  vec2 pr = prints(w, tread), sl = slides(w);
  c *= (1.0 - pr.x * 0.14) * (1.0 + pr.y * 0.1) * (1.0 - sl.x * 0.15);
  c = mix(c, c * 1.12 + 0.008, sl.y * 0.7);
  c *= 1.0 + (hash12(floor(w * 90.0)) - 0.5) * 0.08;
  gl_FragColor = vec4(c, 0.5 - damp * 0.2 + loose * 0.08 - pr.x * 0.08 - sl.x * 0.1);
#else
  // grass: colour variation, drier patches, thinning and bare earth where the players stand
  c *= 1.0 + (fbm(w * 0.35) - 0.5) * 0.16;
  c = mix(c, c * vec3(1.12, 1.06, 0.66), smoothstep(0.55, 0.8, fbm(w * 0.22 + 5.0)) * 0.3);
  float gw = grassWear(w), n1 = fbm(w * 1.7 + 3.0) - 0.5, n2 = fbm(w * 7.0) - 0.5;
  float bare = smoothstep(0.45, 0.6, gw + n1 * 0.5 + n2 * 0.22);
  float thin = clamp(smoothstep(0.18, 0.45, gw + n1 * 0.5) - bare, 0.0, 1.0);
  float tuft = smoothstep(0.6, 0.78, vnoise(w * 24.0 + 3.0)) * (1.0 - smoothstep(0.7, 0.95, gw));
  vec3 earth = srgb2lin(vec3(0.6, 0.5, 0.36)) * (0.82 + 0.36 * fbm(w * 4.0)) * (1.0 - 0.18 * smoothstep(0.7, 1.0, gw));
  c = mix(c, c * vec3(1.16, 1.1, 0.7), thin * 0.75);
  float b = bare * (1.0 - tuft * 0.75);
  c = mix(c, earth, b);
  gl_FragColor = vec4(c, clamp(b + thin * 0.3, 0.0, 1.0));
#endif
}`,xe={hard:`
    float height(vec2 uv) { float g = 1.0 - tcell(uv * 330.0, vec2(330.0)); return 0.45 * g * g + 0.35 * tnoise(uv * 512.0, vec2(512.0)) + 0.2 * tnoise(uv * 64.0, vec2(64.0)); }
    vec2 micro(vec2 uv) {
      vec2 c = tcellId(uv * 330.0, vec2(330.0)); float g = 1.0 - c.x;
      return vec2(0.5 + (g - 0.5) * 0.24 + (c.y - 0.5) * 0.22, 0.5 + (0.5 - g) * 0.35 + (tnoise(uv * 40.0, vec2(40.0)) - 0.5) * 0.3);
    }`,clay:`
    float brush(vec2 uv) { return tnoise(vec2(uv.x * 8.0, uv.y * 420.0), vec2(8.0, 420.0)); }
    float height(vec2 uv) { float g = 1.0 - tcell(uv * 260.0, vec2(260.0)); return 0.45 * g * g + 0.25 * tnoise(uv * 700.0, vec2(700.0)) + 0.3 * brush(uv); }
    vec2 micro(vec2 uv) {
      vec2 c = tcellId(uv * 260.0, vec2(260.0)); float g = 1.0 - c.x;
      float tone = (c.y - 0.5) * 0.5 * smoothstep(0.1, 0.5, g) + (tnoise(uv * 700.0, vec2(700.0)) - 0.5) * 0.3 + (brush(uv) - 0.5) * 0.2;
      return vec2(0.5 + tone * 0.6, 0.5 + (0.5 - g) * 0.2 + (c.y - 0.5) * 0.2);
    }`,grass:`
    vec4 blades(vec2 uv) {
      const float N = 60.0;
      vec2 p = uv * N, g = floor(p); vec4 top = vec4(0.0, 0.0, 0.0, 0.0);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) for (int k = 0; k < 2; k++) {
        vec2 id = mod(g + vec2(i, j), N) + float(k) * 97.0;
        vec2 h = hash22(id * 1.7), h2 = hash22(id * 2.3 + 5.0);
        vec2 d = p - (g + vec2(i, j) + h); float an = h2.x * 3.1416, cs = cos(an), sn = sin(an);
        vec2 q = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y);
        float len = 0.6 + 0.8 * h2.y, wid = 0.1 + 0.12 * hash12(id + 3.3), t = clamp(q.x / len, -1.0, 1.0);
        float wd = wid * sqrt(max(1.0 - t * t, 0.0));
        float b = 1.0 - smoothstep(wd * 0.5, wd + 0.02, abs(q.y));
        float hg = (0.4 + 0.6 * hash12(id + 9.1)) * b * (0.85 + 0.15 * t);
        if (hg > top.x) top = vec4(hg, hash12(id + 4.4), t, b);
      }
      return top;
    }
    float height(vec2 uv) { return blades(uv).x; }
    vec2 micro(vec2 uv) {
      vec4 b = blades(uv);
      float lit = 0.3 + 0.3 * b.y + 0.25 * b.x + 0.1 * b.z;
      return vec2(mix(0.12, lit, b.w), mix(0.72, 0.45, b.w));
    }`},G={w:6.2,h:1.55,zc:9.2},J={value:1},Y={value:.3},ee={day:.3,golden:.5,night:1,dawn:.4,dusk:.8};let N=null;function we(){return N||(N=B(1024,256,(e,o,s)=>{e.clearRect(0,0,o,s),e.fillStyle=e.strokeStyle="#fff",e.lineCap=e.lineJoin="round";const t=128,a=s/2,r=108;e.lineWidth=11,e.beginPath(),e.arc(t,a,r,0,Math.PI*2),e.stroke(),e.lineWidth=5,e.beginPath(),e.arc(t,a,r-17,0,Math.PI*2),e.stroke(),e.beginPath(),e.arc(t+34,a-32,21,0,Math.PI*2),e.fill(),e.lineWidth=9,e.beginPath(),e.moveTo(t-14,a+70),e.quadraticCurveTo(t-6,a+10,t+8,a-34),e.stroke();const l=t+8,d=a-34,c=[[-62,-8,-70,38],[-46,-34,-44,26],[-14,-48,-10,22],[22,-46,20,24],[52,-26,50,30],[64,4,64,40]];e.lineWidth=8;for(const[g,k,h,v]of c)e.beginPath(),e.moveTo(l,d),e.quadraticCurveTo(l+g,d+k,l+h,d+v),e.stroke();const f="PALM COURT",u=t+r+44,i=o-u-28,w='900 SIZEpx Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';let b=150,S=0;const L=.1,I=()=>{e.font=w.replace("SIZE",b),S=[...f].reduce((g,k)=>g+e.measureText(k).width+b*L,0)-b*L};I(),b=Math.floor(b*Math.min(1,i/S)),I();let q=u+(i-S)/2;for(const g of f)e.fillText(g,q,a+b*.36),q+=e.measureText(g).width+b*L;e.fillRect(u+(i-S)/2,a+b*.36+22,S,6)},{aniso:16}),N)}function be(e,o,s,t,a){const r=j[e],{halfL:l,halfSW:d,halfDW:c,svc:f}=O,u=new n.MeshStandardMaterial({roughness:r.rough,metalness:0,envMapIntensity:r.env});u.defines.COURT_KIND=X[e],t&&(u.defines.COURT_HQ=""),a&&(u.defines.COURT_LOGO="");const i={uMacro:{value:o},uDetail:{value:s},uTile:{value:r.tile},uRough:{value:r.rough},uLineRough:{value:r.lineRough},uLine:{value:A(r.line)},uWobble:{value:r.wobble}};return a&&(i.uLogo={value:we()},i.uLogoFlip=J),i.uSheen=Y,u.userData.uniforms=i,u.onBeforeCompile=w=>{Object.assign(w.uniforms,i),w.vertexShader=w.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vCourtW;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vCourtW = (modelMatrix * vec4(transformed, 1.0)).xyz;`),w.fragmentShader=w.fragmentShader.replace("#include <common>",`#include <common>
        varying vec3 vCourtW;
        uniform sampler2D uMacro, uDetail; uniform float uTile, uRough, uLineRough, uWobble, uSheen; uniform vec3 uLine;
        #ifdef COURT_LOGO
          uniform sampler2D uLogo; uniform float uLogoFlip;
        #endif
        ${pe}
        ${Z}
        float cov1(float x, float a, float b, float f) { return clamp((min(b, x + 0.5 * f) - max(a, x - 0.5 * f)) / f, 0.0, 1.0); }
        float box(vec2 p, vec4 r, vec2 f, float e) { return cov1(p.x, r.x - e, r.y + e, f.x) * cov1(p.y, r.z - e, r.w + e, f.y); }
        // Paint coverage at p = (|x|, |z|) over a pixel footprint f; e grows every line by e metres.
        float courtLines(vec2 p, vec2 f, float e) {
          const float HL = ${m(l)}, HS = ${m(d)}, HD = ${m(c)}, SV = ${m(f)}, LW = ${m(LINES.w)}, BW = ${m(LINES.base)}, MK = ${m(LINES.mark)};
          float c = box(p, vec4(-HD, HD, HL - BW, HL), f, e);                            // baselines
          c = max(c, box(p, vec4(HD - LW, HD, -HL, HL), f, e));                        // doubles sidelines
          c = max(c, box(p, vec4(HS - LW, HS, -HL, HL), f, e));                        // singles sidelines
          c = max(c, box(p, vec4(-HS, HS, SV - LW, SV), f, e));                        // service lines
          c = max(c, box(p, vec4(-0.5 * LW, 0.5 * LW, -SV, SV), f, e));                // centre service line
          return max(c, box(p, vec4(-0.5 * LW, 0.5 * LW, HL - BW - MK, HL - BW), f, e)); // centre marks
        }`).replace("#include <map_fragment>",`
        vec2 w = vCourtW.xz;
        vec2 fp = max(vec2(length(vec2(dFdx(w.x), dFdy(w.x))), length(vec2(dFdx(w.y), dFdy(w.y)))), vec2(1e-4));
        float px = max(fp.x, fp.y);
        vec4 mac = texture2D(uMacro, vec2((w.x + 12.0) / 24.0, (22.0 - w.y) / 44.0));
        vec4 det = texture2D(uDetail, w / uTile);
        #ifdef COURT_HQ
          // a second, rotated copy of the detail takes over in patches, so its tiling never lines up
          vec4 det2 = texture2D(uDetail, mat2(0.8, 0.6, -0.6, 0.8) * w / uTile + 0.37);
          det = mix(det, det2, smoothstep(0.3, 0.7, vnoise(w * 0.7 + 5.0)));
        #endif
        vec2 nd = det.rg * 2.0 - 1.0;
        float ma = det.b - 0.5, mr = det.a - 0.5, lw = baseWear(w);
        vec3 col = mac.rgb; float rough = uRough;
        #if COURT_KIND == 0
          col *= 1.0 + ma * 0.5;
          rough += (mac.a - 0.5) + mr * 0.25 - uSheen * 0.12;
          #ifdef COURT_LOGO
            // the club mark: a few shades lighter than the paint it sits on, and a touch glossier
            {
              float zc = w.y > 0.0 ? ${m(G.zc)} : -${m(G.zc)};
              vec2 lu = vec2(w.x, zc - w.y) * uLogoFlip / vec2(${m(G.w)}, ${m(G.h)}) + 0.5;
              float lm = texture2D(uLogo, lu).a * step(0.0, min(lu.x, lu.y)) * step(max(lu.x, lu.y), 1.0) * (1.0 - 0.35 * lw);
              col = mix(col, col * 1.28 + vec3(0.012, 0.03, 0.065), lm * 0.7);
              rough -= 0.06 * lm;
            }
          #endif
        #elif COURT_KIND == 1
          col *= 1.0 + ma * 0.72;
          rough += (mac.a - 0.5) * 0.6 + mr * 0.15;
        #else
          float bare = mac.a;
          // Mown stripes: blades laid towards the viewer look dark, laid away look light; faint from the side.
          float sp = w.y / 1.1885, sw = max(fp.y / 1.1885 * 3.1416 * 1.5, 0.06);
          float stripe = clamp(sin(3.1416 * sp) / sw, -1.0, 1.0);
          vec3 V = normalize(cameraPosition - vCourtW);
          col *= 1.0 - stripe * 0.1 * V.z * (1.0 - 0.4 * V.y) * (1.0 - bare);
          col *= 1.0 + ma * mix(0.9, 0.35, bare);
          nd *= 1.0 - 0.5 * bare;
          rough += mr * 0.2 + bare * 0.1;
        #endif
        // painted lines
        vec2 p = abs(w);
        #ifdef COURT_HQ
          p += (vec2(vnoise(w * vec2(90.0, 23.0)), vnoise(w * vec2(23.0, 90.0) + 7.0)) - 0.5) * uWobble * (1.0 - smoothstep(0.002, 0.008, px));
        #endif
        float lc = courtLines(p, fp * 1.25, 0.0);
        vec3 lcol = uLine; float lrough = uLineRough, lnorm = 0.35;
        #if COURT_KIND == 0
          lcol *= (1.0 + ma * 0.08) * (1.0 - 0.14 * lw * smoothstep(0.4, 0.8, vnoise(w * 12.0)));   // scuffed where they stand
          lrough += mr * 0.1;
        #elif COURT_KIND == 1
          // tapes sit a little proud: a thin shadow gap along their edges, clay dust swept over them
          float gap = clamp(courtLines(p, fp * 1.25, 0.004) - lc, 0.0, 1.0);
          col *= 1.0 - 0.3 * gap;
          float dust = clamp(smoothstep(0.35, 0.95, vnoise(w * 3.0) * 0.55 + det.b * 0.35 + lw * 0.45), 0.0, 1.0);
          lcol = mix(lcol, mac.rgb * 1.15, dust * 0.6);
          lrough = mix(lrough, 0.92, dust); lnorm = mix(0.2, 0.8, dust);
        #else
          // chalk on the blades: patchy up close, rubbed off at the baseline centre
          lc *= mix(0.78 + 0.22 * smoothstep(-0.2, 0.15, ma), 0.95, bare) * (1.0 - 0.45 * lw * smoothstep(0.35, 0.7, vnoise(w * 6.0)));
          lnorm = 0.8;
        #endif
        col = mix(col, lcol, lc);
        rough = mix(rough, lrough, lc);
        nd *= mix(1.0, lnorm, lc);
        rough = clamp(rough + 0.06 * smoothstep(0.01, 0.1, px), 0.3, 1.0);   // flattened distant bumps still scatter
        diffuseColor.rgb = col;`).replace("#include <roughnessmap_fragment>","float roughnessFactor = rough;").replace("#include <normal_fragment_maps>","normal = normalize((viewMatrix * vec4(normalize(vec3(nd.x, 1.0, nd.y)), 0.0)).xyz);")},u.customProgramCacheKey=()=>`court-${e}-${t?1:0}-${a?1:0}`,u}const R=new n.Group,F={kind:null,tier:-1,mesh:null},te=()=>E.cfg().detail|0,oe=e=>e.renderTarget?e.renderTarget.dispose():e.dispose();function ge(){const e=F;if(e.mesh){if(R.remove(e.mesh),e.mesh.geometry.dispose(),e.mesh.material.dispose(),oe(e.macro),oe(e.detail),e.paint){R.remove(e.paint);const{geo:o,mat:s}=e.paint.userData;o.dispose(),s.map.dispose(),s.dispose(),e.paint=null}e.mesh=null,e.kind=null}}function ye(e=1024){const o=(t,a)=>{const r=a/2,l=(f,u,i)=>{t.globalAlpha=i,t.lineWidth=u,t.beginPath(),t.arc(r,r,f,0,6.2832),t.stroke()};t.clearRect(0,0,a,a),t.strokeStyle="#f3f5f0",l(a*.485,a*.03,.8),l(a*.33,a*.012,.7);const d="PALM COURT",c=6.2832/24;t.fillStyle="#f3f5f0",t.globalAlpha=.85,t.textAlign="center",t.textBaseline="middle",t.font=`900 ${Math.round(a*.115)}px "Big Shoulders Display", Impact, sans-serif`;for(let f=0;f<2;f++)for(let u=0;u<d.length;u++){if(d[u]===" ")continue;const i=f*Math.PI+(u-(d.length-1)/2)*c;t.save(),t.translate(r,r),t.rotate(i),t.translate(0,-a*.405),t.fillText(d[u],0,0),t.restore()}t.save(),t.beginPath(),t.arc(r,r,a*.25,0,6.2832),t.clip(),t.globalAlpha=.92,t.fillStyle="#d6f04a",t.fillRect(0,0,a,a),t.strokeStyle="#f3f5f0",t.lineWidth=a*.022,t.globalAlpha=.95,t.beginPath(),t.arc(r-a*.37,r,a*.285,-.95,.95),t.stroke(),t.beginPath(),t.arc(r+a*.37,r,a*.285,Math.PI-.95,Math.PI+.95),t.stroke(),t.restore(),t.globalAlpha=1},s=B(e,e,o);return document.fonts&&document.fonts.load&&document.fonts.load('900 64px "Big Shoulders Display"').then(()=>{o(s.image.getContext("2d"),e),s.needsUpdate=!0}).catch(()=>{}),s}function Me(e){if(e!=="hard")return null;const o=new n.MeshStandardMaterial({map:ye(),transparent:!0,opacity:.5,roughness:.62,metalness:0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),s=new n.PlaneGeometry(5,5),t=new n.Mesh(s,o);t.rotation.x=-Math.PI/2,t.position.set(0,.003,16.2),t.receiveShadow=!0;const a=t.clone();a.position.z=-16.2;const r=new n.Group;return r.add(t,a),r.userData={geo:s,mat:o},r}function ae(e,o=null){ge();const s=o&&e==="hard"?{...j[e],...o}:j[e],t=te(),a=t>=2,r=a?2048:1024,l=he({width:r,height:r*2,fragment:ve(X[e]),srgb:!0,bands:a?8:2,uniforms:{uInner:{value:A(s.inner)},uOuter:{value:A(s.outer)},uTexel:{value:GROUND.w/r},uWall:{value:s.wall??1}}}),d=me({size:t>=3?2048:t>=1?1024:512,glsl:xe[e],strength:s.normal}),c=new n.Mesh(new n.PlaneGeometry(GROUND.w,GROUND.l),be(e,l,d,a,e==="hard"&&t>=1));c.rotation.x=-Math.PI/2,c.receiveShadow=!0,R.add(c);const f=Me(e);f&&R.add(f),Object.assign(F,{kind:e,tier:t,mesh:c,macro:l,detail:d,paint:f,pal:o?o.key:null})}export const Net3D={mesh:null,mat:null,hit:new n.Vector4(0,0,-99,0),dir:{value:1},sticks:[]};const{netC:W,netP:re,postX:y}=O,K=`
uniform vec4 uHit; uniform float uDir;
float netRipple(vec3 p) {
  float age = uHit.w - uHit.z;
  if (age < 0.0 || age >= 2.5) return 0.0;
  float d = distance(p.xy, uHit.xy);
  float top = ${m(W)} + ${m(re-W)} * pow(min(abs(p.x) / ${m(y)}, 1.0), 1.6);
  float pin = (1.0 - smoothstep(${m(y-.6)}, ${m(y)}, abs(p.x))) * mix(1.0, 0.35, smoothstep(top - 0.35, top, p.y));
  return uDir * 0.1 * pin * exp(-age * 3.2) * exp(-d * 1.4) * cos(age * 22.0 - d * 9.0);
}`,Se=`
float netCover(vec2 uv) {
  vec2 cell = uv / 0.045, f = abs(fract(cell) - 0.5), fw = fwidth(cell);
  vec2 lines = smoothstep(0.5 - 0.055 - fw, 0.5 - 0.055 + fw, f);
  float knot = 1.0 - smoothstep(0.1 - fw.x, 0.1 + fw.x, length(0.5 - f));
  float cover = max(max(lines.x, lines.y), knot);
  cover = max(cover, smoothstep(${m(y-.1)}, ${m(y-.09)}, abs(uv.x)));
  return mix(cover, 0.26, clamp(max(fw.x, fw.y) * 1.6 - 0.25, 0.0, 1.0));
}`;function ke(e){return e.onBeforeCompile=o=>{o.uniforms.uHit={value:Net3D.hit},o.uniforms.uDir=Net3D.dir,o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
`+K).replace("#include <begin_vertex>",`#include <begin_vertex>
transformed.z += netRipple(position);`)},e}function Ce(e=128){const t=[[.007,-.06]];for(let c=0;c<=8;c++){const f=c/8*Math.PI;t.push([Math.cos(f)*.007,-.007+Math.sin(f)*.007])}t.push([-.007,-.06]);const a=[],r=[],l=t.length;for(let c=0;c<=e;c++){const f=U(-y,y,c/e),u=$(f);for(const[i,w]of t)a.push(f,u+w,i)}for(let c=0;c<e;c++)for(let f=0;f<l;f++){const u=c*l+f,i=c*l+(f+1)%l,w=u+l,b=i+l;r.push(u,i,w,i,b,w)}const d=new n.BufferGeometry;return d.setAttribute("position",new n.Float32BufferAttribute(a,3)),d.setIndex(r),d.computeVertexNormals(),d}function De(){const e=new n.Group,o=96,s=10,t=[],a=[],r=[];for(let h=0;h<=s;h++)for(let v=0;v<=o;v++){const p=U(-y,y,v/o),x=$(p)-.03,C=U(.03,x,h/s);t.push(p,C,0),a.push(p,C)}for(let h=0;h<s;h++)for(let v=0;v<o;v++){const p=h*(o+1)+v,x=p+1,C=p+o+1,z=C+1;r.push(p,C,x,x,C,z)}const l=new n.BufferGeometry;l.setAttribute("position",new n.Float32BufferAttribute(t,3)),l.setAttribute("uv",new n.Float32BufferAttribute(a,2)),l.setIndex(r),l.computeVertexNormals();const d=new n.MeshStandardMaterial({color:1382684,roughness:.85,side:n.DoubleSide,transparent:!0,depthWrite:!1});d.onBeforeCompile=h=>{h.uniforms.uHit={value:Net3D.hit},h.uniforms.uDir=Net3D.dir,h.vertexShader=h.vertexShader.replace("#include <common>",`#include <common>
varying vec2 vNetUv;
`+K).replace("#include <begin_vertex>",`#include <begin_vertex>
vNetUv = uv;
transformed.z += netRipple(position);`),h.fragmentShader=h.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vNetUv;
`+Se).replace("#include <alphamap_fragment>",`#include <alphamap_fragment>
        diffuseColor.a *= netCover(vNetUv);`)};const c=new n.Mesh(l,d);c.renderOrder=2;const f=new n.MeshDepthMaterial({side:n.DoubleSide});f.onBeforeCompile=h=>{h.uniforms.uHit={value:Net3D.hit},h.uniforms.uDir=Net3D.dir,h.vertexShader=h.vertexShader.replace("#include <common>",`#include <common>
varying vec2 vNetUv;
`+K).replace("#include <begin_vertex>",`#include <begin_vertex>
vNetUv = uv;
transformed.z += netRipple(position);`),h.fragmentShader=h.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vNetUv;
float netHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }`).replace("#include <clipping_planes_fragment>",`#include <clipping_planes_fragment>
if (netHash(floor(vNetUv / 0.02)) > 0.3) discard;`)},c.customDepthMaterial=f,c.castShadow=!0,e.add(c),Net3D.mesh=c,Net3D.mat=d;const u=ke(new n.MeshStandardMaterial({color:16185073,roughness:.62})),i=new n.Mesh(Ce(),u);i.castShadow=!0,e.add(i);const w=new n.BoxGeometry(.05,W-.016,.018,1,8,1);w.translate(0,.02+(W-.016)/2,0);const b=new n.Mesh(w,u);b.castShadow=!0,e.add(b);const S=new n.MeshStandardMaterial({color:10133668,roughness:.35,metalness:.85}),L=new n.MeshStandardMaterial({color:2830131,roughness:.5,metalness:.6}),I=new n.Mesh(new n.CylinderGeometry(.03,.04,.03,12),L);I.position.set(0,.015,0);const q=new n.Mesh(new n.BoxGeometry(.056,.035,.024),L);q.position.set(0,.22,0),e.add(I,q);const g=new n.MeshStandardMaterial({color:1456689,roughness:.38,metalness:.45}),k=re+.02;for(const h of[-1,1]){const v=h*y,p=(x,C,z,ce,fe,ue=0,de=0)=>{const T=new n.Mesh(x,C);return T.position.set(z,ce,fe),T.rotation.set(ue,0,de),T.castShadow=!0,T.receiveShadow=!0,e.add(T),T};if(p(new n.CylinderGeometry(.045,.045,k,24),g,v,k/2,0),p(new n.CylinderGeometry(.05,.05,.016,24),g,v,k+.008,0),p(new n.SphereGeometry(.05,20,6,0,Math.PI*2,0,Math.PI/2),g,v,k+.016,0).scale.y=.3,p(new n.CylinderGeometry(.068,.072,.012,24),S,v,.006,0),h>0){const x=v+.045;p(new n.BoxGeometry(.04,.13,.07),g,x+.015,.93,0),p(new n.CylinderGeometry(.009,.009,.05,10),S,x+.055,.95,0,0,Math.PI/2),p(new n.BoxGeometry(.014,.13,.016),S,x+.08,.9,.02,.35,0),p(new n.CylinderGeometry(.012,.012,.075,10),L,x+.115,.845,.04,0,Math.PI/2)}}for(const h of[-1,1]){const v=h*(O.halfSW+.914),p=$(v)-.004,x=new n.Mesh(new n.BoxGeometry(.05,p,.05),g);x.position.set(v,p/2,0),x.castShadow=!0,x.receiveShadow=!0,e.add(x),Net3D.sticks.push(x)}_.add(e)}function se(e,o,s){return B(e,o,t=>{const a=t.createImageData(e,o);for(let r=0;r<o;r++)for(let l=0;l<e;l++){const d=(l+.5)/e*2-1,c=(r+.5)/o*2-1,[f,u]=s(d,c,Math.random()),i=(r*e+l)*4;a.data[i]=a.data[i+1]=a.data[i+2]=Math.round(255*Math.min(1,Math.max(0,f))),a.data[i+3]=Math.round(255*Math.min(1,Math.max(0,u)))}t.putImageData(a,0,0)})}const H=(e,o,s)=>{const t=Math.min(1,Math.max(0,(s-e)/(o-e)));return t*t*(3-2*t)};let V=null,ne=null;function le(){V||(V=se(64,128,(e,o,s)=>{const t=Math.hypot(e,o)+(s-.5)*.06,a=H(.62,.85,t)*(1-H(.9,1,t));return[.88+.08*Math.sin(e*23+s)-.28*a,1-H(.88,1,t)]}),ne=se(64,256,(e,o,s)=>{const t=(1-o)/2,a=Math.sqrt(Math.max(0,1-Math.pow(Math.abs(o)*1.05,2)))*(.75+.25*t),r=1-H(a*.7,a,Math.abs(e)+(s-.5)*.08),l=Math.exp(-Math.pow((o-.82)/.12,2))*(1-H(.6,1,Math.abs(e)));return[.72+.14*Math.sin(e*30)+.4*l+(s-.5)*.1,Math.max(r*(.45+.55*(1-t)),l)]}))}const ie={clay:[11821887,.6,0],grass:[9416290,.28,0],hard:[14473931,.3,7]},D={list:[],i:0,mat:null,surface:"hard"};function Le(){le(),D.mat=new n.MeshStandardMaterial({map:V,color:8010012,roughness:1,transparent:!0,opacity:.55,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3});const e=new n.CircleGeometry(.5,20);for(let o=0;o<24;o++){const s=new n.Mesh(e,D.mat.clone());s.rotation.x=-Math.PI/2,s.position.y=.006,s.visible=!1,s.receiveShadow=!0,_.add(s),D.list.push(s)}}export function addBallMark(e,o,s,t,a){const r=D.list[D.i++%D.list.length],[l,d,c]=ie[a]||ie.hard;r.visible=!0,r.position.x=e,r.position.z=o,r.rotation.z=Math.atan2(s,t),r.scale.set(.065,.11,1),r.material.color.set(l),r.material.opacity=d,r.userData.born=performance.now(),r.userData.op=d,r.userData.life=c}const M={list:[],i:0,mats:null},P={clay:[12084543,.7,1],hard:[1053463,.3,.6],grass:[7626812,.5,.7]};export function addSkidMark(e,o,s,t,a,r=World.surface){if(!M.list.length){le();const c=new n.CircleGeometry(.5,20),f=([u,i])=>new n.MeshStandardMaterial({map:ne,color:u,roughness:1,transparent:!0,opacity:i,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3});M.mats={clay:f(P.clay),hard:f(P.hard),grass:f(P.grass)};for(let u=0;u<30;u++){const i=new n.Mesh(c,M.mats.clay);i.rotation.x=-Math.PI/2,i.position.y=.006,i.visible=!1,i.receiveShadow=!0,_.add(i),M.list.push(i)}}const l=M.list[M.i++%M.list.length],d=P[r]||P.clay;l.material=M.mats[r]||M.mats.clay,l.visible=!0,l.position.x=e,l.position.z=o,l.rotation.z=Math.atan2(s,t),l.scale.set(.13,a*d[2],1)}export function clearBallMarks(){for(const e of D.list)e.visible=!1;for(const e of M.list)e.visible=!1}export const World={surface:null,pal:null,init(){_.add(R),De(),Le(),Q.onChange(e=>this.setTimeOfDay(e)),this.setTimeOfDay(Q.tod||"day"),E.onChange(()=>{this.surface&&F.tier!==te()&&ae(this.surface,this.pal)})},setSurface(e,o=null){const s=o&&e==="hard"?o.key:null;if(e===this.surface&&s===(this.pal?this.pal.key:null))return;const t=e!==this.surface;if(this.surface=e,this.pal=s?o:null,ae(e,this.pal),clearBallMarks(),t)for(const a of this.listeners)a(e)},setTimeOfDay(e){Y.value=ee[e]??ee.day},setViewSide(e){J.value=e<0?-1:1},setSinglesSticks(e){for(const o of Net3D.sticks)o.visible=!!e},listeners:[],onChange(e){this.listeners.push(e)},netHit(e,o,s,t){Net3D.hit.set(e,o,s,s),Net3D.dir.value=t<0?-1:1},update(e){const o=Net3D.hit;o.z>-50&&(o.w=e,e-o.z>2.5&&(o.z=-99));const s=performance.now();for(const t of D.list){const a=t.userData;if(!t.visible||!a.life)continue;const r=(s-a.born)/1e3/a.life;r>=1?t.visible=!1:t.material.opacity=a.op*Math.min(1,(1-r)*3)}}};
