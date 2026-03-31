import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { a, useSpring } from '@react-spring/three'
import { shaderMaterial, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import Axis from './Axis'
import Months from './Months'
import Spiral from './Spiral'
import YearCounter from './YearCounter'
import useFetchCSV from '../../hooks/useFetchCSV'
import useFitGroupToViewport from '../../hooks/useFitGroupToViewport'
import useYearCounter from '../../hooks/useYearCounter'

import climateDataUrl from '../../data/GLB.Ts+dSST.csv?url'
import createClimateSpiral, {
  getSpiralMeshTransform,
  projectSpiralPoint,
} from '../../helpers/createClimateSpiral'
import fragmentShader from '../../shaders/heat.frag'
import vertexShader from '../../shaders/heat.vert'

const SPIRAL_ROTATION = [Math.PI, 0, -Math.PI * 0.9]
const SPIRAL_SCALE = [1.25, 1.25, 1.25]
const AXIS_OUTER_RADIUS = 9.15
const AXIS_CLEARANCE = 0.3
const MONTH_LABEL_RADIUS = AXIS_OUTER_RADIUS + 1.5
const LINE_LEFT_ANGLE = Math.PI * 0.5
const LINE_RIGHT_ANGLE = Math.PI * 1.5
const CIRCULAR_TICK_VALUES = [-1, 0, 1]
const MIRRORED_LINE_TICK_VALUES = [1, 0]

const ClimateMaterial = shaderMaterial(
  {
    fraction: 1,
    time: 0,
    color: new THREE.Color('#0d2434'),
  },
  vertexShader,
  fragmentShader
)

function getClimateColor(value) {
  const normalized = THREE.MathUtils.clamp((value + 1) / 2.5, 0, 1)
  return new THREE.Color().setHSL(0.62 - normalized * 0.56, 0.78, 0.62).getStyle()
}

function formatClimateAxisLabel(value, suffix) {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value}${suffix}`
}

function formatClimateCircularLabel(value) {
  return `${value}°C`
}

function createMirroredLineTicks(values, leftAngle, rightAngle, project, formatLabel) {
  return values
    .flatMap((value) => [
      {
        label: formatLabel(value),
        x: project(value, leftAngle),
      },
      {
        label: formatLabel(value),
        x: project(value, rightAngle),
      },
    ])
    .sort((left, right) => left.x - right.x)
}

export default function ClimateSpiral() {
  const { camera } = useThree()
  const fitRef = useRef()
  const rigRef = useRef()
  const { rows } = useFetchCSV(climateDataUrl, { skipLines: 1 })
  const { geometry, months, monthlyData, mapper } = useMemo(
    () => createClimateSpiral(rows),
    [rows]
  )

  const material = useMemo(
    () =>
      new ClimateMaterial({
        side: THREE.DoubleSide,
      }),
    []
  )

  const spiralTransform = useMemo(
    () =>
      getSpiralMeshTransform({
        geometry,
        rotation: SPIRAL_ROTATION,
        scale: SPIRAL_SCALE,
        axisOuterRadius: AXIS_OUTER_RADIUS,
        axisClearance: AXIS_CLEARANCE,
      }),
    [geometry]
  )

  const axisLayout = useMemo(() => {
    const transformedBox = spiralTransform.transformedBox
    const yearSpans = monthlyData.reduce((spans, entry, index) => {
      if (!spans.has(entry.year)) {
        spans.set(entry.year, { start: index, end: index })
      } else {
        spans.get(entry.year).end = index
      }

      return spans
    }, new Map())

    const latestYear = rows.at(-1)?.Year ?? 2026
    const yearTickValues = [
      latestYear,
      2000,
      1980,
      1960,
      1940,
      1920,
      1900,
      1880,
    ].filter((year, index, values) => values.indexOf(year) === index)

    return {
      circularTicks: CIRCULAR_TICK_VALUES.map((value) => ({
        label: formatClimateCircularLabel(value),
        radius: Math.abs(mapper.valueToRadius(value)) * spiralTransform.adjustedScale[0],
        color: value === 0 ? '#8db96c' : '#efe36f',
      })),
      lineValueTicks:
        geometry && transformedBox
          ? createMirroredLineTicks(
              MIRRORED_LINE_TICK_VALUES,
              LINE_LEFT_ANGLE,
              LINE_RIGHT_ANGLE,
              (value, angle) =>
                projectSpiralPoint(
                  mapper.pointAtAngle(value, angle),
                  spiralTransform
                ).x,
              (value) => formatClimateAxisLabel(value, '°C')
            )
          : [],
      lineYearTicks:
        geometry && transformedBox
          ? yearTickValues
              .map((year) => {
                const span = yearSpans.get(year)

                if (!span) {
                  return null
                }

                const centerIndex = (span.start + span.end) * 0.5
                const z = projectSpiralPoint(
                  new THREE.Vector3(
                    0,
                    0,
                    mapper.zAtIndex(centerIndex, monthlyData.length)
                  ),
                  spiralTransform
                ).z

                return { label: year, z }
              })
              .filter(Boolean)
          : [],
      lineZRange: transformedBox
        ? [transformedBox.min.z, transformedBox.max.z]
        : [0, 0],
      yearLabelX: transformedBox ? transformedBox.min.x - 1.3 : -11.5,
      valueLabelZ: transformedBox ? transformedBox.max.z + 1 : 0.75,
    }
  }, [geometry, mapper, monthlyData, rows, spiralTransform])

  const { counter } = useYearCounter({
    total: rows.length || 1,
    intervalMs: 120,
  })
  const [step1Complete, setStep1Complete] = useState(false)
  const [springs, api] = useSpring(() => ({
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    config: { mass: 10, tension: 120, friction: 240, precision: 0.0001 },
  }))

  useFitGroupToViewport(rigRef, fitRef, {
    margin: step1Complete ? 0.72 : 0.92,
    damping: 6,
    maxScale: 1,
    referenceDistance: 24,
  })

  useEffect(() => {
    camera.position.set(0, 0, 24)
    camera.lookAt(0, 0, 0)
  }, [camera])

  useEffect(() => {
    api.start({
      rotation: [
        step1Complete ? -Math.PI * 0.5 - Math.PI * 0.00675 : 0,
        0,
        step1Complete ? -Math.PI * 4 : 0,
      ],
      position: [0, step1Complete ? 10 : 0, 0],
    })
  }, [api, step1Complete])

  const activeRow = rows[Math.min(counter, Math.max(rows.length - 1, 0))]
  const currentValue = activeRow?.average ?? 0
  const yearDetail =
    typeof currentValue === 'number'
      ? `Average anomaly ${currentValue >= 0 ? '+' : ''}${currentValue.toFixed(2)} C`
      : undefined

  return (
    <Suspense fallback={<Text color='white'>Loading</Text>}>
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 14]} intensity={28} color='#6fc6ff' />
      <pointLight position={[0, -8, -10]} intensity={14} color='#ff9b68' />

      <group ref={fitRef}>
        <a.group
          ref={rigRef}
          rotation={springs.rotation.to((x, y, z) => [x, y, z])}
          position={springs.position.to((x, y, z) => [x, y, z])}
        >
          <Axis
            step1Complete={step1Complete}
            textScale={0.44}
            gapAngle={Math.PI * 0.05}
            angleOffset={mapper.angleOffset}
            circularTicks={axisLayout.circularTicks}
            lineValueTicks={axisLayout.lineValueTicks}
            lineYearTicks={axisLayout.lineYearTicks}
            lineZRange={axisLayout.lineZRange}
            yearLabelX={axisLayout.yearLabelX}
            valueLabelZ={axisLayout.valueLabelZ}
            linePlaneY={-9}
          />

          {!step1Complete && (
            <Months
              textScale={0.48}
              months={months}
              radius={MONTH_LABEL_RADIUS}
              angleOffset={mapper.angleOffset}
            />
          )}

          {!step1Complete && (
            <YearCounter
              label={activeRow?.Year}
              detail={yearDetail}
              color={getClimateColor(currentValue)}
            />
          )}

          {geometry && (
            <Spiral
              geometry={geometry}
              material={material}
              counter={counter}
              total={rows.length}
              revealStart={1}
              setStep1Complete={setStep1Complete}
              rotation={SPIRAL_ROTATION}
              scale={SPIRAL_SCALE}
              axisOuterRadius={AXIS_OUTER_RADIUS}
              axisClearance={AXIS_CLEARANCE}
              transform={spiralTransform}
            />
          )}
        </a.group>
      </group>
    </Suspense>
  )
}
