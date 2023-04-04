varying vec2 vUv;
varying vec3 vLight;
varying vec3 vXyz;
varying vec3 vNorm;
uniform float time;
uniform float audio;
uniform vec2 resolution;
attribute float vertexId;
attribute float aRandom;

#pragma glslify:PI=require('glsl-pi');
#pragma glslify:ease=require('glsl-easings/exponential-in-out');

vec3 computeVert(float angle,float H){
  float STEP=time*.7;
  float R=(cos(H*2.6+STEP*1.5+sin(STEP*4.3+H*3.)*(cos(STEP*.6)+.6))*.2+.9)*(cos(STEP*.5+H*1.4)*.3+.9);
  R*=sin((H+4.)*.375);
  
  float Q=cos(STEP*.54+H*.7);
  float dX=cos(H*1.4)*Q*1.5;
  float dY=sin(H*.75)*Q*.4;
  float dZ=sin(H*.5)*Q*.5;
  return vec3(cos(angle)*R,H,sin(angle)*R)+vec3(dX,dY,dZ);
}

vec3 computeNorm(float angle,float H){
  float dA=.01;
  float dH=.01;
  vec3 A=computeVert(angle,H);
  vec3 B=computeVert(angle+dA,H);
  vec3 C=computeVert(angle,H+dH);
  return normalize(-cross((B-A)/dA,(C-A)/dH));
}


float val = 4.0;
void main() {
  vUv = uv;
  vec3 pos = position;
  vec3 norm = normal;
  int NUM_ROT=32;
  float dH=.05;

  float STEP=time*.7;

  int base=int(vertexId)/10;
  int level=int(base)/NUM_ROT;
  int idx=int(mod(vertexId,6.));
  vec3 xyz=vec3(0,0,0);
  vec3 N=normalize(vec3(1,0,0));

  float dA=4.*PI/float(NUM_ROT);

  float H=float(level)*dH-4.;
  float angle=float(base)*dA;

  if(idx==0){
    xyz=computeVert(angle,H);
    N=computeNorm(angle,H);
  }
  if(idx==1){
    xyz=computeVert(angle+dA,H);
    N=computeNorm(angle+dA,H);
  }
  if(idx==2){
    xyz=computeVert(angle+dA,H+dH);
    N=computeNorm(angle+dA,H+dH);
  }

  if(idx==3){
    xyz=computeVert(angle+dA,H+dH);
    N=computeNorm(angle+dA,H+dH);
  }
  if(idx==4){
    xyz=computeVert(angle,H+dH);
    N=computeNorm(angle,H+dH);
  }
  if(idx==5){
    xyz=computeVert(angle,H);
    N=computeNorm(angle,H);
  }

  #ifdef FIT_VERTICAL
  vec2 aspect=vec2(resolution.y/resolution.x,1);
  #else
  vec2 aspect=vec2(1,resolution.x/resolution.y);
  #endif

  float Cs=cos(STEP);
  float Si=sin(STEP);
  mat3 rot=mat3(vec3(Cs,0,Si),vec3(0,1,0),vec3(-Si,0,Cs));
  mat3 rot2=mat3(vec3(0,1,0),vec3(Cs,0,Si),vec3(-Si,0,Cs));
  xyz*=.3;
  //xyz *= rot;
  //N *= rot;
  vNorm=N;
  vXyz=xyz;
  vec4 endPos = vec4(xyz.xy*aspect/(3.+xyz.z),xyz.z,1);

  vec4 finalPos = vec4(endPos.xyz, 1.0);
  // finalPos.y+=aRandom*ease(sin(uv.x*uv.y+time)*2.);
  // finalPos.y+=aRandom*ease(sin(uv.x*uv.y+time)*2.);
  // finalPos.z+=aRandom*ease(cos(uv.x*uv.y+time)*2.);

  gl_Position=projectionMatrix*modelViewMatrix*finalPos;
  //gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
