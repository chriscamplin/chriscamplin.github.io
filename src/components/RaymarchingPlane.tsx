import * as THREE from 'three'
import { extend, useFrame, ThreeElement, ThreeElements } from '@react-three/fiber'
import { useRef, useEffect } from 'react'

import vertexShader from '../shaders/blob/vertex.glsl'
import fragmentShader from '../shaders/blob/fragment.glsl'

// 1. Define the class first
class RaymarchingMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uRadius: { value: 1.25 },
        uMouse: { value: new THREE.Vector2() },
        uLightPos: { value: new THREE.Vector3(15.0, 15.0, 15.0) },
      },
      vertexShader,
      fragmentShader,
    })
  }

  // Add getters/setters if you want to pass these as props directly
  // like <raymarchingMaterial uTime={1} />
  get uTime() {
    return this.uniforms.uTime.value
  }
  set uTime(v) {
    this.uniforms.uTime.value = v
  }
  get uResolution() {
    return this.uniforms.uResolution.value
  }
  set uResolution(v) {
    this.uniforms.uResolution.value = v
  }
  get uRadius() {
    return this.uniforms.uRadius.value
  }
  set uRadius(v) {
    this.uniforms.uRadius.value = v
  }
  get uMouse() {
    return this.uniforms.uMouse.value
  }
  set uMouse(v) {
    this.uniforms.uMouse.value = v
  }
}

// 2. Extend and declare the types
extend({ RaymarchingMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    raymarchingMaterial: ThreeElement<typeof RaymarchingMaterial>
  }
}

// 3. Define Props interface
interface RaymarchingPlaneProps extends Partial<ThreeElements['mesh']> {
  scrollState: {
    progress: number
  }
}

export function RaymarchingPlane({ scrollState, ...props }: RaymarchingPlaneProps) {
  // Type the refs specifically
  const planeRef = useRef<THREE.Mesh>(null!)
  const materialRef = useRef<RaymarchingMaterial>(null!)

  const previousScroll = useRef(0)
  const scrollVelocity = useRef(0)
  const mousePosition = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = event.clientX / window.innerWidth
      mousePosition.current.y = 1.0 - event.clientY / window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame(({ clock, size }, delta) => {
    if (materialRef.current) {
      const currentScroll = scrollState.progress
      scrollVelocity.current = (currentScroll - previousScroll.current) / delta
      previousScroll.current = currentScroll

      // Uniforms are now typed correctly through the RaymarchingMaterial class
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uResolution.value.set(size.width, size.height)
      materialRef.current.uniforms.uRadius.value = scrollState.progress
      materialRef.current.uniforms.uMouse.value.set(
        mousePosition.current.x,
        mousePosition.current.y,
      )
    }
  })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <raymarchingMaterial ref={materialRef} />
    </mesh>
  )
}
