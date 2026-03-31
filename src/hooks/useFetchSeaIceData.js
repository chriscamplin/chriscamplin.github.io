import { useEffect, useState } from 'react'
import {
  MONTHS,
  buildSpiralGeometry,
  createSpiralMapper,
  SEA_ICE_SPIRAL_RANGE,
  SEA_ICE_SPIRAL_Z_STEP,
} from '../helpers/createClimateSpiral'
import { parseCsvText } from '../helpers/parseCsv'

const useFetchSeaIceData = (paths) => {
  const [geometry, setGeometry] = useState()
  const [yearlyData, setYearlyData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [domain, setDomain] = useState([0, 1])
  const [mapper, setMapper] = useState(
    createSpiralMapper({
      domain: [0, 1],
      range: SEA_ICE_SPIRAL_RANGE,
      zStep: SEA_ICE_SPIRAL_Z_STEP,
    })
  )

  useEffect(() => {
    if (!paths || paths.length === 0) {
      setGeometry(undefined)
      setYearlyData([])
      setMonthlyData([])
      return
    }

    let cancelled = false

    async function parseFiles() {
      const monthlyFiles = await Promise.all(
        paths.map(async (path) => {
          const response = await fetch(path)
          const csvText = await response.text()
          return parseCsvText(csvText)
        })
      )

      const byYear = new Map()

      monthlyFiles.forEach((rows, monthIndex) => {
        rows.forEach((row) => {
          const year = Number(row.year)
          const extent = Number(row.extent)

          if (Number.isNaN(year) || Number.isNaN(extent)) {
            return
          }

          if (!byYear.has(year)) {
            byYear.set(year, [])
          }

          byYear.get(year).push({
            year,
            month: MONTHS[monthIndex],
            monthIndex,
            extent,
          })
        })
      })

      const years = [...byYear.keys()].sort((a, b) => a - b)
      const monthlyData = years.flatMap((year) =>
        byYear
          .get(year)
          .sort((a, b) => a.monthIndex - b.monthIndex)
      )

      const extents = monthlyData.map((entry) => entry.extent)
      const minExtent = Math.min(...extents)
      const maxExtent = Math.max(...extents)
      const nextMapper = createSpiralMapper({
        domain: [minExtent, maxExtent],
        range: SEA_ICE_SPIRAL_RANGE,
        zStep: SEA_ICE_SPIRAL_Z_STEP,
      })

      const nextGeometry = buildSpiralGeometry({
        values: extents,
        mapper: nextMapper,
        tubeRadius: 0.16,
      })

      const nextYearlyData = years.map((year) => {
        const entries = byYear
          .get(year)
          .sort((a, b) => a.monthIndex - b.monthIndex)
        const values = entries.map((entry) => entry.extent)
        const averageExtent =
          values.reduce((sum, value) => sum + value, 0) / values.length
        const minimumExtent = Math.min(...values)

        return {
          year,
          averageExtent,
          minimumExtent,
        }
      })

      if (!cancelled) {
        setGeometry(nextGeometry)
        setYearlyData(nextYearlyData)
        setMonthlyData(monthlyData)
        setDomain([minExtent, maxExtent])
        setMapper(nextMapper)
      }
    }

    parseFiles().catch((error) => {
      console.error('Failed to fetch sea ice CSV data', error)
      if (!cancelled) {
        setGeometry(undefined)
        setYearlyData([])
        setMonthlyData([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [paths])

  return { geometry, yearlyData, monthlyData, domain, mapper }
}

export default useFetchSeaIceData
