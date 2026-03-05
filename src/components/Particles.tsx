import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import React, { useEffect, useState, useRef } from 'react'
import { useScrollbar } from '@14islands/r3f-scroll-rig'
/* @ts-ignore */
import generateFboPoints from '../helpers/generateFboPoints'
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
  Noise,
} from '@react-three/postprocessing'
function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField
        focusDistance={0.015} // tweak
        focalLength={0.12} // tweak
        bokehScale={3.0} // tweak
        height={480}
      />
      <Bloom intensity={0.35} luminanceThreshold={0.25} luminanceSmoothing={0.8} />
      <Vignette eskil={false} offset={0.2} darkness={0.75} />
      <Noise opacity={0.03} />
    </EffectComposer>
  )
}
export function Particles() {
  const mesh = React.useRef<THREE.Points>(null)
  const { gl } = useThree()

  const [particlesData, setParticlesData] = useState<any>(null)
  const [gpgpuData, setGpgpuData] = useState<any>(null)
  const { scroll } = useScrollbar()
  useEffect(() => {
    async function getPoints() {
      const { particles, gpgpu } = await generateFboPoints(gl)
      setParticlesData(particles)
      setGpgpuData(gpgpu)
    }

    getPoints()
  }, [])
  const light = React.useRef<THREE.DirectionalLight>(null)
  const mousePosition = useRef({ x: 0.5, y: 0.5 })

  useFrame(({ clock }, delta) => {
    if (!gpgpuData) return

    // GPGPU Update
    gpgpuData.particlesVariable.material.uniforms.uTime.value = clock.elapsedTime
    gpgpuData.particlesVariable.material.uniforms.uDeltaTime.value = delta

    // FIX: Preserve the base strength of 10 and ensure scroll velocity is absolute
    const targetStrength = 10 + Math.abs(scroll.velocity) * 3

    // Optional: Lerp it for an extra smooth falloff when scrolling stops
    gpgpuData.particlesVariable.material.uniforms.uFlowFieldStrength.value =
      THREE.MathUtils.lerp(
        gpgpuData.particlesVariable.material.uniforms.uFlowFieldStrength.value,
        targetStrength,
        0.1,
      )

    gpgpuData.particlesVariable.material.uniforms.uScroll.value = scroll.progress
    gpgpuData.computation.compute()

    if (!particlesData?.points?.material?.uniforms?.uParticlesTexture) return
    particlesData.points.material.uniforms.uParticlesTexture.value =
      gpgpuData.computation.getCurrentRenderTarget(gpgpuData.particlesVariable).texture

    gpgpuData.particlesVariable.material.uniforms.uMouse.value.set(
      mousePosition.current.x,
      mousePosition.current.y,
    )
  })

  // React.useEffect(() => {
  //   if (!light.current) return
  //   // shadows
  //   particlesData.points.material.uniforms.shadowMap = { value: light.current.shadow.map }
  //   particlesData.points.material.uniforms.lightMatrix = {
  //     value: light.current.shadow.camera.projectionMatrix.multiply(
  //       light.current.shadow.camera.matrixWorldInverse,
  //     ),
  //   }
  // }, [light.current])
  // Mouse event listener for manual mouse data capture
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = event.clientX / window.innerWidth
      mousePosition.current.y = 1.0 - event.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  return (
    particlesData?.points.geometry &&
    particlesData?.points.material && (
      <>
        <group>
          <points
            ref={mesh}
            geometry={particlesData?.points.geometry}
            material={particlesData?.points.material}
          />
        </group>
        <PostFX />
      </>
    )
  )
}
