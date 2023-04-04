precision highp float;

in vec3 vNormal;
in vec2 vUv;
in vec3 vViewPosition;
out vec4 outColor;

uniform vec3 color;
uniform float animateRadius;
uniform float animateStrength;

// #pragma glslify: faceNormal = require('glsl-face-normal');

void main () {
  // handle flat and smooth normals
  vec3 normal = vNormal;
  // #ifdef FLAT_SHADED
  //   normal = faceNormal(vViewPosition);
  // #endif

  // Z-normal "fake" shading
  float diffuse = normal.z * 0.5 + 0.5;

  // add some "rim lighting"
  vec3 V = normalize(vViewPosition);
  float vDotN = 1.0 - max(dot(V, normal), 0.0);
  float rim = smoothstep(0.5, 1.0, vDotN);
  diffuse += rim * 2.0;

  // we'll animate in the new color from t.,he center point
  float distFromCenter = clamp(length(vViewPosition) / 5.0, 0.0, 1.0);
  float edge = 0.05;
  float t = animateRadius;
  vec3 curColor = mix(color, vec3(1.), smoothstep(t - edge, t + edge, vUv.y) * animateStrength);

  // final color
  outColor = vec4(diffuse * curColor, 1.0);
}