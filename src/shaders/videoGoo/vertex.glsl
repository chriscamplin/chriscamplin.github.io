varying vec2 vUv;
uniform float uTime;
uniform float uVelocity;

void main(){
    vUv=uv;
    
    // Warp effect: add sine wave based on velocity
    vec3 warpedPosition=position;
    float warpFactor=uVelocity*sin(position.x+uTime*.5);
    warpedPosition.y+=warpFactor;
    warpedPosition.z+=warpFactor;
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(warpedPosition,1.);
}
