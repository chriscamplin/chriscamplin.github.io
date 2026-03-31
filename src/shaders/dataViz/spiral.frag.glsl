uniform float uReveal;
uniform float uOpacity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vGradientPosition;
varying float vDistance;
varying vec3 vNormalDirection;

void main() {
  if (vDistance > uReveal) {
    discard;
  }

  vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 1.0, vGradientPosition));
  float fresnel = pow(1.0 - abs(vNormalDirection.z), 2.0);
  color += fresnel * 0.18;

  gl_FragColor = vec4(color, uOpacity);
}
