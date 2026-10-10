/*! Palm Court (c) 2026. All rights reserved. */
import*as t from"three";import{renderer as I,scene as w,Look as T,Perf as y,onContextRestored as G}from"./renderer.js";const R=`
		vec2 pcDepthGradient( vec3 c ) {
			vec3 dx = dFdx( c ), dy = dFdy( c );
			float det = dx.x * dy.y - dx.y * dy.x;
			if ( abs( det ) < 1e-14 ) return vec2( 0.0 );
			vec2 g = vec2( dy.y * dx.z - dx.y * dy.z, dx.x * dy.z - dy.x * dx.z ) / det;
			float m = length( g );
			return m > 2.0 ? g * ( 2.0 / m ) : g;   // silhouette pixels have meaningless gradients
		}
		float pcShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, vec2 grad ) {
			vec3 c = shadowCoord.xyz / shadowCoord.w;
			c.z += shadowBias;
			if ( c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0 ) return 1.0;
			vec2 texel = 1.0 / shadowMapSize;
			float r = max( shadowRadius, 0.5 );
			int n = int( clamp( ceil( r ), 1.0, 4.0 ) ) + 1;
			float stp = 2.0 * r / float( n - 1 ), mid = 0.5 * float( n - 1 ), s = 0.0;
			for ( int y = 0; y < 5; y ++ ) {
				if ( y >= n ) break;
				for ( int x = 0; x < 5; x ++ ) {
					if ( x >= n ) break;
					vec2 o = ( vec2( float( x ), float( y ) ) - mid ) * stp * texel;
					s += texture( shadowMap, vec3( c.xy + o, c.z + dot( grad, o ) ) );
				}
			}
			return mix( 1.0, s / float( n * n ), shadowIntensity );
		}
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			return pcShadow( shadowMap, shadowMapSize, shadowIntensity, shadowBias, shadowRadius, shadowCoord, vec2( 0.0 ) );
		}
		float pcStockShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {`,H=`
#if defined( USE_SHADOWMAP ) && defined( SHADOWMAP_TYPE_PCF ) && NUM_DIR_LIGHT_SHADOWS > 1
float pcSunShadow( DirectionalLightShadow s0, DirectionalLightShadow s1, vec2 g0, vec2 g1, bool wide ) {
	float a = pcShadow( directionalShadowMap[ 0 ], s0.shadowMapSize, s0.shadowIntensity, s0.shadowBias, s0.shadowRadius, vDirectionalShadowCoord[ 0 ], g0 );
	if ( ! wide ) return a;
	vec2 c = vDirectionalShadowCoord[ 0 ].xy / vDirectionalShadowCoord[ 0 ].w, e = min( c, 1.0 - c );
	float w = smoothstep( 0.0, 0.035, min( e.x, e.y ) );
	float b = w < 1.0 ? pcShadow( directionalShadowMap[ 1 ], s1.shadowMapSize, s1.shadowIntensity, s1.shadowBias, s1.shadowRadius, vDirectionalShadowCoord[ 1 ], g1 ) : 1.0;
	return mix( b, a, w );
}
#endif
`,M=`	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif`,U=M+`
	#if defined( USE_SHADOWMAP ) && defined( SHADOWMAP_TYPE_PCF ) && NUM_DIR_LIGHT_SHADOWS > 0
	vec2 pcG0 = pcDepthGradient( vDirectionalShadowCoord[ 0 ].xyz / vDirectionalShadowCoord[ 0 ].w );
	#if NUM_DIR_LIGHT_SHADOWS > 1
	vec2 pcG1 = pcDepthGradient( vDirectionalShadowCoord[ 1 ].xyz / vDirectionalShadowCoord[ 1 ].w );
	bool pcWide = dot( directionalLights[ 1 ].color, vec3( 1.0 ) ) == 0.0 && dot( directionalLights[ 1 ].direction, directionalLights[ 0 ].direction ) > 0.9999;
	#endif
	#endif`,C="		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;",B=`		#if ! defined( SHADOWMAP_TYPE_PCF )
${C}
		#elif ( UNROLLED_LOOP_INDEX == 0 ) && ( NUM_DIR_LIGHT_SHADOWS > 1 )
		directLight.color *= ( directLight.visible && receiveShadow ) ? pcSunShadow( directionalLightShadow, directionalLightShadows[ 1 ], pcG0, pcG1, pcWide ) : 1.0;
		#elif ( UNROLLED_LOOP_INDEX == 0 )
		directLight.color *= ( directLight.visible && receiveShadow ) ? pcShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ], pcG0 ) : 1.0;
		#else
		directLight.color *= ( directLight.visible && receiveShadow && dot( directLight.color, vec3( 1.0 ) ) > 0.0 ) ? pcShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ], vec2( 0.0 ) ) : 1.0;
		#endif`,z=`	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif`,E=z+`
	#if defined( USE_SHADOWMAP ) && defined( SHADOWMAP_TYPE_PCF ) && NUM_SPOT_LIGHT_SHADOWS > 0
	vec2 pcGs[ NUM_SPOT_LIGHT_SHADOWS ];
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		pcGs[ i ] = pcDepthGradient( vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w );
	}
	#pragma unroll_loop_end
	#endif`,D="		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;",F=`		#if defined( SHADOWMAP_TYPE_PCF )
		directLight.color *= ( directLight.visible && receiveShadow ) ? pcShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ], pcGs[ i ] ) : 1.0;
		#else
${D}
		#endif`,_="		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {";function N(){const o=t.ShaderChunk,e=(i,r)=>i.split(r).length===2,s=o.shadowmap_pars_fragment,a=o.lights_fragment_begin;return!e(s,_)||!e(a,M)||!e(a,C)||!e(a,z)||!e(a,D)?(console.warn("Palm Court: shadow shader patch skipped (three.js chunks changed); using stock shadows."),!1):(o.shadowmap_pars_fragment=s.replace(_,R)+H,o.lights_fragment_begin=a.replace(M,U).replace(C,B).replace(z,E).replace(D,F),!0)}const k=N(),V=[-12.5,12.5,0,2.6,-22.5,22.5],O=[-48,48,0,26,-58,58],b={uniforms:{uSunDir:{value:new t.Vector3(0,1,0)},uSun:{value:new t.Color},uZenith:{value:new t.Color},uHorizon:{value:new t.Color},uGlow:{value:new t.Color},uHaze:{value:new t.Color},uCity:{value:new t.Color},uMoonDir:{value:new t.Vector3(0,1,0)},uMoon:{value:0},uCloudLit:{value:new t.Color},uCloudDark:{value:new t.Color},uCloud:{value:new t.Vector4(.4,.8,1,1)},uTime:{value:0},uDisc:{value:1},uScale:{value:1},uSat:{value:1},uHorizonK:{value:3}},vertexShader:`
    varying vec3 vWorld;
    void main() {
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position.z = gl_Position.w;   // on the far plane
    }`,fragmentShader:`
    uniform vec3 uSunDir, uSun, uZenith, uHorizon, uGlow, uHaze, uCity, uMoonDir, uCloudLit, uCloudDark;
    uniform vec4 uCloud;   // coverage, opacity, scale, drift speed
    uniform float uTime, uDisc, uScale, uSat, uMoon, uHorizonK;
    varying vec3 vWorld;
    vec2 grad2(vec2 i) { vec3 p = fract(i.xyx * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.xx + p.yz) * p.zy) * 2.0 - 1.0; }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      float a = dot(grad2(i), f), b = dot(grad2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
      float c = dot(grad2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), d = dot(grad2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.6;
    }
    const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
    float fbm(vec2 p, int oct, float drift) {
      float s = 0.0, a = 0.5;
      for (int i = 0; i < 6; i++) { if (i >= oct) break; s += a * noise(p); p = ROT * p + drift; a *= 0.5; }
      return s;
    }
    void main() {
      vec3 d = normalize(vWorld - cameraPosition);
      float h = d.y, hp = max(h, 0.0), mu = dot(d, uSunDir);
      // Gradient: a bright, hazy horizon band thinning into the zenith colour.
      // (Mixed in a square-root space, which keeps the golden-hour transition from going muddy pink.)
      vec3 col = mix(sqrt(uHorizon), sqrt(uZenith), 1.0 - exp(-hp * uHorizonK)); col *= col;
      // Warm light in the air towards the sun, strongest low down (golden hour), a wide halo and a tight corona.
      vec2 dh = d.xz / max(length(d.xz), 1e-4), sh = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
      float toward = pow(dot(dh, sh) * 0.5 + 0.5, 3.0), m = max(mu, 0.0);
      col += uGlow * (toward * exp(-hp * 4.0) + 0.45 * pow(m, 6.0));
      col += uSun * (0.012 * pow(m, 60.0) + 0.05 * pow(m, 900.0));
      // Night: floodlight haze in the air over the stadium and the city's glow on the horizon.
      col += uHaze * exp(-hp * 3.5) + uCity * exp(-abs(h) * 14.0);
      // Clouds: a domain-warped fbm on a curved layer, drifting and slowly evolving; lit on the sun side,
      // self-shadowed by the density towards the sun, with silver linings when backlit.
      #ifdef CLOUDS
      if (h > 0.0 && uCloud.x > 0.0) {
        vec2 p = d.xz / (h + 0.12) * uCloud.z + vec2(uTime * uCloud.w, uTime * uCloud.w * 0.35);
        float ev = uTime * uCloud.w * 0.35;
        vec2 q = p + 0.35 * vec2(noise(p * 0.5 + 3.1), noise(p * 0.5 - 7.3));
        float n = fbm(q, CLOUD_OCT, ev) + 0.5;
        float region = noise(p * 0.18 + 11.0) * 0.5 + 0.5;
        float cov = clamp(uCloud.x + (region - 0.5) * 0.5, 0.0, 1.0), th = 1.0 - cov;
        float mask = smoothstep(th, th + 0.28, n) * smoothstep(0.0, 0.1, h);
        float n2 = fbm(q + sh * 0.22, 3, ev) + 0.5;
        float lit = clamp(0.62 + (n - n2) * 2.4 - (n - th) * 0.5, 0.0, 1.0);
        float edge = mask * (1.0 - mask) * 4.0;
        vec3 cc = mix(uCloudDark, uCloudLit, lit) + uSun * 0.02 * pow(m, 5.0) * (0.4 + edge);
        cc = mix(cc, col, 1.0 - smoothstep(0.0, 0.25, h));   // distant clouds fade into the haze
        col = mix(col, cc, mask * uCloud.y);
      }
      #endif
      // Sun disc (limb darkened) and moon, above the horizon only.
      float above = smoothstep(-0.01, 0.01, h);
      float disc = smoothstep(0.999955, 0.999975, mu);
      col += uSun * uDisc * disc * (0.6 + 0.4 * smoothstep(0.999955, 0.99999, mu)) * 30.0 * above;
      float mm = dot(d, uMoonDir);
      col += uMoon * (vec3(1.5, 1.5, 1.42) * smoothstep(0.99992, 0.99995, mm) + vec3(0.05, 0.06, 0.08) * pow(max(mm, 0.0), 300.0)) * above;
      // Below the horizon: a hazy ground colour (hidden by the scenery, but the light probe sees it).
      col = mix(col, uHorizon * 0.45, smoothstep(0.0, -0.08, h));
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor = vec4(mix(vec3(l), col, uSat) * uScale, 1.0);
    }`},n=(o,e,s)=>new t.Color().setRGB(o,e,s,t.LinearSRGBColorSpace),v={day:{label:"Day",elevation:57,azimuth:32,sky:{zenith:n(.05,.16,.52),horizon:n(.5,.64,.84),glow:n(.34,.3,.24),sun:n(12,11.2,10),horizonK:2.6,cloud:[.36,.88,2.2,.007],cloudLit:n(1.05,1.05,1.04),cloudDark:n(.38,.45,.58)},sun:16774115,sunI:3,hemiSky:13624319,hemiGround:7174748,hemiI:0,env:1,probe:.34,probeSat:.35,contact:.42,envRing:[.07,.075,.08],envGround:[.06,.1,.08],fog:13228520,fogNear:160,fogFar:900,look:{exposure:1.22,bloom:.07,bloomThreshold:3.2,bloomSpread:.75,saturation:1.04,contrast:1.04,vignette:.18,gain:[1,1,1],lift:[0,0,.004]}},golden:{label:"Golden hour",elevation:22,azimuth:-68,sky:{zenith:n(.04,.11,.37),horizon:n(1,.6,.34),glow:n(1.7,.72,.22),sun:n(15,8.2,3.2),horizonK:2.5,cloud:[.42,.9,2,.006],cloudLit:n(1.35,.8,.46),cloudDark:n(.3,.26,.34)},sun:16758908,sunI:3.3,hemiSky:12898542,hemiGround:8016438,hemiI:.3,env:1,probe:.42,probeSat:.5,contact:.4,envRing:[.1,.07,.05],envGround:[.08,.06,.04],fog:15247480,fogNear:160,fogFar:900,look:{exposure:1.28,bloom:.1,bloomThreshold:2.6,bloomSpread:.8,saturation:1.08,contrast:1.05,vignette:.26,gain:[1.05,1,.92],lift:[.007,.002,0]}},night:{label:"Night",elevation:72,azimuth:20,sky:{zenith:n(.0015,.003,.009),horizon:n(.012,.018,.03),glow:n(0,0,0),sun:n(0,0,0),horizonK:3.5,haze:n(.05,.055,.065),city:n(.045,.03,.016),moon:1,cloud:[.22,.55,1.8,.004],cloudLit:n(.03,.032,.04),cloudDark:n(.008,.01,.015)},sun:15265535,sunI:.16,floods:1900,floodColor:16054015,hemiSky:3820134,hemiGround:2040358,hemiI:.22,env:.34,contact:.55,envRing:[.012,.014,.018],envGround:[.025,.03,.034],fog:395534,fogNear:60,fogFar:320,look:{exposure:1.14,bloom:.12,bloomThreshold:2.2,bloomSpread:.85,glare:.4,glareTint:[.75,.85,1],saturation:1.06,contrast:1.08,vignette:.38,gain:[.98,1,1.04],lift:[0,.002,.006]}},dawn:{label:"Misty dawn",elevation:19,azimuth:74,sky:{zenith:n(.06,.14,.38),horizon:n(.95,.7,.66),glow:n(1.3,.62,.4),sun:n(12,7.6,4.8),horizonK:2.4,cloud:[.46,.92,2,.005],cloudLit:n(1.25,.86,.7),cloudDark:n(.3,.3,.42)},sun:16764852,sunI:3.5,hemiSky:14477048,hemiGround:6971992,hemiI:.5,env:1,probe:.46,probeSat:.42,contact:.42,envRing:[.1,.09,.09],envGround:[.08,.08,.08],fog:14930130,fogNear:50,fogFar:380,look:{exposure:1.3,bloom:.1,bloomThreshold:2.8,bloomSpread:.85,saturation:.98,contrast:1.03,vignette:.24,gain:[1.03,1,.97],lift:[.006,.004,.008]}},dusk:{label:"Blue hour",elevation:5,azimuth:-104,sky:{zenith:n(.012,.03,.15),horizon:n(.42,.3,.46),glow:n(1,.36,.2),sun:n(4.5,1.8,.8),horizonK:2.8,cloud:[.3,.8,1.9,.005],cloudLit:n(.55,.36,.42),cloudDark:n(.07,.08,.16)},sun:16751212,sunI:.9,floods:1100,floodColor:16773341,hemiSky:5926568,hemiGround:2763834,hemiI:.45,env:.6,probe:.3,probeSat:.5,contact:.5,envRing:[.03,.035,.06],envGround:[.03,.03,.04],fog:2765656,fogNear:80,fogFar:420,look:{exposure:1.2,bloom:.12,bloomThreshold:2.3,bloomSpread:.85,glare:.3,glareTint:[.9,.85,1],saturation:1.07,contrast:1.06,vignette:.32,gain:[.98,.99,1.04],lift:[.002,.002,.008]}}},K=[[-26,25,-21],[26,25,-21],[-26,25,21],[26,25,21]],g=new t.OrthographicCamera,L=new t.Matrix4,q=new t.Vector3,x={mesh:null,people:[],scanAt:-1e9,max:96,strength:.5,init(){const o=new t.PlaneGeometry(1,1).rotateX(-Math.PI/2);o.setAttribute("aAlpha",new t.InstancedBufferAttribute(new Float32Array(this.max),1));const e=new t.ShaderMaterial({transparent:!0,depthWrite:!1,fog:!1,toneMapped:!1,vertexShader:`attribute float aAlpha; varying vec2 vUv; varying float vA;
        void main() { vUv = uv; vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,fragmentShader:`varying vec2 vUv; varying float vA;
        void main() { vec2 d = vUv * 2.0 - 1.0; float r = dot(d, d); gl_FragColor = vec4(0.0, 0.0, 0.0, vA * exp(-r * 3.2) * (1.0 - smoothstep(0.7, 1.0, r))); }`});this.mesh=new t.InstancedMesh(o,e,this.max),this.mesh.count=0,this.mesh.frustumCulled=!1,this.mesh.renderOrder=1,this.mesh.userData.noAO=!0,w.add(this.mesh)},scan(){this.people=[],w.traverse(o=>{if(!o.isSkinnedMesh||!o.skeleton)return;const e=a=>o.skeleton.getBoneByName(a),s={mesh:o,hips:e("hips"),feet:[[e("footL"),e("toeL")],[e("footR"),e("toeR")]]};s.hips&&s.feet.every(([a,i])=>a&&i)&&this.people.push(s)})},shown(o){for(;o;o=o.parent)if(!o.visible)return!1;return!0},update(){const o=performance.now();o-this.scanAt>1e3&&(this.scanAt=o,this.scan());const e=this.mesh,s=e.geometry.attributes.aAlpha,a=m.a,i=m.b,r=this.strength;let h=0;const u=(d,f,c,p,l,S)=>{h>=this.max||S<.01||(m.q.setFromAxisAngle(m.up,l),m.p.set(d,.008,f),m.s.set(c,1,p),e.setMatrixAt(h,L.compose(m.p,m.q,m.s)),s.array[h++]=S)};for(const d of this.people)if(this.shown(d.mesh)&&(d.hips.updateWorldMatrix(!0,!1),a.setFromMatrixPosition(d.hips.matrixWorld),!(a.y>1.6))){u(a.x,a.z,.95,.95,0,r*.34*t.MathUtils.clamp(1.6-a.y,0,1));for(const[f,c]of d.feet){f.updateWorldMatrix(!0,!1),c.updateWorldMatrix(!0,!1),a.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(c.matrixWorld);const p=Math.min(a.y,i.y),l=t.MathUtils.clamp(1-(p-.04)/.3,0,1);u((a.x+i.x)/2,(a.z+i.z)/2,.2+.1*l,.36,Math.atan2(i.x-a.x,i.z-a.z),r*l*l)}}e.count=h,h&&(e.instanceMatrix.needsUpdate=!0,s.needsUpdate=!0)}},m={a:new t.Vector3,b:new t.Vector3,p:new t.Vector3,s:new t.Vector3,q:new t.Quaternion,up:new t.Vector3(0,1,0)};export const Env={tod:null,sky:null,sun:null,sunWide:null,hemi:null,pmrem:null,envRT:null,night:null,stars:null,floods:[],dir:new t.Vector3,init(){this.sky=new t.Mesh(new t.BoxGeometry(1,1,1),new t.ShaderMaterial({name:"PalmSky",uniforms:t.UniformsUtils.clone(b.uniforms),vertexShader:b.vertexShader,fragmentShader:b.fragmentShader,side:t.BackSide,depthWrite:!1,fog:!1,toneMapped:!1,defines:{CLOUDS:"",CLOUD_OCT:5}})),this.sky.scale.setScalar(1200),this.sky.frustumCulled=!1,this.sky.renderOrder=100,w.add(this.sky),this.sun=new t.DirectionalLight(16777215,3),this.sun.castShadow=!0,w.add(this.sun,this.sun.target),this.sunWide=new t.DirectionalLight(0,0),this.sunWide.castShadow=k,this.sunWide.visible=!1,this.sunWide.shadow.autoUpdate=!1,w.add(this.sunWide,this.sunWide.target),this.hemi=new t.HemisphereLight(13624319,7174748,.35),w.add(this.hemi),w.fog=new t.Fog(13228520,160,900),this.pmrem=new t.PMREMGenerator(I),this.buildNight(),x.init(),y.onChange(o=>this.applyShadows(o)),this.applyShadows(y.cfg()),G(()=>{const o=this.tod;this.tod=null,this.setTimeOfDay(o||"day")})},applyShadows(o=y.cfg()){const e=!!(v[this.tod]&&v[this.tod].floods),s=(i,r)=>{i.mapSize.x!==r&&(i.mapSize.set(r,r),i.map&&(i.map.dispose(),i.map=null))};s(this.sun.shadow,o.shadow),this.sun.shadow.radius=o.radius,this.sun.castShadow=!(e&&o.floodShadow>0);const a=k&&o.sunCascade>0&&!e;this.sunWide.visible=a,a&&(s(this.sunWide.shadow,o.sunCascade),this.sunWide.shadow.radius=2.2,this.sunWide.shadow.needsUpdate=!0);for(const i of this.floods)i.castShadow=e&&o.floodShadow>0,i.castShadow&&(s(i.shadow,o.floodShadow),i.shadow.radius=o.floodShadow>=1024?2:1.4);this.fitShadows()},fitOrtho(o,e){const s=o.shadow.camera,a=this.dir;s.up.set(0,0,1),Math.abs(a.z)>.9&&s.up.set(1,0,0),o.position.copy(a).multiplyScalar(150),o.target.position.set(0,0,0),o.updateMatrixWorld(),o.target.updateMatrixWorld(),g.up.copy(s.up),g.position.copy(o.position),g.lookAt(0,0,0),g.updateMatrixWorld(),L.copy(g.matrixWorld).invert();let i=1/0,r=-1/0,h=1/0,u=-1/0,d=1/0,f=-1/0;const c=(l,S)=>{for(const A of[l[0],l[1]])for(const P of[l[2],l[3]])for(const W of[l[4],l[5]])S(q.set(A,P,W).applyMatrix4(L))};c(e,l=>{i=Math.min(i,l.x),r=Math.max(r,l.x),h=Math.min(h,l.y),u=Math.max(u,l.y)}),c(O,l=>{d=Math.min(d,-l.z),f=Math.max(f,-l.z)});const p=.4;return Object.assign(s,{left:i-p,right:r+p,bottom:h-p,top:u+p,near:Math.max(.5,d-2),far:f+2}),s.updateProjectionMatrix(),Math.max(r-i,u-h)/o.shadow.mapSize.x},fitShadows(){if(!this.tod)return;const o=this.sun.shadow,e=this.fitOrtho(this.sun,V),s=o.camera.far-o.camera.near;if(o.bias=-.004/s,o.normalBias=e*1.1,this.shadowTexel=e,this.sunWide.visible){const a=this.sunWide.shadow,i=this.fitOrtho(this.sunWide,O),r=a.camera.far-a.camera.near;a.bias=-.02/r,a.normalBias=i*1.3,a.needsUpdate=!0}for(const a of this.floods)a.shadow.bias=-12e-5,a.shadow.normalBias=.05},buildNight(){const o=new t.Group,e=900,s=new Float32Array(e*3),a=new Float32Array(e*3);for(let r=0;r<e;r++){const h=Math.random(),u=Math.random()*.94+.06,d=h*Math.PI*2,f=Math.acos(u);s.set([Math.cos(d)*Math.sin(f)*1e3,Math.cos(f)*1e3,Math.sin(d)*Math.sin(f)*1e3],r*3);const c=(.25+Math.pow(Math.random(),3)*.75)*t.MathUtils.smoothstep(u,.08,.45),p=Math.random();a.set([c*(.85+p*.15),c*.9,c*(1-p*.15)],r*3)}const i=new t.BufferGeometry;i.setAttribute("position",new t.BufferAttribute(s,3)),i.setAttribute("color",new t.BufferAttribute(a,3)),this.stars=new t.Points(i,new t.PointsMaterial({size:1.5,sizeAttenuation:!1,vertexColors:!0,fog:!1,depthWrite:!1,toneMapped:!1})),this.stars.renderOrder=101,this.stars.frustumCulled=!1,o.add(this.stars),o.visible=!1,w.add(o),this.night=o;for(const[r,h,u]of K){const d=new t.SpotLight(16054015,0,0,.52,.7,2);d.position.set(r,h,u),d.target.position.set(r*.1,0,u*.25),d.castShadow=!1,d.shadow.camera.near=8,d.shadow.camera.far=90,d.visible=!1,w.add(d,d.target),this.floods.push(d)}},setTimeOfDay(o){const e=v[o]||v.day;if(this.tod===o)return;this.tod=o;const s=t.MathUtils.degToRad(e.elevation),a=t.MathUtils.degToRad(e.azimuth);this.dir.set(Math.cos(s)*Math.sin(a),Math.sin(s),Math.cos(s)*Math.cos(a)).normalize();const i=o==="night",r=!!e.floods;this.night.visible=i,this.setSky(this.sky.material.uniforms,e,i),this.sun.color.set(e.sun),this.sun.intensity=e.sunI,this.sunWide.color.set(0),this.sunWide.intensity=0,this.hemi.color.set(e.hemiSky),this.hemi.groundColor.set(e.hemiGround),this.hemi.intensity=e.hemiI,this.hemi.visible=e.hemiI>0;for(const h of this.floods)h.intensity=r?e.floods:0,h.color.set(e.floodColor||16777215),h.visible=r;this.applyShadows(),w.fog.color.set(e.fog),w.fog.near=e.fogNear,w.fog.far=e.fogFar,w.environmentIntensity=e.env,x.strength=e.contact,this.buildEnvironment(e,i,r),T.set(e.look);for(const h of this.listeners)h(o)},setSky(o,e,s){const a=e.sky,i=n(0,0,0);o.uSunDir.value.copy(this.dir),o.uSun.value.copy(a.sun),o.uZenith.value.copy(a.zenith),o.uHorizon.value.copy(a.horizon),o.uGlow.value.copy(a.glow),o.uHaze.value.copy(a.haze||i),o.uCity.value.copy(a.city||i),o.uMoon.value=a.moon||0,o.uMoonDir.value.set(-.55,.52,-.65).normalize(),o.uCloudLit.value.copy(a.cloudLit),o.uCloudDark.value.copy(a.cloudDark),o.uCloud.value.set(...a.cloud),o.uHorizonK.value=a.horizonK,o.uDisc.value=s?0:1},listeners:[],onChange(o){this.listeners.push(o)},buildEnvironment(o,e,s=e){const a=new t.Scene,i=c=>n(c[0],c[1],c[2]),r=new t.Mesh(new t.BoxGeometry(1,1,1),this.sky.material.clone());r.scale.setScalar(40);const h=r.material.uniforms;if(this.setSky(h,o,e),h.uDisc.value=0,h.uScale.value=e?1:o.probe,h.uSat.value=e?1:o.probeSat,h.uTime.value=0,a.add(r),s){const c=new t.MeshBasicMaterial({color:new t.Color(16777215).multiplyScalar(22)});for(let p=0;p<8;p++){const l=p/8*Math.PI*2+.3,S=new t.Mesh(new t.PlaneGeometry(9,2.2),c);S.position.set(Math.cos(l)*34,18,Math.sin(l)*34),S.lookAt(0,4,0),a.add(S)}}const u=new t.Mesh(new t.CylinderGeometry(30,30,24,48,1,!0),new t.MeshBasicMaterial({color:i(o.envRing),side:t.BackSide}));u.position.y=6,a.add(u);const d=new t.Mesh(new t.CircleGeometry(40,32),new t.MeshBasicMaterial({color:i(o.envGround)}));d.rotation.x=-Math.PI/2,d.position.y=-1,a.add(d);const f=this.pmrem.fromScene(a,.03,.1,200);this.envRT&&this.envRT.dispose(),this.envRT=f,w.environment=f.texture,a.traverse(c=>{c.geometry&&c.geometry.dispose(),c.material&&c.material.dispose()})},frame:0,update(o){this.sky.material.uniforms.uTime.value=o;try{x.update()}catch(e){console.warn("Palm Court: contact shadows off:",e),x.update=()=>{}}this.sunWide.visible&&++this.frame%30===0&&(this.sunWide.shadow.needsUpdate=!0)}};y.onChange(o=>{if(!Env.sky)return;const e=Env.sky.material,s=o.detail>=1?5:3;e.defines.CLOUD_OCT!==s&&(e.defines.CLOUD_OCT=s,e.needsUpdate=!0)});export const TIMES=Object.fromEntries(Object.entries(v).map(([o,e])=>[o,e.label]));
