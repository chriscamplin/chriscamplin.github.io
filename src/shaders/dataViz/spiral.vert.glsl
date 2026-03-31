attribute float gradientPosition;
attribute float distance;

varying float vGradientPosition;
varying float vDistance;
varying vec3 vNormalDirection;

void main() {
  vGradientPosition = gradientPosition;
  vDistance = distance;
  vNormalDirection = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
