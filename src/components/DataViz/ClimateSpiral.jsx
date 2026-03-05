import { Suspense, useEffect, useState } from 'react'
import { a, useSpring } from '@react-spring/three'
import { shaderMaterial, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import * as THREE from 'three'

import Axis from './Axis'
import Months from './Months'
import Spiral from './Spiral'
import YearCounter from './YearCounter'
import useFetchCSV from '../../hooks/useFetchCSV'

import fragment from '../../shaders/heat.frag'
import vertex from '../../shaders/heat.vert'

import createClimateSpiral from '../../helpers/createClimateSpiral'


const HeatScaleMaterial = shaderMaterial(
  {
    fraction: 1.35,
    time: 0,
    color: new THREE.Color(0.05, 0.0, 0.025),
  },
  vertex,
  fragment
)

const material = new HeatScaleMaterial({ side: THREE.DoubleSide })

export default function ClimateSpiral() {
  useThree((state) => state.camera.position.z = 10)

  const { rows } = useFetchCSV('/data/global_temp_2022.csv')
  const { textScale } = useControls({
    textScale: {
      value: 0.5,
      min: 0.1,
      max: 5,
      step: 0.1,
    },
  })

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
    config: { mass: 10, tension: 120, friction: 120, precision: 0.0001 },
  }))
  useEffect(() => {
    //   meshRef.current.rotation.z += rotation
    // console.log('API START', springs, api)
    api.start({
      rotation: [
        step1Complete ? -Math.PI * 0.5 - Math.PI * 0.00675 : 0,
        0,
        step1Complete ? -Math.PI * 2 : 0,
      ],
      position: [0, step1Complete ? 10 : 0, -5],
    })
  }, [step1Complete, api])
  
  

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
