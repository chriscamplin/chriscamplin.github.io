import * as THREE from 'three'
import { extend, useFrame, ThreeElement, ThreeElements } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
//@ts-ignore
import vertexShader from '../shaders/triangles/vertex.glsl'
//@ts-ignore
import fragmentShader from '../shaders/triangles/fragment.glsl'

declare module '@react-three/fiber' {
  interface ThreeElements {
    raymarchingMaterialTriangles: ThreeElement<typeof RaymarchingMaterialTriangles>
  }
}

interface RaymarchingPlaneProps extends Partial<ThreeElements['mesh']> {
  scrollState: {
    progress: number
  }
}

// Extend the shader material to be usable in React Three Fiber
class RaymarchingMaterialTriangles extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 1 },
        uScroll: { value: 1 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2),
        },
        uRadius: { value: 1.25 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uLightPos: { value: new THREE.Vector3(15.0, 15.0, 15.0) },
      },
      vertexShader,
      fragmentShader,
    })
  }
}

extend({ RaymarchingMaterialTriangles })

interface RaymarchingPlaneProps extends Partial<ThreeElements['mesh']> {
  scrollState: {
    progress: number
  }
}

export function RaymarchingPlaneTriangles(props: RaymarchingPlaneProps) {
  const planeRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const previousScroll = useRef(0) // To track the previous scroll position
  const scrollVelocity = useRef(0) // To track scroll velocity
  const mousePosition = useRef({ x: -0.05, y: 0.05 })
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
      materialRef.current.uniforms.uResolution.value.set(size.width * 2, size.height * 2)
      materialRef.current.uniforms.uRadius.value = props.scrollState.progress
      materialRef.current.uniforms.uMouse.value.set(
        mousePosition.current.x,
        mousePosition.current.y,
      )
      materialRef.current.uniforms.uScroll.value = 1.25 + props.scrollState.progress * 0.5 //props.scrollState.progress * 0.5
    }
  })

  // useFrame(() => {
  //   if (!materialRef.current) return
  //   console.log(materialRef.current.uniforms.uMouse.value)
  //   console.log(mousePosition.current)
  // })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <raymarchingMaterialTriangles ref={materialRef} />
    </mesh>
  )
}
