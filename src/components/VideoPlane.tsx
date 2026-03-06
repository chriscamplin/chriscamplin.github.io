import React, { useRef, useEffect, useMemo, useState } from 'react'
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
  const x = point[0]
  const y = point[1]
  return [
    Math.abs(x * matrix[0] + y * matrix[2]),
    Math.abs(x * matrix[1] + y * matrix[3]),
  ]
}

export const getRatio = (
  { x: w, y: h }: { x: number; y: number },
  { width, height }: { width: number; height: number },
  r = 0,
) => {
  const m = multiplyMatrixAndPoint(rotateMatrix(THREE.MathUtils.degToRad(r)), [w, h])
  const coverRatio = 1 / Math.max(m[0] / width, m[1] / height)
  return new THREE.Vector2((m[0] / width) * coverRatio, (m[1] / height) * coverRatio)
}

export const VideoPlane: React.FC<VideoPlaneProps> = ({ track, ...props }) => {
  const planeRef = useRef<THREE.Mesh>(null)

  const mouse = useRef(new THREE.Vector2(0, 0))
  const targetMouse = useRef(new THREE.Vector2(0, 0))
  const targetProgressClick = useRef(0)

  const [isHovered, setIsHovered] = useState(false)

  // Memoize to avoid reinstantiating uniforms during renders
  const uniforms = useMemo(
    () => ({
      uVideoTexture: { value: null as THREE.VideoTexture | null },
      uHovermap: { value: null as THREE.VideoTexture | null },
      uAlpha: { value: 1.0 },
      uTime: { value: 0.0 },
      uProgressHover: { value: 0.0 },
      uProgressClick: { value: 0.0 },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uVelocity: { value: 0.0 },
    }),
    [],
  )

  // Setup Textures
  useEffect(() => {
    if (!track?.current) return

    const video1 = track.current.querySelector('#vid1') as HTMLVideoElement
    const video2 = track.current.querySelector('#vid2') as HTMLVideoElement
    if (!video1 || !video2) return
    ;[video1, video2].forEach((v) => {
      v.crossOrigin = 'Anonymous'
      v.loop = v.muted = v.autoplay = v.playsInline = true
      v.play()
    })

    const texture1 = new THREE.VideoTexture(video1)
    const texture2 = new THREE.VideoTexture(video2)

    // Setting properties explicitly
    texture1.minFilter = texture1.magFilter = THREE.LinearFilter
    texture2.minFilter = texture2.magFilter = THREE.LinearFilter
    texture1.format = texture2.format = THREE.RGBAFormat

    uniforms.uVideoTexture.value = texture1
    uniforms.uHovermap.value = texture2

    return () => {
      video1.pause()
      video2.pause()
      texture1.dispose()
      texture2.dispose()
    }
  }, [track, uniforms])

  // Native mouse & resize tracking
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Pre-normalize viewport vectors to GPU (-1 to 1)
      targetMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      targetMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    const handleResize = () => {
      uniforms.uRes.value.set(window.innerWidth, window.innerHeight)
    }

    // Passive boosts scroll/mouse responsiveness
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [uniforms])

  // Track hover state natively
  useEffect(() => {
    if (!track?.current) return

    const trackEl = track.current
    const setHover = () => setIsHovered(true)
    const unsetHover = () => setIsHovered(false)
    const setClick = () => (targetProgressClick.current = 1.0)
    const unsetClick = () => (targetProgressClick.current = 0.0)

    trackEl.addEventListener('pointerover', setHover)
    trackEl.addEventListener('pointerout', unsetHover)
    trackEl.addEventListener('pointerdown', setClick)
    trackEl.addEventListener('pointerup', unsetClick)

    return () => {
      trackEl.removeEventListener('pointerover', setHover)
      trackEl.removeEventListener('pointerout', unsetHover)
      trackEl.removeEventListener('pointerdown', setClick)
      trackEl.removeEventListener('pointerup', unsetClick)
    }
  }, [track])

  // Animate strictly inside the frame cycle (eliminates the previous buggy setInterval)
  useFrame((state, delta) => {
    uniforms.uProgressClick.value = THREE.MathUtils.lerp(
      uniforms.uProgressClick.value,
      targetProgressClick.current,
      0.1,
    )
    uniforms.uProgressHover.value = THREE.MathUtils.lerp(
      uniforms.uProgressHover.value,
      isHovered ? 1.0 : 0.0,
      0.1,
    )

    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, targetMouse.current.x, 0.1)
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, targetMouse.current.y, 0.1)
    uniforms.uMouse.value.set(mouse.current.x, mouse.current.y)

    uniforms.uTime.value += delta

    // Add back scroll/velocity lerps mapping to `uniforms.uVelocity.value` here
  })

  return (
    <mesh ref={planeRef} {...props}>
      <planeGeometry args={[0.75, 0.75, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        defines={{ PI: Math.PI, PR: window.devicePixelRatio.toFixed(1) }}
      />
    </mesh>
  )
}
