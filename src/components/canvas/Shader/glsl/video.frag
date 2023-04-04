uniform float time;
uniform vec3 color;
uniform float audio;
varying vec2 vUv;
varying vec3 vLight;
varying vec3 vXyz;
varying vec3 vNorm;

// #pragma glslify: random = require(glsl-random)
uniform sampler2D map;
void main() {
  vec4 col=texture2D(map,vUv);
  //gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
  float STEP=time*.7* audio;

  float Cs=cos(STEP);
  float Si=sin(STEP);
  mat3 rot=mat3(vec3(Cs,0,Si),vec3(0,1,0),vec3(-Si,0,Cs));
  mat3 rot2=mat3(vec3(0,1,0),vec3(Cs,0,Si),vec3(-Si,0,Cs));

  vec3 light=normalize(vec3(1,1,-4));
  vec3 V=vec3(0,0,1);
  float A=.8+cos(vXyz.y*.6+STEP);
  float D=.6*clamp(dot(vNorm,light),0.,1.);
  float S=1.6*pow(clamp(dot(light,reflect(V,vNorm)),0.,1.),5.);
  vec3 A_col=vec3(1,1,1)*vNorm*rot2;
  vec3 D_col=vec3(1,1,1)*vNorm;
  vec3 S_col=vec3(1,1,1);
  vec3 LUM=A*A_col+D*D_col+S*S_col;
  vec4 v_color=vec4(LUM,1);

  vec4 finalColor = vec4(color, 1.0);
  gl_FragColor=v_color*vec4(1.)*vec4(1.);
}
