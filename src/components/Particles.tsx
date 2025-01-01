import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import React, { useEffect, useState, useRef } from 'react'
import { useScrollbar } from '@14islands/r3f-scroll-rig'
/* @ts-ignore */
import generateFboPoints from '../helpers/generateFboPoints'
import { Depth, DepthOfField, EffectComposer } from '@react-three/postprocessing'

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
    gpgpuData.particlesVariable.material.uniforms.uFlowFieldStrength.value =
      scroll.velocity * 3
    gpgpuData.particlesVariable.material.uniforms.uScroll.value = scroll.progress
    gpgpuData.computation.compute()
    if (!particlesData?.points?.material?.uniforms?.uParticlesTexture) return
    particlesData.points.material.uniforms.uParticlesTexture.value =
      gpgpuData.computation.getCurrentRenderTarget(gpgpuData.particlesVariable).texture

    gpgpuData.particlesVariable.material.uniforms.uMouse.value.set(
      mousePosition.current.x,
      mousePosition.current.y
    )
  })
  React.useEffect(() => {
    if (!light.current) return

    // shadows
    particlesData.points.material.uniforms.shadowMap = { value: light.current.shadow.map }
    particlesData.points.material.uniforms.lightMatrix = {
      value: light.current.shadow.camera.projectionMatrix.multiply(
        light.current.shadow.camera.matrixWorldInverse
      ),
    }
  }, [light.current])

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
        {/* <directionalLight
          castShadow
          ref={light}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-camera-near={0.1}
          shadow-camera-far={10}
          position={[0, 5, 5]}
        /> */}
        <group>
          <points
            ref={mesh}
            geometry={particlesData?.points.geometry}
            material={particlesData?.points.material}
            // receiveShadow
            // castShadow
          />
          {/* <EffectComposer>
            <DepthOfField
              focusDistance={0}
              focalLength={0.02}
              bokehScale={2}
              height={480}
            />
          </EffectComposer> */}
        </group>
      </>
    )
  )
}
