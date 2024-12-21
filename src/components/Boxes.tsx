import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import React from 'react'

const TILE_SIZE = 0.125
function SpinningBoxWebGL({ scale, scrollState }: { scale: any; scrollState: any }) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null)
  const matrix = new THREE.Matrix4()
  const dummy = new THREE.Object3D()
  const previousScroll = React.useRef(0) // To track the previous scroll position
  const scrollVelocity = React.useRef(0) // To track scroll velocity

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const currentScroll = scrollState.progress // Assume scrollState.scroll gives current scroll position
    scrollVelocity.current = (currentScroll - previousScroll.current) / delta
    previousScroll.current = currentScroll

    // Update rotation for each instance using the matrix
    for (let i = 0; i < 4; i++) {
      dummy.position.set(0, i - 2, 0)
      dummy.rotation.set(
        0,
        scrollState.progress * (i + scrollVelocity.current * 0.1) * Math.PI * 2,
        0
      )
      dummy.scale.set(1.5 / i, 2 / i, 1.5 / i)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group scale={scale.xy.min() * 0.5}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 4]}>
        <cylinderGeometry args={[1, TILE_SIZE * 3, TILE_SIZE * 4, 3]} />
        <meshStandardMaterial color='white' roughness={0.5} metalness={0.5} />
      </instancedMesh>
    </group>
  )
}
