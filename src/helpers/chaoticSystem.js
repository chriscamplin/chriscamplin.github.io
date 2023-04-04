import * as THREE from 'three'

export default function chaoticSystem(
  a = 40.0,
  b = 0.833,
  c = 20.0,
  d = 0.5,
  e = 0.65
) {
  const arrayCurve = []

  let x = 0.001
  let y = 0.001
  let z = 0.001
  const dt = 0.001
  for (let i = 0; i < 200000; i += 3) {
    // console.log(x && y && z && { x, y, z })
    let x1 = a * (y - x) + d * x * z
    let y1 = c * y - x * z
    let z1 = b * z + x * y - e * x * x

    x1 *= dt
    y1 *= dt
    z1 *= dt

    x += x1
    y += y1
    z += z1
    arrayCurve.push(new THREE.Vector3(x, y, z).multiplyScalar(3))
  }

  return arrayCurve
}
