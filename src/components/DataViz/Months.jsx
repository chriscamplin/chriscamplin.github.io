import { Text } from '@react-three/drei'

const Months = ({ months, textScale }) =>
  months.map((month, i) => {
    const xAngle = Math.sin(i / 2) * 9 * 1.185
    const yAngle = Math.cos(i / 2) * 9 * 1.185

    const x = xAngle
    const y = yAngle

    return (
      <group key={Math.random()} rotation={[0, 0, -Math.PI * 0.125]}>
        <Text
          font={'/fonts/GT-Zirkon-Bold.woff'}
          color='white'
          rotation={[0, 0, Math.PI * 0.125]}
          scale={[textScale * 1.5, textScale * 1.5, textScale * 1.5]}
          position={[x, y, 0]}
        >
          {month}
        </Text>
      </group>
    )
  })

export default Months
