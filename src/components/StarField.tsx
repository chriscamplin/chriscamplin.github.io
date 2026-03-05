import * as THREE from 'three'
import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function StarField({
  count = 1200,
  radius = 120,
  depth = 60,
}: {
  count?: number
  radius?: number
  depth?: number
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // random in a cylinder-ish volume behind the portrait
      const r = radius * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      positions[i3 + 0] = Math.cos(a) * r
      positions[i3 + 1] = (Math.random() - 0.5) * radius * 0.7
      positions[i3 + 2] = -Math.random() * depth - 20 // push behind
      sizes[i] = Math.random() * 1.5 + 0.5
    }
    return { positions, sizes }
  }, [count, radius, depth])

  useFrame((_, dt) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y += dt * 0.02
    pointsRef.current.rotation.x += dt * 0.01
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach='attributes-position' args={[positions, 3]} />
        <bufferAttribute attach='attributes-size' args={[sizes, 1]} />
      </bufferGeometry>

      {/* simple point sprite */}
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = size * (80.0 / -mv.z);
          }
        `}
        fragmentShader={`
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(vec3(1.0), a * 0.35);
          }
        `}
      />
    </points>
  )
}
