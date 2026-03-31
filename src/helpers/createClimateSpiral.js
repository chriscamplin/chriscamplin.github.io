import * as THREE from 'three'

export const MONTHS = [
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

export const CLIMATE_SPIRAL_DOMAIN = [-1, 1.5]
export const CLIMATE_SPIRAL_RANGE = [2, 460 / 12 - 30]
export const CLIMATE_SPIRAL_Z_STEP = 0.01
export const CLIMATE_SPIRAL_ANGLE_OFFSET = (Math.PI * 2) / MONTHS.length
export const SEA_ICE_SPIRAL_RANGE = [2.8, 10.4]
export const SEA_ICE_SPIRAL_Z_STEP = 0.045

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function mapValue(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) {
    return outMin
  }

  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export function createLinearScale(domainMin, domainMax, rangeMin, rangeMax) {
  return (value) => mapValue(value, domainMin, domainMax, rangeMin, rangeMax)
}

export function createRadialScale(domainMin, domainMax, rangeMin, rangeMax) {
  const startSquared = rangeMin * rangeMin
  const endSquared = rangeMax * rangeMax

  return (value) => {
    const t = clamp(mapValue(value, domainMin, domainMax, 0, 1), 0, 1)
    return Math.sqrt(startSquared + (endSquared - startSquared) * t)
  }
}

export function createValueScale({
  domain,
  range,
  scaleType = 'radial',
}) {
  const [domainMin, domainMax] = domain
  const [rangeMin, rangeMax] = range

  if (scaleType === 'linear') {
    return createLinearScale(domainMin, domainMax, rangeMin, rangeMax)
  }

  return createRadialScale(domainMin, domainMax, rangeMin, rangeMax)
}

export function createSpiralMapper({
  domain,
  range,
  scaleType = 'radial',
  angleOffset = 0,
  zStep = 0.025,
  centerZ = true,
  months = MONTHS,
}) {
  const angleStep = (Math.PI * 2) / months.length
  const valueToRadius = createValueScale({
    domain,
    range,
    scaleType,
  })

  const zAtIndex = (index, totalPoints) => {
    const totalDepth = centerZ ? Math.max(totalPoints - 1, 0) * zStep : 0
    return index * zStep - totalDepth * 0.5
  }

  return {
    domain,
    range,
    scaleType,
    angleOffset,
    angleStep,
    zStep,
    centerZ,
    months,
    valueToRadius,
    angleAtMonth: (monthIndex) => angleOffset + monthIndex * angleStep,
    zAtIndex,
    pointAt(value, index, totalPoints) {
      const angle = angleOffset + index * angleStep
      const radius = valueToRadius(value)
      const x = Math.sin(angle) * radius
      const y = Math.cos(angle) * radius
      const z = zAtIndex(index, totalPoints)

      return new THREE.Vector3(x, y, z)
    },
    pointAtAngle(value, angle, z = 0) {
      const radius = valueToRadius(value)

      return new THREE.Vector3(
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        z
      )
    },
  }
}

function decorateSpiralGeometry(geometry, distanceRange) {
  const position = geometry.getAttribute('position')
  const count = position.count
  const gradientPosition = new Float32Array(count)
  const distance = new Float32Array(count)

  let minRadius = Number.POSITIVE_INFINITY
  let maxRadius = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY
  const radii = new Array(count)

  for (let index = 0; index < count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    const z = position.getZ(index)
    const radius = Math.sqrt(x * x + y * y)

    radii[index] = radius
    minRadius = Math.min(minRadius, radius)
    maxRadius = Math.max(maxRadius, radius)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  const [distanceMin, distanceMax] = distanceRange ?? [minZ, maxZ]

  for (let index = 0; index < count; index += 1) {
    gradientPosition[index] = mapValue(
      radii[index],
      minRadius,
      maxRadius,
      0,
      1
    )
    distance[index] = mapValue(
      position.getZ(index),
      distanceMin,
      distanceMax,
      0,
      1
    )
  }

  geometry.setAttribute(
    'gradientPosition',
    new THREE.BufferAttribute(gradientPosition, 1)
  )
  geometry.setAttribute('distance', new THREE.BufferAttribute(distance, 1))

  return geometry
}

export function buildSpiralGeometry({
  values,
  domain,
  range,
  mapper,
  scaleType = 'radial',
  angleOffset = 0,
  zStep = 0.025,
  centerZ = true,
  tubeRadius = 0.16,
  tubularSegments,
  radialSegments = 18,
  curveType = 'catmullrom',
  curveTension = 0.4,
  pointPrecision,
  distanceRange,
}) {
  if (!values || values.length < 2) {
    return null
  }

  const spiralMapper =
    mapper ??
    createSpiralMapper({
      domain,
      range,
      scaleType,
      angleOffset,
      zStep,
      centerZ,
    })

  const points = values.map((value, index) => {
    const point = spiralMapper.pointAt(value, index, values.length)

    if (typeof pointPrecision !== 'number') {
      return point
    }

    return new THREE.Vector3(
      Number(point.x.toFixed(pointPrecision)),
      Number(point.y.toFixed(pointPrecision)),
      Number(point.z.toFixed(pointPrecision))
    )
  })

  const curve = new THREE.CatmullRomCurve3(points, false, curveType, curveTension)
  const geometry = new THREE.TubeGeometry(
    curve,
    tubularSegments ?? Math.max(500, values.length * 10),
    tubeRadius,
    radialSegments,
    false
  )

  return decorateSpiralGeometry(geometry, distanceRange)
}

export function createCircularAxisGeometry({
  radius,
  angleOffset = 0,
  gapAngle = 0,
  tubeRadius = 0.125,
  segments = 120,
  radialSegments = 6,
}) {
  const safeRadius = Math.abs(radius)
  const startAngle = angleOffset + gapAngle * 0.5
  const endAngle = angleOffset + Math.PI * 2 - gapAngle * 0.5
  const points = Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments
    const angle = THREE.MathUtils.lerp(startAngle, endAngle, t)

    return new THREE.Vector3(
      Math.sin(angle) * safeRadius,
      Math.cos(angle) * safeRadius,
      0
    )
  })

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)

  return new THREE.TubeGeometry(
    curve,
    segments * 2,
    tubeRadius,
    radialSegments,
    false
  )
}

