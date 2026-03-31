uniform float fraction;

varying float vGradPos;
varying float vDistance;
varying float vLight;

const vec3 COLOR_1 = vec3(1.0, 0.8353, 0.0);
const vec3 COLOR_2 = vec3(1.0, 1.0, 1.0);
const vec3 COLOR_3 = vec3(0.0, 1.0, 0.9686);

const float STEP_1 = 0.45;
const float STEP_2 = 0.65;
const float STEP_3 = 0.775;

void main() {
    if (vDistance < fraction) discard;

    vec3 gradientColor = mix(COLOR_1, COLOR_2, smoothstep(STEP_1, STEP_2, vGradPos));
    gradientColor = mix(gradientColor, COLOR_3, smoothstep(STEP_2, STEP_3, vGradPos));

    gl_FragColor = gl_FrontFacing ? vec4(gradientColor * vLight, 1.0) : vec4(gradientColor, 1.0);
}
