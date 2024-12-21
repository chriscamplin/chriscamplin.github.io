import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import particlesVertexShader from '../shaders/particles/vertex.glsl'
import particlesFragmentShader from '../shaders/particles/fragment.glsl'
import gpgpuParticlesShader from '../shaders/gpgpu/particles.glsl'

export default async function generateFboPoints(renderer) {
  // Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  }

  // Loaders
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  // Load model
  const gltf = await gltfLoader.loadAsync('/models/bust-me2.glb')
  if (!gltf) {
    console.log('No model found')
    return
  }

  const baseGeometry = gltf.scene.children[0]?.geometry
  if (!baseGeometry) {
    console.log('No geometry found in model.')
    return
  }

  const vertexCount = baseGeometry.attributes.position.count

  // GPU Compute
  const gpgpu = {
    size: Math.ceil(Math.sqrt(vertexCount)),
  }
  gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

  const baseParticlesTexture = gpgpu.computation.createTexture()

  for (let i = 0; i < vertexCount; i++) {
    const i3 = i * 3
    const i4 = i * 4

    baseParticlesTexture.image.data[i4 + 0] =
      baseGeometry.attributes.position.array[i3 + 0]
    baseParticlesTexture.image.data[i4 + 1] =
      baseGeometry.attributes.position.array[i3 + 1]
    baseParticlesTexture.image.data[i4 + 2] =
      baseGeometry.attributes.position.array[i3 + 2]
    baseParticlesTexture.image.data[i4 + 3] = Math.random()
  }

  gpgpu.particlesVariable = gpgpu.computation.addVariable(
    'uParticles',
    gpgpuParticlesShader,
    baseParticlesTexture
  )

  gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [
    gpgpu.particlesVariable,
  ])

  gpgpu.particlesVariable.material.uniforms.uTime = { value: 0 }
  gpgpu.particlesVariable.material.uniforms.uDeltaTime = { value: 0 }
  gpgpu.particlesVariable.material.uniforms.uBase = { value: baseParticlesTexture }

  gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(5.5)
  gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(10)
  gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(
    0.005
  )
  gpgpu.particlesVariable.material.uniforms.uMouse = { value: new THREE.Vector2(0, 0) }


  gpgpu.computation.init()

  // Particles
  const particles = {}
  const particlesUvArray = new Float32Array(vertexCount * 2)
  const sizesArray = new Float32Array(vertexCount)

  for (let y = 0; y < gpgpu.size; y++) {
    for (let x = 0; x < gpgpu.size; x++) {
      const i = y * gpgpu.size + x
      const i2 = i * 2

      particlesUvArray[i2 + 0] = (x + 0.5) / gpgpu.size
      particlesUvArray[i2 + 1] = (y + 0.5) / gpgpu.size

      sizesArray[i] = 25.0 * Math.random()
    }
  }

  particles.geometry = new THREE.BufferGeometry()
  particles.geometry.setDrawRange(0, vertexCount)
  particles.geometry.setAttribute(
    'aParticlesUv',
    new THREE.BufferAttribute(particlesUvArray, 2)
  )
  particles.geometry.setAttribute('aColor', baseGeometry.attributes.color)
  particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))

  // Custom ShaderMaterial
  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uResolution: {
        value: new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        ),
      },
      uParticlesTexture: {
        value: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture,
      },
      uFlowFieldStrength: {
        value: 0
      },
      uSize: new THREE.Uniform(0.5),

    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  particles.points = new THREE.Points(particles.geometry, particles.material)

  return {
    particles,
    gpgpu,
  }
}
