varying float vGradPos;
varying float vDistance;
varying float vLight;

attribute float gradientPosition;
attribute float distance;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 viewNormal = normalize(normalMatrix * normal);
  vec3 viewDirection = normalize(-mvPosition.xyz);

  vGradPos = gradientPosition;
  vDistance = distance;
  vLight = max(dot(viewNormal, viewDirection), 0.0) + 0.2;

  gl_Position = projectionMatrix * mvPosition;
}
