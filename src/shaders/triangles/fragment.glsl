
#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST.0001
#define PI 3.14159265359
uniform float uTime;
uniform float uScroll;
uniform float uRadius;
uniform vec2 uResolution;
uniform vec2 uMouse;
varying vec2 vUv;
uniform vec3 uLightPos;

// learning from Xor: https://www.shadertoy.com/view/ctGyWK

mat2 rotate(float angle){
    return mat2(cos(angle/4.+vec4(0,11,33,0)));
}

float roundSquareSdf(vec2 uv,float radius,float angle){
    
    return max(length(uv-=rotate(angle)*clamp(uv*rotate(angle),-radius,radius)),.1);
}

// https://iquilezles.org/articles/distfunctions2d/
float sdEquilateralTriangle(in vec2 p,in float r,in float angle)
{
    const float k=sqrt(3.);
    p.x=abs(p.x)-r;
    p.y=p.y+r/k;
    if(p.x+k*p.y>0.)p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;
    p.x-=clamp(p.x,-2.*r,0.);
    return max(-length(p*rotate(angle))*sign(p.y),.1);
}

void main() {
    //Initialize hue
    vec4 hue;
    
    //Uvs and resolution for scaling
    vec2 res=uResolution.xy;
    vec2 uv=vUv;
   // uv.x*=uResolution.x/uResolution.y;
    
    vec4 color=vec4(0.);
    
    //Alpha, length, angle and iterator/radius
    float Alpha;
    float angle;
    float t=uScroll*1.5;
    vec3 mousePosition=vec3(uMouse-.5,0.)*2.;

    for(float i=1.5;i>.036;i-=.1){
        //Smoothly rotate a half at a time from xor
        //uv=mousePosition.xy;

        angle-=sin(angle-=sin(angle=(t+i)*8.));
        // update UV inside the loop
        uv=(gl_FragCoord.xy+gl_FragCoord.xy-res.xy)/res.x;
        uv*=mat2(sin(angle=(t+i)*2.),1.5,-1.5,1.5);
        uv*=rotate(i+angle+t);
        //Compute rounded triangle SDF
        float triangle=sdEquilateralTriangle(mousePosition.xy/uv,i,angle+uTime);
        
        //Compute anti-aliased alpha using SDF from Xor
        float Alpha=min((triangle-.1)*res.y*res.x*.2,.9);
        //Pick layer color from xor
        gl_FragColor=mix(hue=sin(i/.4+angle/3.+vec4(-2,2,8,0))*.3+.7,gl_FragColor,Alpha);
        //Soft shading from xor
        gl_FragColor*=mix(hue/hue,hue+.089*Alpha*uv.y/triangle,.109/triangle);
    }
    
}