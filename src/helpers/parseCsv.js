export function parseCsvText(text, { skipLines = 0 } = {}) {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)

  const headerLine = lines[skipLines]

  if (!headerLine) {
    return []
  }

  const headers = headerLine.split(',').map((header) => header.trim())

  return lines.slice(skipLines + 1).map((line) => {
    const columns = line.split(',')

    return headers.reduce((row, header, index) => {
      const rawValue = columns[index] ?? ''
      const trimmedValue = rawValue.trim()

      if (trimmedValue === '') {
        row[header] = null
        return row
      }

      if (trimmedValue === '***') {
        row[header] = null
        return row
      }

      const numberValue = Number(trimmedValue)
      row[header] = Number.isNaN(numberValue) ? trimmedValue : numberValue

      return row
    }, {})
  })
}
