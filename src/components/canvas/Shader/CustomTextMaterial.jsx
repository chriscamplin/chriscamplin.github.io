import { useEffect, useMemo, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
// import { suspend } from 'suspend-react'
import * as THREE from 'three'
// import createAudio from '@/helpers/createAudio'
// import useStore from '@/helpers/store'

export function CustomTextMaterial({ geo, config }) {
  // const normalMap = useTexture('/txt/normalMap.jpg')
  const matCap = useTexture('/matCaps/1A2461_3D70DB_2C3C8F_2C6CAC-512px.png')
  const [uniforms] = useState(() => ({
    // map: { value: '' },
    resolution: { value: new THREE.Vector2() },
    uMin: { value: new THREE.Vector2() },
    uMax: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uTwistSpeed: { value: config.uTwistSpeed },
    uRotateSpeed: { value: config.uRotateSpeed },
    uTwists: { value: config.uTwists },
    uRadius: { value: config.uRadius },
  }))

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  useEffect(() => {
    // uniforms.map.value = texture
    uniforms.resolution.value = new THREE.Vector2(
      window.innerWidth,
      window.innerHeight
    )
    if (!geo) return
    uniforms.uMin.value = geo.min
    uniforms.uMax.value = geo.max
    uniforms.uRadius.value = config.uRadius
    uniforms.uTwists.value = config.uTwists

    uniforms.uTwistSpeed.value = config.uTwistSpeed
    uniforms.uRotateSpeed.value = config.uRotateSpeed
  }, [
    uniforms.resolution,
    uniforms.uMin,
    geo,
    uniforms.uMax,
    config.uRadius,
    config.uRotateSpeed,
    config.uTwistSpeed,
    config.uTwists,
    uniforms.uRadius,
    uniforms.uRotateSpeed,
    uniforms.uTwistSpeed,
    uniforms.uTwists,
  ])

  const onBeforeCompile = useMemo(
    () => (shader) => {
      // Wire up local uniform references
      shader.uniforms = { ...shader.uniforms, ...uniforms }
      // Add to top of vertex shader
      shader.vertexShader = /* glsl */ `
            #define PI 3.141592653589793
            uniform float uTwistSpeed;
            uniform float uRotateSpeed;
            uniform float uTwists;
            uniform float uRadius;
            uniform vec3 uMin;
            uniform vec3 uMax;
            uniform float uTime;
            uniform float time;

            float animationDuration = 5.;
            #define PI 3.141592653589793
            float quadraticOut(float t) {
              return -t * (t - 2.0);
            }


            float exponentialInOut(float t) {
                return t == 0.0 || t == 1.0
                  ? t
                  : t < 0.5
                    ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
                    : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
            }
            float bounceOut(float t) {
              const float a = 4.0 / 11.0;
              const float b = 8.0 / 11.0;
              const float c = 9.0 / 10.0;

              const float ca = 4356.0 / 361.0;
              const float cb = 35442.0 / 1805.0;
              const float cc = 16061.0 / 1805.0;

              float t2 = t * t;

              return t < a
                ? 7.5625 * t2
                : t < b
                  ? 9.075 * t2 - 9.9 * t + 3.4
                  : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
            }
            float bounceInOut(float t) {
              return t < 0.5
                ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0))
                : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
            }
            float sineInOut(float t) {
              return -0.5 * (cos(PI * t) - 1.0);
            }
            mat4 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                            0.0,                                0.0,                                0.0,                                1.0);
            }
            
            vec3 rotate(vec3 v, vec3 axis, float angle) {
              mat4 m = rotationMatrix(axis, angle);
              return (m * vec4(v, 1.0)).xyz;
            }
            float mapRange(float value, float min1, float max1, float min2, float max2) {
              // return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
              return clamp( min2 + (value - min1) * (max2 - min2) / (max1 - min1), min2, max2 );
            }



           
    ${shader.vertexShader}`
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>' +
          `
          float xx = mapRange(position.x, uMin.x, uMax.x, -1., 1.0);
          // twistnormal
          objectNormal = rotate(objectNormal, vec3(1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);
  
          // circled normal
          objectNormal = rotate(objectNormal, vec3(0.,0.,1.), (xx + 0.01*uTime*uRotateSpeed)*PI);
      
      `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>' +
          `
        vec3 pos = transformed;
        float theta = (xx + 0.01*uTime*uRotateSpeed)*PI;
        pos = rotate(pos,vec3(1.,0.,0.), 0.5*PI*uTwists*xx + 0.01*uTime*uTwistSpeed);


        
        vec3 dir = vec3(sin(theta), cos(theta),pos.z);
        vec3 circled = vec3(dir.xy*uRadius,pos.z) + vec3(pos.y*dir.x,pos.y*dir.y,0.);

        transformed = circled;

      `
      )
      console.log(shader.fragmentShader)
      // Add to top of fragment shader
      // shader.fragmentShader = shader.fragmentShader.replace(
      //   /#include <output_fragment>/,
      //   /* glsl */ `
      //    gl_FragColor = vec4(1.,0.,0.,1.);
      // `
      // )
    },
    [uniforms]
  )

  return (
    // <meshPhongMaterial
    //   onBeforeCompile={onBeforeCompile}
    //   onUpdate={(m) => (m.needsUpdate = true)}
    //   customProgramCacheKey={() => onBeforeCompile.toString()}
    //   side={THREE.DoubleSide}
    //   reflectivity={1}
    //   lights={true}
    //   receiveShadow={true}
    //   castShadow={true}
    //   // map={texture}
    // />
    <meshMatcapMaterial
      onBeforeCompile={onBeforeCompile}
      onUpdate={(m) => (m.needsUpdate = true)}
      customProgramCacheKey={() => onBeforeCompile.toString()}
      matcap={matCap}
      // normalMap={normalMap}
      side={THREE.DoubleSide}
    />

    // <meshPhysicalMaterial
    //   emmisive={new THREE.Color(1, 0, 0)}
    //   onBeforeCompile={onBeforeCompile}
    //   onUpdate={(m) => (m.needsUpdate = true)}
    //   reflectivity={1}
    //   iridescence={1}
    //   metalness={0.5}
    //   roughness={0}
    //   thickness={1}
    //   shininess={1}
    //   clearcoat={1}
    //   transmission={1}
    //   thinFilmThickness={'167mm'}
    //   thinFilmIor={1.1}
    // />
  )
}
