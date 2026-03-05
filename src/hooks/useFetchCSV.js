import { useEffect, useState } from 'react'
// import { max } from 'd3-array'
import { parse } from 'papaparse'

const useFetchCSV = (path) => {
  const [rows, setRows] = useState([])

  useEffect(() => {
    if (path.includes('undefined') || path.includes(' ')) return

    // if this is too large could stream instead?
    // https://stackoverflow.com/questions/60413948/reading-large-csv-file-on-a-javascript-frontend-application
    async function getData() {
      parse(path, {
        download: true,
        header: true,
        skipEmptyLines: true,
        transform(value) {
          return Number.isNaN(Number(value)) ? value : Number(value)
        },
        complete(results) {
          // console.log({ res: results?.data });
          const calcAv = results?.data.map((row) => {
            const keys = ['Year', 'D-N', 'DJF', 'J-D', 'JJA']
            const average =
              Object.keys(row)
                .filter((key) => !keys.includes(key))
                .reduce((acc, curr) => acc + row[curr], 0) / 12

            return {
              ...row,
              average,
            }
          })
          console.log({ calcAv })
          setRows(calcAv)
        },
      })
    }
    getData().catch(console.error)
  }, [path])

  return { rows }
}

export default useFetchCSV
