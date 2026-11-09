/*! Palm Court (c) 2026. All rights reserved. */
import*as e from"three";import{renderer as p}from"./renderer.js";export function canvasTex(t,r,o,{srgb:v=!0,repeat:l=!1,aniso:i=8}={}){const c=document.createElement("canvas");c.width=t,c.height=r,o(c.getContext("2d"),t,r);const n=new e.CanvasTexture(c);return n.colorSpace=v?e.SRGBColorSpace:e.NoColorSpace,n.anisotropy=Math.min(i,p.capabilities.getMaxAnisotropy()),l&&(n.wrapS=n.wrapT=e.RepeatWrapping),n}export const NOISE_GLSL=`
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
// tileable value noise with period per
float tnoise(vec2 p, vec2 per) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 a = mod(i, per), b = mod(i + 1.0, per);
  return mix(mix(hash12(a), hash12(vec2(b.x, a.y)), u.x), mix(hash12(vec2(a.x, b.y)), hash12(b), u.x), u.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float tfbm(vec2 p, vec2 per) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * tnoise(p, per); p *= 2.0; per *= 2.0; a *= 0.5; } return s; }
// tileable cellular noise: distance to nearest feature point
float tcell(vec2 p, vec2 per) {
  vec2 i = floor(p), f = fract(p); float d = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y); vec2 o = hash22(mod(i + g, per)); d = min(d, length(g + o - f));
  }
  return d;
}
// tileable cellular noise: x = distance to the nearest feature point, y = a random value for that point's cell
vec2 tcellId(vec2 p, vec2 per) {
  vec2 i = floor(p), f = fract(p); float d = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y), c = mod(i + g, per); float e = length(g + hash22(c) - f);
    if (e < d) { d = e; id = hash12(c + 71.3); }
  }
  return vec2(d, id);
}
vec3 srgb2lin(vec3 c) { return pow(c, vec3(2.2)); }
`;const S=new e.PlaneGeometry(2,2),T=new e.OrthographicCamera(-1,1,1,-1,0,1),R="varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";export function gpuTexture({width:t,height:r,fragment:o,uniforms:v={},repeat:l=!1,mipmaps:i=!0,type:c=e.UnsignedByteType,srgb:n=!1,bands:x=1}){const a=new e.WebGLRenderTarget(t,r,{depthBuffer:!1,type:c,generateMipmaps:i,colorSpace:n?e.SRGBColorSpace:e.NoColorSpace,minFilter:i?e.LinearMipmapLinearFilter:e.LinearFilter,magFilter:e.LinearFilter,wrapS:l?e.RepeatWrapping:e.ClampToEdgeWrapping,wrapT:l?e.RepeatWrapping:e.ClampToEdgeWrapping});a.texture.anisotropy=Math.min(8,p.capabilities.getMaxAnisotropy());const s=new e.ShaderMaterial({uniforms:{...v,uRes:{value:new e.Vector2(t,r)}},vertexShader:R,fragmentShader:`precision highp float; varying vec2 vUv; uniform vec2 uRes;
`+NOISE_GLSL+o,depthTest:!1,depthWrite:!1}),d=new e.Mesh(S,s),u=new e.Scene;u.add(d);const m=p.getRenderTarget(),f=Math.max(1,x|0);a.scissorTest=f>1;for(let h=0;h<f;h++){const g=Math.floor(r*h/f),y=Math.floor(r*(h+1)/f);a.scissor.set(0,g,t,y-g),a.texture.generateMipmaps=i&&h===f-1,p.setRenderTarget(a),p.render(u,T)}return a.scissorTest=!1,a.texture.generateMipmaps=i,p.setRenderTarget(m),s.dispose(),a.texture}export function normalFromHeight({size:t=1024,heightGlsl:r,strength:o=1,uniforms:v={}}){return gpuTexture({width:t,height:t,repeat:!0,uniforms:{uStrength:{value:o},...v},fragment:r+`
      uniform float uStrength;
      void main() {
        vec2 e = 1.0 / uRes;
        float hl = height(fract(vUv - vec2(e.x, 0.0))), hr = height(fract(vUv + vec2(e.x, 0.0)));
        float hd = height(fract(vUv - vec2(0.0, e.y))), hu = height(fract(vUv + vec2(0.0, e.y)));
        vec3 n = normalize(vec3((hl - hr) * uStrength, (hd - hu) * uStrength, 1.0));
        gl_FragColor = vec4(n * 0.5 + 0.5, height(vUv));
      }`})}export function detailTexture({size:t=1024,glsl:r,strength:o=1}){return gpuTexture({width:t,height:t,repeat:!0,uniforms:{uStrength:{value:o}},fragment:r+`
      uniform float uStrength;
      void main() {
        vec2 e = 1.0 / uRes; float k = uStrength * uRes.x / 1024.0;
        float hl = height(fract(vUv - vec2(e.x, 0.0))), hr = height(fract(vUv + vec2(e.x, 0.0)));
        float hd = height(fract(vUv - vec2(0.0, e.y))), hu = height(fract(vUv + vec2(0.0, e.y)));
        vec3 n = normalize(vec3((hl - hr) * k, (hd - hu) * k, 1.0));
        gl_FragColor = vec4(n.xy * 0.5 + 0.5, clamp(micro(vUv), 0.0, 1.0));
      }`})}
