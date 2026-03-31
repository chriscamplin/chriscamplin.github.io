import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { mapValue } from '../../helpers/mapValue'
import { getSpiralMeshTransform } from '../../helpers/createClimateSpiral'

export default function Spiral({
  geometry,
  material,
  counter = 0,
  total = 1,
  revealStart = 1,
  setStep1Complete,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  axisOuterRadius = 9,
  axisClearance = 0.35,
  transform,
}) {
  const hasTriggeredRef = useRef(false)

  const meshTransform = useMemo(
    () =>
      transform ??
      getSpiralMeshTransform({
        geometry,
        rotation,
        scale,
        axisOuterRadius,
        axisClearance,
      }),
    [
      axisClearance,
      axisOuterRadius,
      geometry,
      rotation,
      scale,
      transform,
    ]
  )

  useEffect(() => {
    if (material?.uniforms?.fraction) {
      const maxIndex = Math.max(total - 1, 1)
      const fractionValue = mapValue(counter, 0, maxIndex, revealStart, 0)
      material.uniforms.fraction.value = Math.max(0, fractionValue)

      if (
        setStep1Complete &&
        !hasTriggeredRef.current &&
        (counter >= maxIndex || fractionValue <= 0.001)
      ) {
        hasTriggeredRef.current = true
        setTimeout(() => setStep1Complete(true), 600)
      }
    }
  }, [counter, material, revealStart, setStep1Complete, total])

  useFrame((_, delta) => {
    if (material?.uniforms?.time) {
      material.uniforms.time.value += delta
    }
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={rotation}
      scale={meshTransform.adjustedScale}
      position={[0, 0, meshTransform.zOffset]}
      visible={true}
    />
  )
}
