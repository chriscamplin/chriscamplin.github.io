import { scaleRadial } from 'd3-scale'
import * as THREE from 'three'

function mapToRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export default function createClimateSpiral(data) {
  if (!data || data.length === 0) return { geometry: null }
  const months = [
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
  ]
  const handleSingleNDoubleDigitMonths = (adjustedIdx) =>
    `${adjustedIdx}`.length === 1 ? `0${adjustedIdx}` : adjustedIdx
  console.log(data)
  const groupByYear = data.reduce(
    (prev, curr) => [
      ...prev,
      Object.keys(curr)
        .filter((key) => months.includes(key))
        .map((key, i) => ({
          Mean: curr[key],
          Date: `${curr['Year']}-${`${handleSingleNDoubleDigitMonths(
            i + 1
          )}`}-01`,
        })),
    ],
    []
  )

  const filteredData = groupByYear
    .reverse()
    .flat()
    .filter((year) => year['Mean'] !== '***')
  // console.log({ groupByYear: filteredData })

  const r = 460 // create a range of axis angles //
  // X scale

  // xyScale for the spiral positions
  const xyScale = scaleRadial()
    .domain([-1, 1.5])
    .range([-2, r / 12 - 30])

  const radians = Math.PI * 2
  const step = radians / 12

  const circles = []
  for (let i = 0; i < filteredData.length; i += 1) {
    const { Date } = filteredData[i]
    const { Mean } = filteredData[i]

    circles.push({ Date, Mean })
  }
  // console.log({ circles })

  // console.log({ dataCurves })

  const points = filteredData.map(({ Mean }, i) => {
    // const colorScale = scale(Mean, min.Mean, max.Mean, 0, 1);

    const xAngle = Math.sin((i + 1) * step)
    const yAngle = Math.cos((i + 1) * step)

    const x = xyScale(Mean) * xAngle
    const y = xyScale(Mean) * yAngle
    const z = i * 0.01
    const vector = new THREE.Vector3(
      Number(x.toFixed(3)),
      Number(y.toFixed(3)),
      Number(z.toFixed(3))
    )

    return vector
  })
  // console.log({ points })

  const curve = new THREE.CatmullRomCurve3(points, false)
  // console.log({ curve })
  // const curvePath = curve.getPoints(500)
  // const geometry = new THREE.BufferGeometry().setFromPoints(curvePath)
  const geometry = new THREE.TubeGeometry(curve, 15000, 0.115, 8, false)
  // console.log({ geometry })
  const pos = geometry.getAttribute('position')
  const gradients = []
  const lengths = []
  for (let i = 0; i < pos.array.length; i += 3) {
    const x = pos.array[i]
    const y = pos.array[i + 1]
    const z = pos.array[i + 2]
    const vector = new THREE.Vector3(x, y, z)

    const centerVector = new THREE.Vector3(0, 0, z)
    const lengthToCenter = vector.distanceTo(centerVector)
    const length = mapToRange(
      lengthToCenter,
      1.1077788772783308,
      8.138178959765503,
      0,
      1
    )
    gradients.push(length)
    lengths.push(lengthToCenter)
  }
  // console.log(pos.array)
  // console.log(min(lengths))
  // console.log(max(lengths))
  // console.log(lengths)

  const gradientPosition = new Float32Array(gradients)
  geometry.setAttribute(
    'gradientPosition',
    new THREE.BufferAttribute(gradientPosition, 1)
  )

  // new attribute
  const numVertices = geometry.attributes.position.count
  const distance = new Float32Array(numVertices * 1) // 1 value per vertex
  geometry.setAttribute('distance', new THREE.BufferAttribute(distance, 1))

  // populate attribute
  for (let i = 0, l = numVertices; i < l; i += 1) {
    // set new attribute
    distance[i] = (geometry.attributes.position.getZ(i) + 10) / 20.5

    // // wiggle geometry a bit while we're at it
    // const x = geometry.attributes.position.getX(i)
    // const y = geometry.attributes.position.getY(i)
    // geometry.attributes.position.setX(i, x + 2 * Math.sin(y))
  }

  geometry.setAttribute('distance', new THREE.BufferAttribute(distance, 1))
  return { geometry, months }
}
