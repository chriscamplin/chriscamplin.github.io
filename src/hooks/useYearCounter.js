import { useEffect, useState } from 'react'

export default function useYearCounter() {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    if (counter > 142) return

    const timeout = setTimeout(() => {
      setCounter(counter + 1)
    }, 100)
    // time = easeInOutQuad(counter, minTime, maxTime, diff)

    if (counter > 142) {
      return () => {
        clearTimeout(timeout)
      }
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [counter])

  return { counter }
}
