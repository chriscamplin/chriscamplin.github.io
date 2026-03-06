varying vec2 vUv;
uniform float uTime;
uniform float uVelocity;

void main(){
    vUv=uv;
    
    vec3 warpedPosition=position;
    
    // Skip trigonometric calcs unless scrolling occurs
    if(abs(uVelocity)>.0001){
        float warpFactor=uVelocity*sin(position.x+uTime*.5);
        warpedPosition.y+=warpFactor;
        warpedPosition.z+=warpFactor;
    }
    
    gl_Position=projectionMatrix*modelViewMatrix*vec4(warpedPosition,1.);
}