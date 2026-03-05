#define PI 3.14159265359
#define MAX_STEPS 100
#define SURF_DIST .001
#define MAX_DIST 50.

uniform float uTime;
uniform float uRadius;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec3 uLightPos;
varying vec2 vUv;

// Globals to store precomputed scene values per-pixel
// This prevents evaluating sin/cos 100+ times per pixel inside the raymarch loop!
vec3 gPos[5];
float gSizes[5];

vec3 palette(float t){
    return.5+.5*cos((PI*2.)*(t+vec3(.4,1.2,.8)));
}

float sphereSDF(vec3 p,float r){
    return length(p)-r;
}

float smin(float a,float b,float k){
    float h=clamp(.5+.5*(b-a)/k,0.,1.);
    return mix(b,a,h)-k*h*(1.-h);
}

// Compute dynamic sphere attributes ONCE per pixel
void initScene(){
    float r=uRadius+1.;
    vec3 m=vec3(uMouse-.5,0.)*20.;
    
    gPos[0]=vec3(sin(uTime*.5)*1.5,-cos(uTime*.6)*.5,0.)+m*.2;
    gPos[1]=vec3(1.5+sin(uTime*.8),-1.5+cos(uTime*.4),-1.)-m*.2;
    gPos[2]=vec3(-1.+sin(uTime*.7)*1.5,-.5+cos(uTime*.9)*.5,1.)+m*.4;
    gPos[3]=vec3(.5+cos(uTime*.3)*1.5,-1.5+sin(uTime*.5)*.5,-.5)-m*.6;
    gPos[4]=vec3(-1.5+cos(uTime*.2),-1.+sin(uTime*.6),.5)+m*.06;
    
    gSizes[0]=1.*r;
    gSizes[1]=.8*r;
    gSizes[2]=1.2*r;
    gSizes[3]=.9*r;
    gSizes[4]=1.1*r;
}

float sceneSDF(vec3 p){
    float d=sphereSDF(p-gPos[0],gSizes[0]);
    for(int i=1;i<5;i++){
        d=smin(d,sphereSDF(p-gPos[i],gSizes[i]),1.5);
    }
    return d;
}

// Optimized Tetrahedral normal calculation (4 SDF taps instead of 6)
vec3 getNormal(vec3 p){
    vec2 e=vec2(1.,-1.)*.001;
    return normalize(
        e.xyy*sceneSDF(p+e.xyy)+
        e.yyx*sceneSDF(p+e.yyx)+
        e.yxy*sceneSDF(p+e.yxy)+
        e.xxx*sceneSDF(p+e.xxx)
    );
}

// Raymarch function returns distance. Also outputs the steps taken for fake AO.
float raymarch(vec3 ro,vec3 rd,out int steps){
    float dO=0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p=ro+rd*dO;
        float dS=sceneSDF(p);
        dO+=dS;
        steps=i;
        if(dS<SURF_DIST||dO>MAX_DIST)break;
    }
    return dO;
}

void main(){
    initScene();// Calculate dynamic variables once globally
    
    vec2 uv=vUv*2.-1.;
    uv.x*=uResolution.x/uResolution.y;
    
    vec3 ro=vec3(uMouse,5.);// Ray origin
    vec3 rd=normalize(vec3(uv,-1.));// Ray direction
    
    int steps;
    float dist=raymarch(ro,rd,steps);
    
    // Background: Radial dark gradient
    //vec3 color=vec3(.02,.03,.08)*(1.-length(uv)*.4);
    vec4 finalOutput=vec4(0.,0.,0.,0.);

    if(dist<MAX_DIST){
        vec3 p=ro+rd*dist;
        vec3 n=getNormal(p);
        vec3 v=normalize(ro-p);
        vec3 l=normalize(uLightPos-p);
        
        // Base Diffuse & Specular
        float dif=max(dot(n,l),0.);
        vec3 ref=reflect(-l,n);
        float spe=pow(max(dot(v,ref),0.),32.);
        
        // EFFECT 1: Fresnel rim lighting (jelly-like edges)
        float fresnel=pow(1.-max(dot(n,v),0.),4.);
        
        // EFFECT 2: Iridescent coloring (moves across the object space)
        vec3 albedo=palette(length(p)*.15-uTime*.2);
        
        // EFFECT 3: Fake Ambient Occlusion based on raymarch iterations
        // Objects clustered together take more steps to solve, generating shadows.
        float ao=1.-float(steps)/float(MAX_STEPS);
        ao=clamp(ao*ao+.2,0.,1.);
        
        // Combine lighting
        vec3 color=albedo*dif*ao;
        color+=vec3(1.)*spe*ao;// Specular highlight
        color+=albedo*fresnel*.8;// Rim light
        color+=albedo*.1*ao;// Ambient fill light
        finalOutput=vec4(color,1.);

    }
    
    // EFFECT 4: Vignette (darkens corners of screen)
    finalOutput*=1.-dot(uv,uv)*.15;
    
    // EFFECT 5: Gamma Correction (essential for realistic lighting gradients)
    finalOutput.rgb=pow(finalOutput.rgb,vec3(.4545));
    
    gl_FragColor=finalOutput;
}