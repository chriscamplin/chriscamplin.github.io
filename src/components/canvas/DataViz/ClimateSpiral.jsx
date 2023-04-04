import { Suspense, useEffect, useState } from 'react'
import { a, useSpring } from '@react-spring/three'
import { shaderMaterial, Text } from '@react-three/drei'
import { Leva, useControls } from 'leva'
import * as THREE from 'three'

import Axis from '@/components/canvas/DataViz/Axis'
import Months from '@/components/canvas/DataViz/Months'
import Spiral from '@/components/canvas/DataViz/Spiral'
import YearCounter from '@/components/canvas/DataViz/YearCounter'
import useFetchCSV from '@/hooks/useFetchCSV'

import fragment from '../Shader/glsl/heat.frag'
import vertex from '../Shader/glsl/heat.vert'

import createClimateSpiral from '@/helpers/createClimateSpiral'
// const { geometry } = createCurvesFromData(data)

// drawcalls
// const drawCount = 100 // draw the first 10 points, only
// geometry.setDrawRange(0, drawCount)
// geometry.attributes.position.needsUpdate = true // required after the first render

const HeatScaleMaterial = shaderMaterial(
  {
    fraction: 1.35,
    time: 0,
    color: new THREE.Color(0.05, 0.0, 0.025),
  },
  vertex,
  fragment
)

// extend({ HeatScaleMaterial })
const material = new HeatScaleMaterial({ side: THREE.DoubleSide })

export default function ClimateSpiral() {
  const { rows } = useFetchCSV('/data/global_temp_2022.csv')
  const { textScale } = useControls({
    textScale: {
      value: 0.5,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
  })
  console.log({ rows })
  // console.log({ rows, data })
  const { geometry, months } = createClimateSpiral(rows)
  // console.log({ geometry })
  // const normalMap = useTexture('/txt/normalMap.jpg')
  // const matCap = useTexture('/matCaps/GrayGlossy.png')
  const [step1Complete, setStep1Complete] = useState(false)
  // const matRef = useRef()
  const [springs, api] = useSpring(() => ({
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    config: { mass: 10, tension: 120, friction: 240, precision: 0.0001 },
  }))
  useEffect(() => {
    //   meshRef.current.rotation.z += rotation
    // console.log('API START', springs, api)
    api.start({
      rotation: [
        step1Complete ? -Math.PI * 0.5 - Math.PI * 0.00675 : 0,
        0,
        step1Complete ? -Math.PI * 4 : 0,
      ],
      position: [0, step1Complete ? 10 : 0, 0],
    })
  }, [step1Complete, api])
  // const [hovered, setHovered] = useState(false)

  // useEffect(() => {
  //   document.body.style.cursor = hovered ? 'pointer' : 'auto'
  // }, [hovered])

  return (
    // {!isStarted && <Text>Start</Text>}
    <Suspense fallback={<Text>LOADING</Text>}>
      <Leva
        collapsed // default = false, when true the GUI is collpased
        hidden // default = false, when true the GUI is hidden
      />
      <a.group
        rotation={springs.rotation.to((x, y, z) => [x, y, z])}
        position={springs.position.to((x, y, z) => [x, y, z])}
      >
        {geometry && !step1Complete && (
          <YearCounter rows={rows} textScale={textScale} />
        )}
        <Axis textScale={textScale} step1Complete={step1Complete} />
        {months && !step1Complete && (
          <Months textScale={textScale} months={months} />
        )}
        {geometry && (
          <Spiral
            geometry={geometry}
            material={material}
            setStep1Complete={setStep1Complete}
          />
        )}
        {/* <Text
          rotation={[Math.PI * 0.5, 0, 0]}
          position={[20, -25, -20]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerDown={() => setStep1Complete(false)}
        >
          RESET
        </Text> */}
      </a.group>
    </Suspense>
  )
}
