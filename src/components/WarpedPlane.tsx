import React, { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AnimatedMeshProps {
  track: React.MutableRefObject<HTMLElement>
  margin: number
  priority: number
  scale: THREE.Vector3
  scrollState: any
  inViewport: boolean
  scene: THREE.Scene
}

export function WarpedPlane(props: AnimatedMeshProps) {
  const mesh = React.useRef<THREE.Mesh>(null)
  const warpUniforms = {
    uTime: { value: 0.0 },
    uScrollDistortion: { value: 0.0 },
  }

  const onBeforeCompile = (shader: any) => {
    // Link uniforms from userData
    if (mesh.current) {
      shader.uniforms.uTime = mesh.current.userData.uniforms.uTime
      shader.uniforms.uScrollDistortion = mesh.current.userData.uniforms.uScrollDistortion
    }

    // Modify vertex shader to add warping
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform float uTime;
      uniform float uScrollDistortion;`
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float warpFactor = uScrollDistortion * sin(position.y * 6.666 + uTime * 2.0);
      transformed.x += warpFactor;
      transformed.y += warpFactor;
      transformed.z += warpFactor;`
    )
  }

  const [isHovered, setIsHovered] = React.useState(false)

  useEffect(() => {
    if (!mesh.current) return

    if (props.track.current) {
      props.track.current?.addEventListener('pointerover', () => {
        setIsHovered(true)
      })
      props.track.current?.addEventListener('pointerout', () => {
        setIsHovered(false)
      })
    }
    // Attach custom uniforms to the mesh's userData
    mesh.current.userData.uniforms = warpUniforms
  }, [])

  useEffect(() => {
    let tex
    if (props.track.current && props.track.current.lastChild) {
      const lastChild = props.track.current.lastChild as HTMLImageElement
      if (lastChild && lastChild.src) {
        tex = new THREE.TextureLoader().load(lastChild.src)
      }
    }
    if (!tex) return
    //tex.magFilter = THREE.NearestFilter
    //tex.minFilter = THREE.LinearMipMapLinearFilter

    if (!mesh || !mesh.current) return
    const MATERIAL = mesh.current.material as THREE.MeshBasicMaterial
    MATERIAL.map = tex
  }, [props.track.current])
  const previousScroll = React.useRef(0) // To track the previous scroll position
  const scrollVelocity = React.useRef(0) // To track scroll velocity
  const targetScale = React.useRef(props.scale.clone())

  useFrame((state, delta) => {
    // console.log({ targetScale })
    if (mesh.current) {
      // Update uniforms dynamically
      const { uTime, uScrollDistortion } = mesh.current.userData.uniforms
      uTime.value += delta // Increment time
      // Calculate scroll velocity
      const currentScroll = props.scrollState.progress // Assume scrollState.scroll gives current scroll position
      scrollVelocity.current = (currentScroll - previousScroll.current) / delta
      previousScroll.current = currentScroll

      // Update the target scale based on hover state
      const hoveredScale = props.scale.clone().multiplyScalar(2.1) // Scale up by 10%
      targetScale.current = isHovered ? hoveredScale : props.scale

      // Smoothly interpolate the scale
      const currentScale = mesh.current.scale
      // Adjust distortion based on hover state
      // console.log({ isHovered: props.isHovered })
      uScrollDistortion.value = isHovered
        ? 0.004 // Fixed distortion on hover
        : scrollVelocity.current * 0.01 // Dynamic distortion when not hovered
    }
  })

  const customProgramCacheKey = () => Math.random().toString()

  return (
    <mesh ref={mesh} {...props}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <meshBasicMaterial
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={customProgramCacheKey}
        color='#ffffff'
      />
    </mesh>
  )
}
