import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { a, useSpring } from '@react-spring/three'
import { shaderMaterial, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import Axis from './Axis'
import Months from './Months'
import Spiral from './Spiral'
import YearCounter from './YearCounter'
import useFitGroupToViewport from '../../hooks/useFitGroupToViewport'
import useFetchSeaIceData from '../../hooks/useFetchSeaIceData'
import useYearCounter from '../../hooks/useYearCounter'
import {
  getSpiralMeshTransform,
  projectSpiralPoint,
} from '../../helpers/createClimateSpiral'
import fragmentShader from '../../shaders/ice.frag'
import vertexShader from '../../shaders/ice.vert'

const SPIRAL_ROTATION = [Math.PI, 0, -Math.PI * 0.125]
const SPIRAL_SCALE = [1.25, 1.25, 1.25]
const AXIS_OUTER_RADIUS = 9
const AXIS_CLEARANCE = 0.3
const MONTH_LABEL_RADIUS = AXIS_OUTER_RADIUS + 1.65
const LINE_LEFT_ANGLE = Math.PI * 1.5
const LINE_RIGHT_ANGLE = Math.PI * 0.5

const seaIceFileMap = import.meta.glob('../../data/sea-ice-index/*_extent_v3.0.csv', {
  eager: true,
  query: '?url',
  import: 'default',
})

const fileUrls = Object.entries(seaIceFileMap)
  .sort(([pathA], [pathB]) => {
    const monthA = Number(pathA.match(/\/(\d+)_extent_v3\.0\.csv$/)?.[1] ?? 0)
    const monthB = Number(pathB.match(/\/(\d+)_extent_v3\.0\.csv$/)?.[1] ?? 0)

    return monthA - monthB
  })
  .map(([, url]) => url)

const SeaIceMaterial = shaderMaterial(
  {
    fraction: 1,
    time: 0,
    color: new THREE.Color('#14374c'),
  },
  vertexShader,
  fragmentShader
)

function getSeaIceColor(value, domain) {
  const [min, max] = domain
  const normalized = THREE.MathUtils.clamp((value - min) / (max - min || 1), 0, 1)
  return new THREE.Color().setHSL(0.6, 0.72, 0.38 + normalized * 0.34).getStyle()
}

function createSeaIceTickValues(domain) {
  const [min, max] = domain
  const minTick = Math.ceil(min / 4) * 4
  const maxTick = Math.floor(max / 4) * 4
  const ticks = []

  for (let value = maxTick; value >= minTick; value -= 4) {
    ticks.push(value)
  }

  return ticks
}

function createMirroredLineTicks(values, leftAngle, rightAngle, project) {
  return values
    .flatMap((value) => [
      { label: `${value}`, x: project(value, leftAngle) },
      { label: `${value}`, x: project(value, rightAngle) },
    ])
    .sort((left, right) => left.x - right.x)
}

export default function SeaIceSpiral() {
  const { camera } = useThree()
  const fitRef = useRef()
  const rigRef = useRef()
  const { geometry, yearlyData, monthlyData, domain, mapper } = useFetchSeaIceData(fileUrls)

  const material = useMemo(
    () =>
      new SeaIceMaterial({
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
    const tickValues = createSeaIceTickValues(domain)
    const mirroredTickValues = tickValues.slice(0, Math.min(2, tickValues.length))
    const yearSpans = monthlyData.reduce((spans, entry, index) => {
      if (!spans.has(entry.year)) {
        spans.set(entry.year, { start: index, end: index })
      } else {
        spans.get(entry.year).end = index
      }

      return spans
    }, new Map())

    const latestYear = yearlyData.at(-1)?.year ?? 2025
    const yearTickValues = [
      latestYear,
      2015,
      2005,
      1995,
      1985,
      1978,
    ].filter((year, index, values) => values.indexOf(year) === index)

    return {
      circularTicks: tickValues.map((value) => ({
        label: `${value}`,
        radius: Math.abs(mapper.valueToRadius(value)) * spiralTransform.adjustedScale[0],
        color: '#9edced',
      })),
      lineValueTicks:
        geometry && transformedBox
          ? createMirroredLineTicks(
              mirroredTickValues,
              LINE_LEFT_ANGLE,
              LINE_RIGHT_ANGLE,
              (value, angle) =>
                projectSpiralPoint(
                  mapper.pointAtAngle(value, angle),
                  spiralTransform
                ).x
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
  }, [domain, geometry, mapper, monthlyData, spiralTransform, yearlyData])

  const { counter } = useYearCounter({
    total: yearlyData.length || 1,
    intervalMs: 180,
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

  const activeYear = yearlyData[Math.min(counter, Math.max(yearlyData.length - 1, 0))]
  const detail =
    activeYear &&
    `Average extent ${activeYear.averageExtent.toFixed(2)}M km^2 · annual minimum ${activeYear.minimumExtent.toFixed(2)}M km^2`

  return (
    <Suspense fallback={<Text color='white'>Loading</Text>}>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 15]} intensity={30} color='#a9e8ff' />
      <pointLight position={[0, -10, -8]} intensity={10} color='#2f7aa4' />

      <group ref={fitRef}>
        <a.group
          ref={rigRef}
          rotation={springs.rotation.to((x, y, z) => [x, y, z])}
          position={springs.position.to((x, y, z) => [x, y, z])}
        >
          <Axis
            step1Complete={step1Complete}
            textScale={0.42}
            gapAngle={Math.PI * 0.1}
            angleOffset={mapper.angleOffset}
            circularTicks={axisLayout.circularTicks}
            anchorY='bottom'
            lineValueTicks={axisLayout.lineValueTicks}
            lineYearTicks={axisLayout.lineYearTicks}
            lineZRange={axisLayout.lineZRange}
            yearLabelX={axisLayout.yearLabelX}
            valueLabelZ={axisLayout.valueLabelZ}
            lineColor='#78bcd1'
            linePlaneY={-12}
          />

          {!step1Complete && (
            <Months
              textScale={0.46}
              months={[
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ]}
              radius={MONTH_LABEL_RADIUS}
              angleOffset={mapper.angleOffset}
            />
          )}

          {!step1Complete && (
            <YearCounter
              label={activeYear?.year}
              detail={detail}
              color={getSeaIceColor(activeYear?.averageExtent ?? domain[0], domain)}
            />
          )}

          {geometry && (
            <Spiral
              geometry={geometry}
              material={material}
              counter={counter}
              total={yearlyData.length}
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
