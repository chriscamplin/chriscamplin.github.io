#define PI 3.14159265359

uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;

attribute vec2 aParticlesUv;
attribute vec3 aColor;
attribute float aSize;

varying vec3 vColor;
varying vec3 vPos;
varying vec4 vWorldPosition;
varying float vViewZ;
varying vec3 vViewPos;

vec3 palette(float t){
    return .5+.5*cos((PI*2.)*(t+vec3(.4,.2,.1)));
}

void main(){
    vec4 particle=texture2D(uParticlesTexture,aParticlesUv);
    
    vec4 modelPosition=modelMatrix*vec4(particle.xyz,1.);
    vec4 viewPosition=viewMatrix*modelPosition;
    
    vViewZ=-viewPosition.z;
    vViewPos=viewPosition.xyz;
    
    vec4 projectedPosition=projectionMatrix*viewPosition;
    gl_Position=projectedPosition;
    
    float sizeIn=smoothstep(0.,.1,particle.a);
    float sizeOut=1.-smoothstep(.7,1.,particle.a);
    float size=min(sizeIn,sizeOut);
    
    gl_PointSize=size*aSize*uSize*uResolution.y;
    gl_PointSize*=(1./-viewPosition.z);
    
    vColor=palette(aParticlesUv.x);
    vPos=projectedPosition.xyz;
    vWorldPosition=modelPosition;
}