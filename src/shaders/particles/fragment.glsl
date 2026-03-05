#define PI 3.14159265359

varying vec3 vColor;
varying vec3 vPos;
varying vec4 vWorldPosition;
varying float vViewZ;
varying vec3 vViewPos;

uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogScale;

void main(){
    vec2 coord=gl_PointCoord-.5;
    float distanceToCenter=length(coord);
    
    if(distanceToCenter>.5){
        discard;
    }
    
    float sphereZ=sqrt(.25-distanceToCenter*distanceToCenter);
    vec3 normal=normalize(vec3(coord,sphereZ));
    
    vec3 lightDir=normalize(vec3(.5,.5,1.));
    float diffuse=max(dot(normal,lightDir),0.);
    
    vec3 ambientLight=vec3(.1);
    vec3 shadedColor=(vColor*diffuse)+ambientLight;
    
    vec3 viewDir=normalize(-vViewPos);
    vec3 reflectDir=reflect(-lightDir,normal);
    float specular=pow(max(dot(viewDir,reflectDir),0.),16.);
    shadedColor+=specular*vec3(1.);
    
    float edgeAlpha=smoothstep(.5,.48,distanceToCenter);
    
    float depth=-vWorldPosition.z;
    float depthAlpha=clamp(depth/3.,.1,1.);
    
    float alpha=edgeAlpha*depthAlpha;
    
    float fogZ=vViewZ*uFogScale;
    float fog=smoothstep(uFogNear,uFogFar,fogZ);
    vec3 foggedColor=mix(shadedColor,uFogColor,fog);
    
    alpha*=mix(1.,.35,fog);
    
    gl_FragColor=vec4(foggedColor,alpha);
}