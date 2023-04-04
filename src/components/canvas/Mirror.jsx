import { useRef } from 'react'
import { CubeCamera } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Mirror = ({ type = 'sphere', scale = 10 }) => {
  const mirrorRef = useRef()
  useFrame((gl, delta) => {
    mirrorRef.current.rotation.x += Math.PI * delta * 0.01
  })
  return (
    <CubeCamera near={0.01} far={100} resolution={1024}>
      {(texture) => (
        <mesh scale={[scale, scale, scale]} ref={mirrorRef}>
          {type === 'sphere' && <sphereGeometry args={[20, 32, 16]} />}
          {type === 'box' && <boxGeometry args={[100, 100, 100]} />}
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.1}
            roughness={0.0}
            metalness={1}
            envMap={texture}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </CubeCamera>
  )
}
export default Mirror
