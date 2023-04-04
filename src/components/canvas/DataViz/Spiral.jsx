import { useEffect } from 'react'

import useYearCounter from '@/hooks/useYearCounter'

import { mapValue } from '@/helpers/mapValue'

export default function Spiral({ geometry, material, setStep1Complete }) {
  const { counter } = useYearCounter()
  useEffect(() => {
    console.log('spiral: ', { counter })
    const fractionValue = 1.67 - mapValue(counter, 0, 143, 0.35, 1.175)
    // const fractionValue =
    //   0.3285 + Math.abs(Math.cos(Math.PI * 0.5 * counter * 0.0061245675))
    // console.log({ fractionValue })
    material.uniforms.fraction.value = fractionValue
    if (fractionValue < 0.51) setTimeout(() => setStep1Complete(true), 1000)
  }, [counter, material.uniforms.fraction, setStep1Complete])

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[Math.PI, 0, -Math.PI * 0.9]}
      scale={[1.25, 1.25, 1.25]}
      visible={true}
    >
      {/* <boxGeometry args={[1, 1, 1]} /> */}
      {/* <meshMatcapMaterial normalMap={normalMap} matcap={matCap} color='red' /> */}
      {/* <heatScaleMaterial ref={matRef} side={THREE.DoubleSide} /> */}
      {/* <meshBasicMaterial color='red' /> */}
      {/* <meshStandardMaterial color='red' /> */}
    </mesh>
  )
}
