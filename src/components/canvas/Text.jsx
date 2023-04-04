import { useEffect, useRef, useState } from 'react'
import { Text3D, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'

import Mirror from '@/components/canvas/Mirror'
import { CustomTextMaterial } from '@/components/canvas/Shader/CustomTextMaterial'

export default function Text() {
  console.log('text')
  const [geomBBox, setGeomBBox] = useState()
  const normalMap = useTexture('/txt/normalMap.jpg')
  const matCap = useTexture('/matCaps/1A2461_3D70DB_2C3C8F_2C6CAC-512px.png')
  const matRef = useRef()
  console.log({ matRef })
  const config = useControls('Text', {
    fontSize: { value: 1, min: 0.1, max: 2 },
    fontDepth: { value: 0.5, min: 0.01, max: 3.5 },
    uRadius: { value: 1.5, min: 0.1, max: 3 },
    uTwists: { value: 1, min: 0, max: 3, step: 1 },
    uTwistSpeed: { value: 35, min: 0, max: 100, step: 1 },
    uRotateSpeed: { value: 0.5, min: 0, max: 3, step: 0.01 },
  })

  useEffect(() => {
    matRef.current.geometry.center()
    matRef.current.scale.setX(5)
    matRef.current.scale.setY(5)
    matRef.current.scale.setZ(5)
    setGeomBBox(matRef.current.geometry.boundingBox)
  }, [setGeomBBox])

  useFrame((state) => {
    matRef.current.rotation.z = -state.clock.elapsedTime * 0.1 * Math.PI
  })

  return (
    <>
      <Mirror scale={2} type='sphere' />
      <Text3D
        font={'/fonts/Arial_Black_Regular.json'}
        //   smooth={1}
        //   lineHeight={0.5}
        //   letterSpacing={-0.025}
        ref={matRef}
        size={config.fontSize}
        height={config.fontDepth}
        curveSegments={100}
        bevelEnabled={false}
      >
        {` Fuck the Tories `.toUpperCase()}
        <CustomTextMaterial
          normalMap={normalMap}
          matCap={matCap}
          geo={geomBBox}
          config={config}
        />
      </Text3D>
    </>
  )
}