export function getSpiralMeshTransform({
  geometry,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  axisOuterRadius = 9,
  axisClearance = 0.35,
}) {
  if (!geometry) {
    const adjustedScale = [...scale]
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0, -axisClearance),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...adjustedScale)
    )

    return {
      adjustedScale,
      zOffset: -axisClearance,
      matrix,
      transformedBox: null,
    }
  }

  const position = geometry.getAttribute('position')
  let maxRadius = 0

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const y = position.getY(index)
    maxRadius = Math.max(maxRadius, Math.sqrt(x * x + y * y))
  }

  const requestedScale = scale[0] ?? 1
  const fittedScaleFactor =
    maxRadius > 0
      ? Math.min(1, axisOuterRadius / (maxRadius * requestedScale))
      : 1

  const adjustedScale = scale.map((value) => value * fittedScaleFactor)
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation))
  geometry.computeBoundingBox()
  const transformedWithoutOffset = geometry.boundingBox
    .clone()
    .applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0, 0),
        quaternion,
        new THREE.Vector3(...adjustedScale)
      )
    )
  const zOffset = -transformedWithoutOffset.max.z - axisClearance
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(0, 0, zOffset),
    quaternion,
    new THREE.Vector3(...adjustedScale)
  )

  return {
    adjustedScale,
    zOffset,
    matrix,
    transformedBox: geometry.boundingBox.clone().applyMatrix4(matrix),
  }
}

export function projectSpiralPoint(point, transform) {
  if (!transform?.matrix) {
    return point.clone()
  }

  return point.clone().applyMatrix4(transform.matrix)
}

export default function createClimateSpiral(rows) {
  if (!rows || rows.length === 0) {
    return {
      geometry: null,
      months: MONTHS,
      monthlyData: [],
      mapper: createSpiralMapper({
        domain: CLIMATE_SPIRAL_DOMAIN,
        range: CLIMATE_SPIRAL_RANGE,
        scaleType: 'linear',
        angleOffset: CLIMATE_SPIRAL_ANGLE_OFFSET,
        zStep: CLIMATE_SPIRAL_Z_STEP,
        centerZ: false,
      }),
    }
  }

  const orderedMonthlyData = rows
    .slice()
    .reverse()
    .flatMap((row) =>
      MONTHS.map((month, monthIndex) => {
        const value = row[month]

        if (typeof value !== 'number' || Number.isNaN(value)) {
          return null
        }

        return {
          year: Number(row.Year),
          month,
          monthIndex,
          value,
        }
      }).filter(Boolean)
    )

  if (orderedMonthlyData.length < 2) {
    return {
      geometry: null,
      months: MONTHS,
      monthlyData: orderedMonthlyData,
      mapper: createSpiralMapper({
        domain: CLIMATE_SPIRAL_DOMAIN,
        range: CLIMATE_SPIRAL_RANGE,
        scaleType: 'linear',
        angleOffset: CLIMATE_SPIRAL_ANGLE_OFFSET,
        zStep: CLIMATE_SPIRAL_Z_STEP,
        centerZ: false,
      }),
    }
  }

  const mapper = createSpiralMapper({
    domain: CLIMATE_SPIRAL_DOMAIN,
    range: CLIMATE_SPIRAL_RANGE,
    scaleType: 'linear',
    angleOffset: CLIMATE_SPIRAL_ANGLE_OFFSET,
    zStep: CLIMATE_SPIRAL_Z_STEP,
    centerZ: false,
  })

  const geometry = buildSpiralGeometry({
    values: orderedMonthlyData.map((entry) => entry.value),
    mapper,
    tubeRadius: 0.115,
    tubularSegments: 15000,
    radialSegments: 8,
    curveType: 'centripetal',
    curveTension: 0.5,
    pointPrecision: 3,
  })

  return {
    geometry,
    months: MONTHS,
    monthlyData: orderedMonthlyData,
    mapper,
  }
}
