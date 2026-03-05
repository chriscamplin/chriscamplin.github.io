import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
//@ts-ignore
import vertexShader from '../shaders/videoGoo/vertex.glsl'
//@ts-ignore
import fragmentShader from '../shaders/videoGoo/fragment.glsl'

interface VideoPlaneProps {
  track: React.RefObject<HTMLDivElement>
  [key: string]: any
}

const rotateMatrix = (a: number) => [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)]

const multiplyMatrixAndPoint = (matrix: number[], point: number[]) => {
  const c0r0 = matrix[0]
  const c1r0 = matrix[1]
  const c0r1 = matrix[2]
  const c1r1 = matrix[3]
  const x = point[0]
  const y = point[1]
  return [Math.abs(x * c0r0 + y * c0r1), Math.abs(x * c1r0 + y * c1r1)]
}

export const getRatio = (
  { x: w, y: h }: { x: number; y: number },
  { width, height }: { width: number; height: number },
  r = 0
) => {
  const m = multiplyMatrixAndPoint(rotateMatrix(THREE.MathUtils.degToRad(r)), [w, h])
  const originalRatio = {
    w: m[0] / width,
    h: m[1] / height,
  }

  const coverRatio = 1 / Math.max(originalRatio.w, originalRatio.h)

  return new THREE.Vector2(originalRatio.w * coverRatio, originalRatio.h * coverRatio)
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ track, ...props }) => {
  const planeRef = useRef<THREE.Mesh>(null)
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null)
  const hoverTextureRef = useRef<THREE.VideoTexture | null>(null)

  const uniforms = useRef({
    uVideoTexture: { value: null as THREE.VideoTexture | null },
    uHovermap: { value: null as THREE.VideoTexture | null },
    uAlpha: { value: 1.0 },
    uTime: { value: 0.0 },
    uProgressHover: { value: 0.0 },
    uProgressClick: { value: 0.0 },
    uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRatio: { value: new THREE.Vector2(1, 1) },
    uHoverratio: { value: new THREE.Vector2(1, 1) },
    uVelocity: { value: 0.0 },
  })

  const [isHovered, setIsHovered] = React.useState(false)
  const targetProgressClick = useRef(0)

  // Video Texture Initialization
  useEffect(() => {
    if (!track || !track.current) return

    const video1 = track.current.querySelector('#vid1') as HTMLVideoElement
    const video2 = track.current.querySelector('#vid2') as HTMLVideoElement
    if (!video1 || !video2) {
      console.error('No video elements found.')
      return
    }

    video1.crossOrigin = 'Anonymous'
    video1.loop = true
    video1.muted = true
    video1.autoplay = true
    video1.playsInline = true
    video1.play()

    video2.crossOrigin = 'Anonymous'
    video2.loop = true
    video2.muted = true
    video2.autoplay = true
    video2.playsInline = true
    video2.play()

    const texture1 = new THREE.VideoTexture(video1)
    const texture2 = new THREE.VideoTexture(video2)
    texture1.minFilter = THREE.LinearFilter
    texture1.magFilter = THREE.LinearFilter
    texture1.format = THREE.RGBAFormat

    videoTextureRef.current = texture1
    hoverTextureRef.current = texture2

    uniforms.current.uVideoTexture.value = texture1
    uniforms.current.uHovermap.value = texture2

    return () => {
      video1.pause()
      video2.pause()
      texture1.dispose()
      texture2.dispose()
    }
  }, [track])

  // Mouse Tracking
  useEffect(() => {
    const mouse = new THREE.Vector2(0, 0) // Current interpolated mouse position
    const targetMouse = new THREE.Vector2(0, 0) // Target mouse position in pixels

    const lerp = (start: number, end: number, alpha: number) =>
      start + (end - start) * alpha

    const handleMouseMove = (event: MouseEvent) => {
      // Capture the exact mouse position in pixel coordinates
      targetMouse.x = event.clientX
      targetMouse.y = event.clientY
    }

    const updateMousePosition = () => {
      // Smoothly interpolate towards the target mouse position
      mouse.x = lerp(mouse.x, targetMouse.x, 0.1) // Adjust alpha for smoothness
      mouse.y = lerp(mouse.y, targetMouse.y, 0.1)

      // Update the uniform with pixel coordinates
      uniforms.current.uMouse.value.set(mouse.x, mouse.y)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Create a loop to continuously update the mouse position
    const interval = setInterval(updateMousePosition, 16) // ~60FPS

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(interval)
    }
  }, [])

  // Handle Resizing
  useEffect(() => {
    const handleResize = () => {
      uniforms.current.uRes.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Hover and Click Effects
  useEffect(() => {
    if (!track || !track.current) return

    const handlePointerOver = () => setIsHovered(true)
    const handlePointerOut = () => setIsHovered(false)
    const handlePointerDown = () => (targetProgressClick.current = 1.0)
    const handlePointerUp = () => (targetProgressClick.current = 0.0)

    const trackElement = track.current
    trackElement.addEventListener('pointerover', handlePointerOver)
    trackElement.addEventListener('pointerout', handlePointerOut)
    trackElement.addEventListener('pointerdown', handlePointerDown)
    trackElement.addEventListener('pointerup', handlePointerUp)

    return () => {
      trackElement.removeEventListener('pointerover', handlePointerOver)
      trackElement.removeEventListener('pointerout', handlePointerOut)
      trackElement.removeEventListener('pointerdown', handlePointerDown)
      trackElement.removeEventListener('pointerup', handlePointerUp)
    }
  }, [track])
  const previousScroll = React.useRef(0) // To track the previous scroll position
  const scrollVelocity = React.useRef(0) // To track scroll velocity

  // Animate in Frame Loop
  useFrame((state, delta) => {
    // Lerp progress values
    uniforms.current.uProgressClick.value = THREE.MathUtils.lerp(
      uniforms.current.uProgressClick.value,
      targetProgressClick.current,
      0.1
    )

    uniforms.current.uProgressHover.value = THREE.MathUtils.lerp(
      uniforms.current.uProgressHover.value,
      isHovered ? 1.0 : 0.0,
      0.1
    )

    // Increment time uniform
    uniforms.current.uTime.value += delta
    // Ensure video textures update
    if (videoTextureRef.current) {
      videoTextureRef.current.needsUpdate = true
    }
    if (hoverTextureRef.current) {
      hoverTextureRef.current.needsUpdate = true
    }

    // Calculate scroll velocity
    // const currentScroll = props.scrollState.progress // Assume scrollState.scroll gives current scroll position
    // scrollVelocity.current = (currentScroll - previousScroll.current) / delta
    // previousScroll.current = currentScroll
    // uniforms.current.uVelocity.value = scrollVelocity.current * 0.1
  })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[0.75, 0.75, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        defines={{ PI: Math.PI, PR: window.devicePixelRatio.toFixed(1) }}
      />
    </mesh>
  )
}
