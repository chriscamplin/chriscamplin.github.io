
#define MAX_STEPS 66
#define MAX_DIST 66.
#define SURF_DIST.0001
#define PI 3.14159265359
uniform float uTime;
uniform float uScroll;
uniform float uRadius;
uniform vec2 uResolution;
uniform vec2 uMouse;
varying vec2 vUv;
uniform vec3 uLightPos;

// Custom gradient - https://iquilezles.org/articles/palettes/
vec3 palette(float t){
    return.5+.5*cos((PI*2.)*(t+vec3(.4,.2,.1)));
}

//sdLink - exact=https://iquilezles.org/articles/distfunctions/
float sdLink(vec3 p,float le,float r1,float r2)
{
    vec3 q=vec3(p.x,max(abs(p.y)-le,0.),p.z);
    return length(vec2(length(q.xy)-r1,q.z))-r2;
}

// Rotation function for 3D vectors around an arbitrary axis
vec3 rotate3d(vec3 p,vec3 axis,float angle){
    axis=normalize(axis);
    float cosAngle=cos(angle);
    float sinAngle=sin(angle);
    return p*cosAngle+cross(axis,p)*sinAngle+axis*dot(axis,p)*(1.-cosAngle);
}

// Smooth min function (smin)
float smin(float d1,float d2,float k){
    float h=clamp(.5+.5*(d2-d1)/k,0.,1.);
    return mix(d2,d1,h)-k*h*(1.-h);
}

// 3D rotation around the X-axis
mat3 rotationX(float angle){
    float s=sin(angle);
    float c=cos(angle);
    return mat3(1.,0.,0.,0.,c,-s,0.,s,c);
}

// 3D rotation around the Y-axis
mat3 rotationY(float angle){
    float s=sin(angle);
    float c=cos(angle);
    return mat3(c,0.,s,0.,1.,0.,-s,0.,c);
}

// 3D rotation around the Z-axis
mat3 rotationZ(float angle){
    float s=sin(angle);
    float c=cos(angle);
    return mat3(c,-s,0.,s,c,0.,0.,0.,1.);
}
// 2D rotation function
mat2 rot2D(float a){
    return mat2(cos(a),-sin(a),sin(a),cos(a));
}
float BASE_Y=-.7;
float CONE_HEIGHT=3.5;
float CONE_Y=.75;
float CONE_VOL=1.125;
float SMIN_BLEND=.333;
float RIPPLE_AMOUNT=2.;
// Scene function, combining the objects with smooth union (smin)
float sceneSDF(vec3 p,out vec3 color){
    float teet=(1.5*abs(sin(uTime*.125)))+.1;
    p.z-=uTime*1.;// Forward movement
    // Space repetition
    p.z=fract(p.z)-.5;// spacing: 1
    
    p.xy*=rot2D((PI*.5));
    float link=sdLink(p,2.,2.5,.2);
    vec3 col=palette(p.z*p.y);//*vec3(.7+abs(cos(uTime*.1)), .5+(abs(sin(p.y+uTime))*.666), 0.97);
    // Color the sphere white
    color=col;
    
    return link;
}

// Scene function without color (for normal calculation)
float sceneSDF(vec3 p){
    float teet=(1.5*abs(sin(uTime*.125)))+.1;
    p.z-=uTime*1.;// Forward movement
    // Space repetition
    p.z=fract(p.z)-.5;// spacing: 1
    
    p.xy*=rot2D((PI*.5));
    float link=sdLink(p,2.,2.5,.2);
    return link;
}

// Normal calculation for lighting
vec3 getNormal(vec3 p){
    float d=sceneSDF(p);// Use the version without the color output
    vec2 e=vec2(.01,0.);
    vec3 n=d-vec3(
        sceneSDF(p-e.xyy),
        sceneSDF(p-e.yxy),
        sceneSDF(p-e.yyx)
    );
    return normalize(n);
}

// Fresnel-Schlick approximation
vec3 fresnelSchlick(float cosTheta,vec3 F0){
    return F0+(1.-F0)*pow(1.-cosTheta,5.);
}

// Distribution function for specular reflection (GGX/Trowbridge-Reitz)
float distributionGGX(vec3 N,vec3 H,float roughness){
    float a=roughness*roughness;
    float a2=a*a;
    float NdotH=max(dot(N,H),0.);
    float NdotH2=NdotH*NdotH;
    
    float num=a2;
    float denom=(NdotH2*(a2-1.)+1.);
    denom=3.14159*denom*denom;// π * denom^2
    return num/denom;
}

// Geometry function (Smith's Schlick-GGX)
float geometrySchlickGGX(float NdotV,float roughness){
    float r=(roughness+1.);
    float k=(r*r)/8.;
    return NdotV/(NdotV*(1.-k)+k);
}

