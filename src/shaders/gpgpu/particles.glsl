uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform float uFlowFieldInfluence;
uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency;
uniform vec2 uMouse;
uniform float uScroll;
#include ../includes/simplexNoise4d.glsl

void main()
{
    float time = uTime * 0.2;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 base = texture(uBase, uv);
    
    // Dead
    if(particle.a >= 1.0)
    {
        particle.a = mod(particle.a, 1.0);
        particle.xyz = base.xyz;
    }

    // Alive
    else
    {
        // Strength
        float strength = simplexNoise4d(vec4(base.xyz * 0.2, time + 1.0));
        float influence = (uFlowFieldInfluence - 0.5) * (- 2.0);
        strength = smoothstep(influence, 1.0, strength);

        // Flow field
        vec3 flowField = vec3(
            simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 0.0, time)),
            simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 1.0, time)),
            simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 2.0, time))
        );
        flowField = normalize(flowField);
        // Mouse influence
        vec2 mouseDirection=uMouse-(gl_FragCoord.xy/resolution.xy);// Direction from particle to mouse
        float mouseDistance=length(mouseDirection);
        float mouseForce=smoothstep(0.,.5,1.-mouseDistance);// Inverse strength based on distance

        // Combine mouse and flow field forces
        vec3 mousePush=vec3(normalize(mouseDirection),0.)*mouseForce*50.*(uScroll+.05);
        particle.xyz+=(flowField*uDeltaTime*strength*uFlowFieldStrength*(uScroll+.05))+mousePush*uDeltaTime;

        // Decay
        particle.a += uDeltaTime * 0.3;
    }
    
    gl_FragColor = particle;
}