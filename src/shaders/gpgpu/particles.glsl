uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform float uFlowFieldInfluence;
uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency;
uniform vec2 uMouse;
uniform float uScroll;

#include "../includes/simplexNoise4d.glsl"

void main(){
    float time=uTime*.2;
    vec2 uv=gl_FragCoord.xy/resolution.xy;
    
    vec4 particle=texture2D(uParticles,uv);
    vec4 base=texture2D(uBase,uv);
    
    if(particle.a>=1.){
        particle.a=mod(particle.a,1.);
        particle.xyz=base.xyz;
    }else{
        float strength=simplexNoise4d(vec4(base.xyz*.2,time+1.));
        float influence=(uFlowFieldInfluence-.5)*(-2.);
        strength=smoothstep(influence,1.,strength);
        
        vec3 flowField=vec3(
            simplexNoise4d(vec4(particle.xyz*uFlowFieldFrequency+0.,time)),
            simplexNoise4d(vec4(particle.xyz*uFlowFieldFrequency+1.,time)),
            simplexNoise4d(vec4(particle.xyz*uFlowFieldFrequency+2.,time))
        );
        
        float flowLen=length(flowField);
        if(flowLen>0.){
            flowField/=flowLen;
        }
        
        vec2 mouseDirection=uMouse-(gl_FragCoord.xy/resolution.xy);
        float mouseDistance=length(mouseDirection);
        float mouseForce=smoothstep(0.,.5,1.-mouseDistance);
        
        vec2 mouseDirNorm=mouseDistance>.0001?normalize(mouseDirection):vec2(0.);
        vec3 mousePush=vec3(mouseDirNorm,0.)*mouseForce*50.*(uScroll+.05);
        
        particle.xyz+=
        (flowField*uDeltaTime*strength*uFlowFieldStrength*(uScroll+.05))+
        mousePush*uDeltaTime;
        
        particle.a+=uDeltaTime*.3;
    }
    
    gl_FragColor=particle;
}