// Geometry term (combination of both view and light shadowing)
float geometrySmith(vec3 N,vec3 V,vec3 L,float roughness){
    float NdotV=max(dot(N,V),0.);
    float NdotL=max(dot(N,L),0.);
    float ggx1=geometrySchlickGGX(NdotV,roughness);
    float ggx2=geometrySchlickGGX(NdotL,roughness);
    return ggx1*ggx2;
}

// Cook-Torrance BRDF
vec3 cookTorranceBRDF(vec3 N,vec3 V,vec3 L,vec3 F0,float roughness,vec3 albedo,float metallic){
    vec3 H=normalize(V+L);
    float NDF=distributionGGX(N,H,roughness);// Normal Distribution Function
    float G=geometrySmith(N,V,L,roughness);// Geometry function
    vec3 F=fresnelSchlick(max(dot(H,V),0.),F0);// Fresnel term
    
    float NdotL=max(dot(N,L),0.);
    float NdotV=max(dot(N,V),0.);
    
    // Specular component
    vec3 numerator=NDF*G*F;
    float denominator=4.*NdotV*NdotL+.0001;// Avoid division by zero
    vec3 specular=numerator/denominator;
    
    // Diffuse component (Lambertian)
    vec3 kD=vec3(1.)-F;// Fresnel term reduces diffuse contribution
    kD*=(1.-metallic);// No diffuse component for metals
    vec3 diffuse=kD*albedo/3.14159;
    
    // Final outgoing light (radiance)
    return(diffuse+specular)*NdotL;
}

// PBR lighting function
vec3 pbrLighting(vec3 p,vec3 V,vec3 L,vec3 albedo,float metallic,float roughness){
    vec3 N=getNormal(p);// Surface normal
    vec3 F0=mix(vec3(.04),albedo,metallic);// Fresnel reflectance at normal incidence
    // Light intensity adjustment (increase this factor to make the light brighter)
    float lightIntensity=6.;// Increase this value to brighten the light
    
    // Cook-Torrance BRDF
    vec3 radiance=cookTorranceBRDF(N,V,L,F0,roughness,albedo,metallic);
    
    return radiance*lightIntensity;
}
// Raymarching function
float rayMarch(vec3 ro,vec3 rd,out vec3 color){
    float dist=0.;
    
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p=ro+dist*rd;
        p.x+=sin(dist*.15*uMouse.x)*2.75;// wiggle ray
        p.y-=cos(dist*.1*uMouse.y)*.75;// wiggle ray
        p.xy*=rot2D(PI*(dist*.025)+uTime*-.25);
        //p.xz*=uMouse.xy+uScroll;
        p.yz*=uMouse.xy+uScroll;

        float d=sceneSDF(p,color);
        if(d<SURF_DIST){
            return dist;
        }
        dist+=d;
        if(dist>MAX_DIST){
            return MAX_DIST;
        }
    }
    return MAX_DIST;
}
void main(){
    vec2 uv=vUv*2.-1.;
    uv.x*=uResolution.x/uResolution.y;
    // Camera setup
    vec3 ro=vec3(0.,0.,2.);// Ray origin (camera position)
    vec3 rd=normalize(vec3(uv,-1.));// Ray direction
    // Rotate the scene by applying the rotation matrices
    //ro = rotationX(-0.125) * rotationY(.15333) * ro;
    // rd = rotationY(0.5) * rotationX(-.333) * rd;
    
    // Perform raymarching
    vec3 objColor;
    float d=rayMarch(ro,rd,objColor);
    
    vec3 color=vec3(0.);
    if(d<MAX_DIST){
        // Compute position of hit
        vec3 p=ro+d*rd;
        p.x+=sin(d*.15*uMouse.x)*2.75;// wiggle ray
        p.y-=cos(d*.1*uMouse.y)*.75;// wiggle ray
        p.xy*=rot2D(PI*(d*.025)+uTime*.25);
        //p.xz*=uMouse.xy+uScroll;
        p.yz*=uMouse.xy+uScroll;

        // PBR material parameters
        objColor=palette(p.z*.0665);//*vec3(.7+abs(cos(uTime*.1)), .5+(abs(sin(p.y+uTime))*.666), 0.97);
        
        float metallic=.24;// Non-metallic surface
        float roughness=.4;// Mid-level roughness
        //p.yz *= rot2D(uTime*.125);     // rotate ray around z-axis
        // Lighting parameters
        vec3 lightPos=vec3(10.,2.,5.);
        vec3 L=normalize(lightPos-p);
        vec3 V=normalize(ro-p);
        
        // Apply PBR lighting
        color=pbrLighting(p,V,L,objColor,metallic,roughness);
    }
    
    gl_FragColor=vec4(color,1.);
}
