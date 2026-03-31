import React from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

import { createCircularAxisGeometry } from '../../helpers/createClimateSpiral'

const FONT_URL = '/fonts/TitilliumWeb-Bold.ttf'
const LABEL_BACKGROUND_RENDER_ORDER = 20
const LABEL_RENDER_ORDER = 21

const OpaqueBackground = ({ xPos = 0, yPos = 0 }) => (
  <mesh
    position={[xPos, yPos, 0]}
    scale={[2, 1, 2]}
    renderOrder={LABEL_BACKGROUND_RENDER_ORDER}
  >
    <circleGeometry args={[0.5, 32]} />
    <meshBasicMaterial
      color='black'
      transparent
      opacity={0.45}
      toneMapped={false}
      fog={false}
      depthTest={false}
      depthWrite={false}
    />
  </mesh>
)

const LineAxis = ({
  textScale = 0.44,
  valueTicks = [],
  yearTicks = [],
  lineColor = '#b6c9d1',
  planeY = -9,
  yearLabelX = 0,
  valueLabelZ = 0,
  lineZRange = [0, 0],
}) => {
  const [minZ, maxZ] = lineZRange
  const lineHeight = Math.max(maxZ - minZ, 0)
  const lineCenter = minZ + lineHeight * 0.5

  return (
    <group rotation={[Math.PI * 0.5, 0, 0]} position={[0, planeY, 0]}>
      {yearTicks.map(({ label, z }) => (
        <React.Fragment key={label}>
          <OpaqueBackground xPos={yearLabelX} yPos={z} />
          <Text
            position={[yearLabelX, z, 0.01]}
            scale={[textScale, textScale, textScale]}
            color='white'
            anchorX='center'
            anchorY='middle'
            font={FONT_URL}
            renderOrder={LABEL_RENDER_ORDER}
            material-toneMapped={false}
            material-fog={false}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {`${label}`}
          </Text>
        </React.Fragment>
      ))}

      {valueTicks.map(({ label, x }, index) => (
        <React.Fragment key={`${label}-${index}`}>
          <Text
            position={[x, valueLabelZ, 0]}
            scale={[textScale, textScale, textScale]}
            color='white'
            anchorX='center'
            anchorY='middle'
            font={FONT_URL}
            renderOrder={LABEL_RENDER_ORDER}
            material-toneMapped={false}
            material-fog={false}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {label}
          </Text>

          <mesh position={[x, lineCenter, 0]}>
            <planeGeometry args={[0.1, lineHeight]} />
            <meshBasicMaterial
              color={lineColor}
              side={THREE.DoubleSide}
              toneMapped={false}
              fog={false}
            />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  )
}

const CircularAxis = ({
  ticks = [],
  gapAngle = 0,
  angleOffset = 0,
  textScale,
  anchorY,
  lineColor = '#b6c9d1',
}) =>
  ticks.map(({ label, radius, color, labelPosition, anchorX = 'center' }) => {
    const [labelXPos, labelYPos] = labelPosition ?? [0, radius]

    return (
      <React.Fragment key={`${label}-${radius}`}>
        <OpaqueBackground xPos={labelXPos} yPos={labelYPos} />
        <Text
          position={[labelXPos, labelYPos, 0.01]}
          scale={[textScale, textScale, textScale]}
          color='white'
          anchorX={anchorX}
          anchorY={anchorY}
          font={FONT_URL}
          renderOrder={LABEL_RENDER_ORDER}
          material-toneMapped={false}
          material-fog={false}
          material-depthTest={false}
          material-depthWrite={false}
        >
          {label}
        </Text>
        <mesh geometry={createCircularAxisGeometry({ radius, gapAngle, angleOffset })}>
          <meshBasicMaterial
            color={color ?? lineColor}
            toneMapped={false}
            fog={false}
          />
        </mesh>
      </React.Fragment>
    )
  })

export default function Axis({
  textScale = 0.45,
  step1Complete = false,
  gapAngle = Math.PI * 0.05,
  angleOffset = 0,
  circularTicks = [],
  anchorY = 'middle',
  lineValueTicks = [],
  lineYearTicks = [],
  lineZRange = [0, 0],
  yearLabelX = 0,
  valueLabelZ = 0,
  lineColor = '#b6c9d1',
  linePlaneY = -9,
}) {
  if (step1Complete) {
    return (
      <LineAxis
        textScale={textScale}
        valueTicks={lineValueTicks}
        yearTicks={lineYearTicks}
        yearLabelX={yearLabelX}
        valueLabelZ={valueLabelZ}
        lineZRange={lineZRange}
        lineColor={lineColor}
        planeY={linePlaneY}
      />
    )
  }

  return (
    <CircularAxis
      ticks={circularTicks}
      gapAngle={gapAngle}
      angleOffset={angleOffset}
      textScale={textScale}
      anchorY={anchorY}
      lineColor={lineColor}
    />
  )
}
