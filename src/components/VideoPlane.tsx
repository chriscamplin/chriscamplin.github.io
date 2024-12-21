import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader material to handle video texture
interface VideoPlaneProps {
  track: React.RefObject<HTMLDivElement>;
  [key: string]: any;
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ track, ...props }) => {
  const planeRef = useRef<THREE.Mesh>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null)

  // Load video and create a texture
  useEffect(() => {
    if (!track || !track.current) return

    const video = track.current.querySelector('video') as HTMLVideoElement
    if (!video) {
      console.error('No video element found in track reference.')
      return
    }

    video.crossOrigin = 'Anonymous'
    video.loop = true
    video.muted = true
    video.autoplay = true
    video.playsInline = true

    video.play()

    // Create a texture from the video
    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.format = THREE.RGBAFormat
    texture.needsUpdate = true

    videoRef.current = video
    videoTextureRef.current = texture

    // Assign texture to shader material's uniform
    if (planeRef.current && planeRef.current.material) {
      const material = planeRef.current.material as THREE.ShaderMaterial
      material.uniforms.uVideoTexture.value = texture
    }

    return () => {
      video.pause()
      texture.dispose()
    }
  }, [track])
  const [velocity, setVelocity] = React.useState(0) // Track scroll velocity
  const lastScrollY = useRef(window.scrollY)

  // Calculate scroll velocity
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const delta = scrollY - lastScrollY.current
      lastScrollY.current = scrollY

      setVelocity(delta * 0.01) // Scale the velocity for the shader
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame(() => {
    // Ensure the video texture updates each frame
    if (videoTextureRef.current) {
      videoTextureRef.current.needsUpdate = true
    }
    // Update shader's velocity uniform
    if (planeRef.current?.material) {
      const material = planeRef.current.material as THREE.ShaderMaterial
      material.uniforms.uVelocity.value = velocity
      material.uniforms.uTime.value += 0.01
    }
  })

  // Shader uniforms
  const uniforms = useRef({
    uVideoTexture: { value: null },
    uVelocity: { value: 0 },
    uTime: { value: 0 },
  })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[0.75, 0.75, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

// Vertex Shader with Warp
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uVelocity;

  void main() {
    vUv = uv;

    // Warp effect: add sine wave based on velocity
    vec3 warpedPosition = position;
    float warpFactor = uVelocity * sin(position.x * 1.666 + uTime * 2.0);
    warpedPosition.y += warpFactor;
    warpedPosition.z += warpFactor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(warpedPosition, 1.0);
  }
`

// Fragment Shader
const fragmentShader = `
  uniform sampler2D uVideoTexture;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(uVideoTexture, vUv);
    gl_FragColor = color;
  }
`