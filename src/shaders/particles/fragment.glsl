#define PI 3.14159265359

varying vec3 vColor;
varying vec3 vPos;
varying vec4 vWorldPosition;

void main()
{
    // Center the coordinates (gl_PointCoord ranges from 0 to 1)
    vec2 coord=gl_PointCoord-.5;// Centered around (0,0)
    float distanceToCenter=length(coord);
    
    // Discard fragments outside the sphere's radius
    if(distanceToCenter>.5){
        discard;
    }
    
    // Simulate a sphere using the Z component of a pseudo-normal
    float sphereZ=sqrt(.25-distanceToCenter*distanceToCenter);// Sphere equation: x^2 + y^2 + z^2 = r^2
    vec3 normal=normalize(vec3(coord,sphereZ));
    
    // Simple lighting with a light direction
    vec3 lightDir=normalize(vec3(.5,.5,1.));// Light coming from top-right-front
    float diffuse=max(dot(normal,lightDir),0.);
    
    // Combine lighting with the particle color
    vec3 shadedColor=vColor*diffuse;

        // Final fragment color with smooth alpha near edges
    float edgeAlpha=smoothstep(.5,.48,distanceToCenter);// Smooth alpha to soften edges

    // Adjust alpha based on distance to the camera
    float depth=-vWorldPosition.z;// Invert for positive depth values
    float depthAlpha=clamp(1.-depth/2.,.1,1.);// Adjust '10.0' based on desired fade range

    
    // Combine edge alpha with depth-based alpha
    float alpha=edgeAlpha*depthAlpha;
    gl_FragColor=vec4(shadedColor,alpha);
    
    // Optional: Tone mapping and color correction
    // #include<tonemapping_fragment>
    // #include<colorspace_fragment>
}
