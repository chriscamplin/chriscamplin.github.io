import { useEffect, useState } from 'react'

export default function useYearCounter({
  total = 1,
  intervalMs = 160,
  loop = false,
} = {}) {
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    if (total <= 1) {
      setCounter(0)
      return undefined
    }

    const timeout = setTimeout(() => {
      setCounter((current) => {
        if (current >= total - 1) {
          return loop ? 0 : current
        }

        return current + 1
      })
    }, intervalMs)

    if (!loop && counter >= total - 1) {
      clearTimeout(timeout)
      return undefined
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [counter, intervalMs, loop, total])

  useEffect(() => {
    setCounter(0)
  }, [total])

  return {
    counter,
    progress: total > 1 ? counter / (total - 1) : 1,
    isComplete: total > 1 ? counter >= total - 1 : true,
    reset() {
      setCounter(0)
    },
  }
}
