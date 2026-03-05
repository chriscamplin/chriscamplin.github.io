// Uniforms
uniform float uTime;
uniform float uScroll;
uniform vec2 uResolution;
uniform vec2 uMouse;
varying vec2 vUv;

// Standard, web-safe rotation matrix
mat2 rotate(float angle){
    float s=sin(angle),c=cos(angle);
    return mat2(c,-s,s,c);
}

// Equilateral Triangle SDF
float sdEquilateralTriangle(in vec2 p,in float r,in float angle){
    const float k=sqrt(3.);
    p.x=abs(p.x)-r;
    p.y=p.y+r/k;
    if(p.x+k*p.y>0.)p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;
    p.x-=clamp(p.x,-2.*r,0.);
    // The max(..., 0.1) is kept from original to handle inner shape inversions safely
    return max(-length(p*rotate(angle))*sign(p.y),.1);
}

// Cheap pseudo-random noise for film grain
float hash(vec2 p){
    return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);
}

void main(){
    vec2 res=uResolution.xy;
    
    // 1. Calculate base UVs ONCE outside the loop (using vUv is faster than gl_FragCoord)
    vec2 baseUv=(vUv-.5);
    baseUv.x*=res.x/res.y;
    
    // Base background color instead of absolute black
    vec4 color=vec4(.02,.02,.04,1.);
    
    // Added uTime so the shader animates on its own, enhanced by uScroll
    float t=(uTime*.03)-(uScroll*1.5);
    vec2 mousePos=(uMouse-.5)*8.;
    
    // Main Raymarching/Accumulation Loop
    for(float i=1.5;i>.036;i-=.1){
        
        float angle=(t+i)*2.;
        
        // Matrix transformations
        mat2 m=mat2(sin(angle),1.5,-1.5,1.5);
        vec2 uv=baseUv*m*rotate(i+angle+t);
        
        // Warp space using the mouse position (added tiny offset to prevent Division by Zero NaN)
        vec2 warpedP=(mousePos*.25)/(uv+.0001);
        
        // Compute SDF
        float triangle=sdEquilateralTriangle(warpedP,i,angle*.1+t);
        
        // Smooth, resolution-independent anti-aliasing
        float alpha=smoothstep(.095,.105,triangle)*.9;
        
        // Procedural Hue Generation
        vec4 hue=sin(i/.3+angle/3.+vec4(-2.,2.,8.,0.))*.3+.7;
        
        // Blend Layer
        color=mix(hue,color,alpha);
        
        // Soft shading / fake inner glow
        // Note: hue/hue mathematically == vec4(1.0)
        vec4 shade=hue+.089*alpha*uv.y/triangle;
        
        // Clamped mix factor to prevent mobile driver artifacting on values > 1.0
        float glowFactor=clamp(.109/triangle,0.,1.);
        color*=mix(vec4(1.),shade,glowFactor);
    }
    
    // --- POST-PROCESSING & CHEAP VISUAL EFFECTS ---
    
    // 1. Film Grain (helps prevent gradient banding)
    color.rgb+=(hash(vUv+uTime)-.5)*.05;
    
    // 2. Vignette (focuses attention to the center)
    float vignette=1.-.35*dot(baseUv,baseUv);
    color.rgb*=smoothstep(0.,1.,vignette);
    
    // 3. Contrast / S-Curve (Creates a fake bloom/punchy feel)
    color.rgb=smoothstep(0.,1.05,color.rgb);
    
    // 4. Gamma Correction (Converts linear color to standard Web sRGB color space)
    color.rgb=pow(color.rgb,vec3(1./2.2));
    
    gl_FragColor=color;
}