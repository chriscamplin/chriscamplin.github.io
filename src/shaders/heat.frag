uniform float fraction;

varying float vGradPos;
varying float vDistance;
varying float vLight;

const vec3 COLOR_1 = vec3(0.2863, 0.6157, 0.9686);
const vec3 COLOR_2 = vec3(1.0, 1.0, 1.0);
const vec3 COLOR_3 = vec3(1.0, 0.6706, 0.2902);
const vec3 COLOR_4 = vec3(1.0, 0.3373, 0.3373);

const float STEP_1 = 0.25;
const float STEP_2 = 0.655;
const float STEP_3 = 0.775;
const float STEP_4 = 0.85;

void main() {
    if (vDistance < fraction) discard;

    vec3 gradientColor = mix(COLOR_1, COLOR_2, smoothstep(STEP_1, STEP_2, vGradPos));
    vec3 edgeColor = mix(COLOR_3, COLOR_4, smoothstep(STEP_3, STEP_4, vGradPos));
    gradientColor = mix(gradientColor, edgeColor, smoothstep(STEP_2, STEP_3, vGradPos));

    gl_FragColor = gl_FrontFacing ? vec4(gradientColor * vLight, 1.0) : vec4(gradientColor, 1.0);
}
