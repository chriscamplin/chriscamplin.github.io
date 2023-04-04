uniform float time;
uniform vec3 color;
uniform float fraction;

varying vec2 vUv;
varying float vGradPos;
varying float vDistance;
varying vec3 vNormal;
varying vec3 vViewPosition;

#pragma glslify: random = require(glsl-random)

vec3 color1=vec3(1.0, 0.8353, 0.0);
vec3 color2=vec3(1.,1.,1.);
vec3 color3=vec3(0.0, 1.0, 0.9686);

void main() {
    if(vDistance<fraction)discard;
    float step1=0.45;
    float step2=.65;
    float step3=.775;

    vec3 color=mix(color1,color2,smoothstep(step1,step2,vGradPos));
    //vec3 color2=mix(color3,color4,smoothstep(step3,step4,vGradPos));
    color=mix(color,color3,smoothstep(step2,step3,vGradPos));
    // hack in a fake pointlight at camera location, plus ambient
    vec3 normal=normalize(vNormal);
    vec3 lightDir=normalize(vViewPosition);

    float dotProduct=max(dot(normal,lightDir),0.)+.2;
    // gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
    //gl_FragColor.rgba = vec4(color.rgb, 1.);
    // trick to make the clipped ends appear solid
    gl_FragColor=(gl_FrontFacing)?vec4(color*dotProduct,1.):vec4(color,1.);
}
