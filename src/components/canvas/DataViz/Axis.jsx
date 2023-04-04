import React from 'react'
import { Text } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'

import plotAxisPoints from '@/helpers/plotAxisPoints'

const OpaqueBackground = ({ xPos = 0, yPos = 0 }) => (
  <mesh position={[xPos, yPos, 0]} scale={[2, 1, 2]}>
    <circleGeometry args={[0.5, 32]} />
    <meshBasicMaterial color='black' transparent={true} opacity={0.45} />
  </mesh>
)

const circular = (denominator, sliceOfPi, textScale, degrees, anchorY) =>
  [...degrees].map((_, i) => {
    const labelYPos = i * 2.95 + 3.75

    return (
      <React.Fragment key={Math.random()}>
        <OpaqueBackground yPos={labelYPos} />
        <Text
          position={[0, labelYPos, 0.01]}
          scale={[textScale, textScale, textScale]}
          color='white'
          anchorX='center'
          anchorY={anchorY}
          font={'/fonts/GT-Zirkon-Bold.woff'}
        >
          {`${degrees[i]}°C`}
        </Text>
        <mesh
          rotation={[0, 0, i === 4 ? Math.PI * 0.05 : 0]}
          // scale={[i * 0.3, i * 0.3, i * 0.3]}
          geometry={plotAxisPoints(
            18 - (i + 100) * denominator,
            9.75 - i * 3,
            i,
            sliceOfPi
          )}
          // material={axisMaterial}
        >
          <meshBasicMaterial
            color={new THREE.Color(i - 1 === 0 ? 'green' : 'yellow')}
            material
          />
        </mesh>
      </React.Fragment>
    )
  })

const lineMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.DoubleSide,
})

const lineGeometry = new THREE.PlaneGeometry(0.1, 22)
const lineDegrees = [1, 0, 0, 1]

const years = [2023, 2000, 1980, 1960, 1940, 1920, 1900, 1880]
const lines = (textScale) => (
  <group rotation={[Math.PI * 0.5, 0, 0]} position={[-11.5, -12, -12.5]}>
    {years.map((year, i) => {
      const labelYPos = 12.5 - i * 3.05
      const labelXPos = 11.5

      return (
        <React.Fragment key={Math.random()}>
          <OpaqueBackground xPos={labelXPos} yPos={labelYPos} />
          <Text
            key={year}
            position={[labelXPos, labelYPos, 0.01]}
            scale={[textScale, textScale, textScale]}
            color='white'
            anchorX='center'
            anchorY='middle'
            font={'/fonts/GT-Zirkon-Bold.woff'}
          >
            {`${year}`}
          </Text>
        </React.Fragment>
      )
    })}
    {[...Array(3)].map((_, i) => {
      const labelXPos = i * 5.65 + 3.1

      return (
        <React.Fragment key={Math.random()}>
          <Text
            position={[labelXPos, 13.5, 0]}
            scale={[textScale, textScale, textScale]}
            color='white'
            anchorX='center'
            anchorY='middle'
            font={'/fonts/GT-Zirkon-Bold.woff'}
          >
            {`${lineDegrees[i]}°C`}
          </Text>

          <mesh
            position={[labelXPos, 2, 0]}
            geometry={lineGeometry}
            material={lineMaterial}
          ></mesh>
        </React.Fragment>
      )
    })}
  </group>
)

export default function Axis({
  step1Complete,
  textScale,
  gap = 0.05,
  closed = 0.013,
  degrees = [1, 0, 1],
  anchorY = 'middle',
}) {
  const { denominator, sliceOfPi } = useControls({
    sliceOfPi: {
      value: gap,
      min: 0.001,
      max: 0.5,
      step: 0.001,
    },
    denominator: {
      value: closed,
      min: 0.01,
      max: 1,
      step: 0.001,
    },
  })

  return !step1Complete
    ? circular(denominator, sliceOfPi, textScale, degrees, anchorY)
    : lines(textScale)
}
