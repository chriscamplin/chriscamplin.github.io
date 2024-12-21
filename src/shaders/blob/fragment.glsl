#define PI 3.14159265359
uniform float uTime;
uniform float uRadius;
uniform vec2 uResolution;
uniform vec2 uMouse;
varying vec2 vUv;
uniform vec3 uLightPos;

// Custom gradient - https://iquilezles.org/articles/palettes/
vec3 palette(float t){
    return.5+.5*cos((PI*2.)*(t+vec3(.4,1.2,.8)));
}

float sphereSDF(vec3 p,float r){
    return length(p)-r;
}

float smin(float a,float b,float k){
    float h=clamp(.5+.5*(b-a)/k,0.,1.);
    return mix(b,a,h)-k*h*(1.-h);
}
vec3 repeat(vec3 p,vec3 c){
    return mod(p+.5*c,c)-.5*c;
}

float hash21(vec2 p){
    p=fract(p*vec2(234.34,435.345));
    p+=dot(p,p+34.23);
    return fract(p.x*p.y);
}

float sceneSDF(vec3 p){
    float r=(uRadius)+1.;
    
    // Define a collection of spheres with varying sizes and positions
    vec3 spherePositions[5];
    spherePositions[0]=vec3(sin(uTime*.5)*1.5,-cos(uTime*.6)*.5,0.);
    spherePositions[1]=vec3(1.5+sin(uTime*.8),-1.5+cos(uTime*.4),-1.);
    spherePositions[2]=vec3(-1.+sin(uTime*.7)*1.5,-.5+cos(uTime*.9)*.5,1.);
    spherePositions[3]=vec3(.5+cos(uTime*.3)*1.5,-1.5+sin(uTime*.5)*.5,-.5);
    spherePositions[4]=vec3(-1.5+cos(uTime*.2),-1.+sin(uTime*.6),.5);
    
    // Add interaction with mouse position
    vec3 mousePosition=vec3(uMouse-.5,0.)*20.;
    spherePositions[0]+=mousePosition*.2;
    spherePositions[1]-=mousePosition*.2;
    spherePositions[2]+=mousePosition*.4;
    spherePositions[3]-=mousePosition*.6;
    spherePositions[4]+=mousePosition*.06;
    
    float sphereSizes[5];
    sphereSizes[0]=1.*r;
    sphereSizes[1]=.8*r;
    sphereSizes[2]=1.2*r;
    sphereSizes[3]=.9*r;
    sphereSizes[4]=1.1*r;
    
    float d=sphereSDF(p-spherePositions[0],sphereSizes[0]);
    for(int i=1;i<5;i++){
        d=smin(d,sphereSDF(p-spherePositions[i],sphereSizes[i]),1.5);
    }
    
    return d;
}

vec3 getNormal(vec3 p){
    const float epsilon=.001;
    return normalize(vec3(
            sceneSDF(p+vec3(epsilon,0.,0.))-sceneSDF(p-vec3(epsilon,0.,0.)),
            sceneSDF(p+vec3(0.,epsilon,0.))-sceneSDF(p-vec3(0.,epsilon,0.)),
            sceneSDF(p+vec3(0.,0.,epsilon))-sceneSDF(p-vec3(0.,0.,epsilon))
        ));
    }
    
    vec3 raymarch(vec3 ro,vec3 rd){
        float totalDistance=0.;
        const int maxSteps=100;
        const float hitThreshold=.001;
        
        for(int i=0;i<maxSteps;i++){
            vec3 p=ro+rd*totalDistance;
            float dist=sceneSDF(p);
            if(dist<hitThreshold){
                vec3 normal=getNormal(p);
                
                // Compute lighting
                vec3 lightDir=normalize(uLightPos-p);
                float diffuse=max(dot(normal,lightDir),.0);
                vec2 gv=fract(p.xy)-.5;
                vec2 id=floor(p.xy);
                float n=hash21(id);// random val between 0 & 1;
                //gv.x*=-1.;
                float width=.1;
                if(n<.5)gv.x*=-1.;
                float a=atan(gv.x,gv.y);
                float line=abs(abs(gv.x+gv.y)-.5);
                float mask=smoothstep(.01,-.01,line-width);
                
                //color+=vec3(mask);//,.01,mask);
                
                // Stripe pattern using surface position (p.y here creates horizontal stripes)
                float stripes=.5+.5*sin(p.x*10.+uTime);// Adjust frequency with 20.0
                float smoothStripes=smoothstep(.5,.49999,stripes);// Smooth alpha to soften edges
                // Modulate colors based on the stripe pattern
                vec3 baseColor=palette((uTime*.1)-.05);
                vec3 stripeColor=palette(uTime*.1);// A contrasting stripe color
                
                // Mix base color and stripe color
                vec3 surfaceColor=mix(baseColor,stripeColor,mask);
                
                // Combine with diffuse lighting
                return surfaceColor*diffuse;
            }
            totalDistance+=dist;
            if(totalDistance>50.)break;// Escape if too far
        }
        
        return vec3(-1.);// Indicates no hit
    }
    
    void main(){
        vec2 uv=vUv*2.-1.;
        uv.x*=uResolution.x/uResolution.y;
        
        vec3 ro=vec3(0.,0.,5.);// Ray origin
        vec3 rd=normalize(vec3(uv,-1.));// Ray direction
        
        vec3 color=raymarch(ro,rd);
        if(color.r<0.){
            discard;// Remove fragments not part of spheres
        }
        
        gl_FragColor=vec4(color,1.);
    }
    