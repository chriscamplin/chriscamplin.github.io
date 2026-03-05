import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import React, { useMemo } from 'react'

export function BackPlate() {
  const { viewport } = useThree()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uColorA: { value: new THREE.Color('#a1a7a6') },
        uColorB: { value: new THREE.Color('#202020') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        void main(){
          vec2 uv = vUv;
          // radial gradient
          vec2 p = uv - 0.5;
          float r = length(p);
          float g = smoothstep(0.75, 0.05, r);
          // subtle noise/grain
          float n = (hash(uv * 1200.0) - 0.5) * 0.035;
          vec3 col = mix(uColorA, uColorB, g + n);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false,
    })
  }, [])

  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
      <primitive object={material} attach='material' />
    </mesh>
  )
}
