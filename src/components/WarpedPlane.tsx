import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { animate, useMotionValue } from 'framer-motion'

interface AnimatedMeshProps {
  track: React.RefObject<HTMLElement>
  margin: number
  priority: number
  scale: { x: number; y: number; z: number } | any
  scrollState: any
  inViewport: boolean
}
export function WarpedPlane(props: AnimatedMeshProps) {
  const { track, scale, scrollState, inViewport, ...meshProps } = props
  const mesh = useRef<THREE.Mesh>(null)

  // 1. Framer Motion values for smooth hovering
  const hoverStrength = useMotionValue(0)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  // 2. Uniforms Ref
  const uniforms = useRef({
    uTime: { value: 0.0 },
    uScrollDistortion: { value: 0.0 },
    uHover: { value: 0.0 },
  })

  // Sync Texture from DOM img
  useLayoutEffect(() => {
    const img = track.current?.querySelector('img')
    if (img) {
      const tex = new THREE.Texture(img)
      tex.needsUpdate = true
      tex.colorSpace = THREE.SRGBColorSpace
      setTexture(tex)
    }
  }, [track])

  // 3. Hover Event Listeners using Framer Motion 12 'animate'
  useEffect(() => {
    const element = track.current
    if (!element) return

    const onPointerEnter = () => {
      // Spring animation for "natural" feel
      animate(hoverStrength, 1, {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      })
    }

    const onPointerLeave = () => {
      animate(hoverStrength, 0, {
        type: 'spring',
        stiffness: 300,
        damping: 35,
      })
    }

    element.addEventListener('pointerenter', onPointerEnter)
    element.addEventListener('pointerleave', onPointerLeave)
    return () => {
      element.removeEventListener('pointerenter', onPointerEnter)
      element.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [track, hoverStrength])

  // 4. Custom Shader
  const onBeforeCompile = useCallback((shader: any) => {
    shader.uniforms.uTime = uniforms.current.uTime
    shader.uniforms.uScrollDistortion = uniforms.current.uScrollDistortion
    shader.uniforms.uHover = uniforms.current.uHover

    shader.vertexShader = `
      uniform float uTime;
      uniform float uScrollDistortion;
      uniform float uHover;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      
      // 1. Vertical Scroll Warp
      float scrollWarp = uScrollDistortion * sin(position.y * 5.0 + uTime * 2.0);
      
      // 2. Hover Ripple (Natural wave)
      // distance from center (0,0)
      float dist = distance(uv, vec2(0.5));
      float ripple = sin(dist * 10.0 - uTime * 4.0) * 0.05;
      
      // Combine them
      transformed.x += scrollWarp;
      transformed.y += scrollWarp;
      transformed.z += (scrollWarp * 2.0) + (ripple * uHover);
      `,
    )
  }, [])

  // 5. Render Loop
  const previousScroll = useRef(0)
  useFrame((state, delta) => {
    if (!inViewport) return

    // Update Time
    uniforms.current.uTime.value += delta

    // Update Hover Strength from Framer Motion
    uniforms.current.uHover.value = hoverStrength.get()

    // Update Scroll Distortion
    const currentScroll = scrollState.progress
    const velocity = (currentScroll - previousScroll.current) / Math.max(delta, 0.001)
    previousScroll.current = currentScroll

    uniforms.current.uScrollDistortion.value = THREE.MathUtils.lerp(
      uniforms.current.uScrollDistortion.value,
      velocity * 0.04,
      0.1,
    )
  })

  return (
    <mesh ref={mesh} scale={scale} {...meshProps}>
      {/* High segments required for smooth ripple */}
      <planeGeometry args={[1, 1, 64, 64]} />
      <meshBasicMaterial
        transparent
        map={texture}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'warped-plane-ripple-v2'}
      />
    </mesh>
  )
}
