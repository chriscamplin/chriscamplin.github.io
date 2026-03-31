import { useEffect, useState } from 'react'

import { parseCsvText } from '../helpers/parseCsv'

const useFetchCSV = (path, options = {}) => {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (!path) {
      setRows([])
      return
    }

    let cancelled = false

    async function getData() {
      const response = await fetch(path)
      const csvText = await response.text()
      const parsedRows = parseCsvText(csvText, options)
      const rowsWithAverage = parsedRows.map((row) => {
        const monthKeys = [
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

        const numericValues = monthKeys
          .map((month) => row[month])
          .filter((value) => typeof value === 'number' && !Number.isNaN(value))

        const average =
          numericValues.length > 0
            ? numericValues.reduce((sum, value) => sum + value, 0) /
              numericValues.length
            : null

        return {
          ...row,
          average,
        }
      })

      if (!cancelled) {
        setRows(rowsWithAverage)
      }
    }

    getData().catch((error) => {
      console.error('Failed to fetch CSV data', error)
      if (!cancelled) {
        setRows([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [options.skipLines, path])

  return { rows }
}

export default useFetchCSV
