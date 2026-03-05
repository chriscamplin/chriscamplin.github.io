import * as THREE from 'three'
import {
  extend,
  useFrame,
  ReactThreeFiber,
  ThreeElement,
  ThreeElements,
} from '@react-three/fiber'
import { useRef, useEffect } from 'react'
//@ts-ignore
import vertexShader from '../shaders/links/vertex.glsl'
//@ts-ignore
import fragmentShader from '../shaders/links/fragment.glsl'

declare module '@react-three/fiber' {
  interface ThreeElements {
    raymarchingMaterialLinks: ThreeElement<typeof RaymarchingMaterialLinks>
  }
}

// Extend the shader material to be usable in React Three Fiber

class RaymarchingMaterialLinks extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uRadius: { value: 1.25 },
        uMouse: { value: new THREE.Vector2() },
        uLightPos: { value: new THREE.Vector3(15.0, 15.0, 15.0) },
      },
      vertexShader,
      fragmentShader,
    })
  }
}

extend({ RaymarchingMaterialLinks })

interface RaymarchingPlaneProps extends Partial<ThreeElements['mesh']> {
  scrollState: {
    progress: number
  }
}

export function RaymarchingPlaneLinks(props: RaymarchingPlaneProps) {
  const planeRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const previousScroll = useRef(0) // To track the previous scroll position
  const scrollVelocity = useRef(0) // To track scroll velocity
  const mousePosition = useRef({ x: 0.5, y: 0.5 })
  // Mouse event listener for manual mouse data capture
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = event.clientX / window.innerWidth
      mousePosition.current.y = 1.0 - event.clientY / window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Update the time uniform and resolution on each frame
  useFrame(({ clock, size }, delta) => {
    if (materialRef.current) {
      const currentScroll = props.scrollState.progress // Assume scrollState.scroll gives current scroll position
      scrollVelocity.current = (currentScroll - previousScroll.current) / delta
      previousScroll.current = currentScroll

      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
      materialRef.current.uniforms.uRadius.value = props.scrollState.progress
      materialRef.current.uniforms.uMouse.value.set(
        mousePosition.current.x,
        mousePosition.current.y,
      )
      materialRef.current.uniforms.uScroll.value = props.scrollState.progress * 0.5
    }
  })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <raymarchingMaterialLinks ref={materialRef} />
    </mesh>
  )
}
