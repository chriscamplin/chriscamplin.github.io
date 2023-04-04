import { useEffect, useState } from 'react'
// import { max, min } from 'd3-array'
import { scaleRadial } from 'd3-scale'
import { parse } from 'papaparse'
import * as THREE from 'three'

import { months } from '@/lib/constants'

function mapToRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}
// ['/data/sea-ice-index/', 'extent_v3.0.csv', 12]
const useFetchSeaIceData = (path) => {
  const [geometry, setGeometry] = useState()

  useEffect(() => {
    if (path.includes('undefined') || path.includes(' ')) return
    const arr = [...new Array(path[2])].fill('')

    const parseFiles = () => {
      const filesData = []
      Promise.all(
        [...arr].map(
          (_, i) =>
            new Promise((resolve, reject) => {
              parse(`${path[0]}${i + 1}_${path[1]}`, {
                download: true,
                header: true,
                skipEmptyLines: true,
                transform(value) {
                  return Number.isNaN(Number(value)) ? value : Number(value)
                },
                complete: (results) => resolve(results), // Resolve each promise
                error: reject,
              })
            })
        )
      )
        .then((results) => {
          results.forEach((result, index) => {
            filesData.push({ [months[index]]: result.data })
          })

          const dataStructure = filesData[0]['Jan'].reduce(
            (acc, curr) => ({
              ...acc,
              [curr['year']]: filesData.map((month, j) =>
                filesData[j][Object.keys(month)[0]].find(
                  (obj) => obj.year === curr['year']
                )
              ),
            }),
            []
          )
          const flattenDataMonthly = []
          Object.keys(dataStructure).forEach((key) => {
            dataStructure[key].forEach((datum) => {
              flattenDataMonthly.push(datum)
            })
          })
          const r = 390
          // create a range of axis angles //
          // X scale

          // xyScale for the spiral positions
          const xyScale = scaleRadial()
            .domain([-1, 1.5])
            .range([-2, r / 12 - 30])

          const radians = Math.PI * 2
          const step = radians / 12

          const circles = []
          for (let i = 0; i < flattenDataMonthly.length - 10; i += 1) {
            // const { extent } = flattenDataMonthly[i]
            if (!flattenDataMonthly[i]) break

            circles.push(flattenDataMonthly[i][' extent'])
          }
          // console.log({ circles })

          // console.log({ dataCurves })
          //   console.log(min(circles), max(circles), circles)

          const points = []
          for (let i = 0; i < flattenDataMonthly.length - 10; i += 1) {
            // const colorScale = scale(Mean, min.Mean, max.Mean, 0, 1);
            if (!flattenDataMonthly[i]) break
            const xAngle = Math.sin((i + 1) * step)
            const yAngle = Math.cos((i + 1) * step)

            const x = xyScale(flattenDataMonthly[i][' extent']) * xAngle
            const y = xyScale(flattenDataMonthly[i][' extent']) * yAngle
            const z = i * 0.02
            const vector = new THREE.Vector3(
              Number(x.toFixed(3)),
              Number(y.toFixed(3)),
              Number(z.toFixed(3))
            )

            points.push(vector)
          }
          const curve = new THREE.CatmullRomCurve3(points, false)
          // console.log({ curve })
          // const curvePath = curve.getPoints(500)
          // const geometry = new THREE.BufferGeometry().setFromPoints(curvePath)
          const geometry = new THREE.TubeGeometry(curve, 15000, 0.115, 8, false)
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

          setGeometry(geometry) // now since .then() excutes after all promises are resolved, filesData contains all the parsed files.
        })
        .catch((err) => console.log('Something went wrong:', err))
    }
    parseFiles()
  }, [])
  // 042270
  //   console.log({ rows: rows[0] }, rows.length)
  return { geometry }
}

export default useFetchSeaIceData
