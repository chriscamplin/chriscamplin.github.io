import { useEffect } from 'react'
import { Text } from '@react-three/drei'
import { interpolateRdBu } from 'd3-scale-chromatic'

import useYearCounter from '@/hooks/useYearCounter'

import { mapValue } from '@/helpers/mapValue'

const YearCounter = ({ rows, textScale }) => {
  const { counter } = useYearCounter()
  const av = rows[counter]?.average ?? 1
  console.log({ counter })
  useEffect(() => {
    console.log('yearCounter', { counter })
  }, [counter])
  return (
    <Text
      font={'/fonts/GT-Zirkon-Bold.woff'}
      scale={[textScale * 2.5, textScale * 2.5, textScale * 2.5]}
      color={interpolateRdBu(mapValue(av, -1, 1.25, 1, 0))}
    >
      {counter + 1880}
    </Text>
  )
}

export default YearCounter
