import * as THREE from 'three'

export default function plotAxisPoints(
  denominator = 17.5,
  radius = 5.25,
  index = 1,
  sliceOfPi = 0.06277
) {
  const numPoints = 100

  const points = [...Array(numPoints + 1)].map((item, i) => {
    // const colorScale = scale(Mean, min.Mean, max.Mean, 0, 1);
    const adjustedDenominator = index === 4 ? 17.5 : denominator

    const xAngle = -Math.sin(i / adjustedDenominator) * radius
    const yAngle = -Math.cos(i / adjustedDenominator) * radius

    const x = xAngle
    const y = yAngle
    const z = 0

    return new THREE.Vector3(x, y, z)
  })
  // const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const curve = new THREE.CatmullRomCurve3(points, false)
  // const curvePath = curve.getPoints(500)
  // const geometry = new THREE.BufferGeometry().setFromPoints(curvePath)
  const geometry = new THREE.TubeGeometry(curve, 100, 0.125, 4, false)
  geometry.rotateZ(-Math.PI * sliceOfPi)
  geometry.rotateX(-Math.PI)
  return geometry
}
