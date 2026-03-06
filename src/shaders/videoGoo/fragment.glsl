uniform sampler2D uHovermap;
uniform float uAlpha;
uniform float uTime;
uniform float uProgressHover;
uniform float uProgressClick;
uniform sampler2D uVideoTexture;

uniform vec2 uRes;
uniform vec2 uMouse;

varying vec2 vUv;

// --- Simplex Noise 3D ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
    return 1.0 - smoothstep(_radius - (_radius * blurriness), _radius + (_radius * blurriness), dot(dist, dist) * 4.0);
}

void main() {
    vec2 resolution = uRes * PR;
    float time = uTime * 0.05;
    float progress = uProgressClick;
    float progressHover = uProgressHover;
    
    vec2 st = gl_FragCoord.xy / resolution.xy - vec2(0.5);
    st.y *= resolution.y / resolution.x;
    
    // Calculate mouse (math pre-calculated in JavaScript)
    vec2 mouse = uMouse * -0.5;
    mouse.y *= resolution.y / resolution.x;
    
    vec2 cpos = st + mouse;
    
    // Base circle
    float c2 = circle(cpos, 0.01 * progressHover + progress * 0.5, 2.0);
    
    // Expensive noise logic deferred unless interaction has triggered 
    float nc = 0.0;
    float nh = 0.0;
    
    if (progressHover > 0.001) {
        float offX = vUv.x + sin(vUv.y + time * 2.0);
        float offY = vUv.y - time * 0.2 - cos(time * 2.0) * 0.1;
        
        vec3 noisePos1 = vec3(offX, offY, time * 0.5) * 8.0;
        vec3 noisePos2 = vec3(offX, offY, time * 0.5) * 2.0;
        
        nc = snoise3(noisePos1) * progressHover;
        nh = snoise3(noisePos2) * 0.1;
    }
    
    c2 = smoothstep(0.1, 0.8, c2 * 5.0 + nc * 3.0 - 1.0);
    
    vec4 video = texture2D(uVideoTexture, vUv);
    
    // Displaced hover mapping
    vec4 hover = texture2D(uHovermap, vUv + vec2(nh) * progressHover * (1.0 - progress));
    vec4 color = vec4(0.7765, 0.7765, 0.7765, 1.0);
    hover = mix(hover, color * hover, 0.8 * (1.0 - progress));
    
    video = mix(video, hover, clamp(c2 + progress, 0.0, 1.0));
    
    gl_FragColor = vec4(video.rgb, uAlpha * 0.1);
}