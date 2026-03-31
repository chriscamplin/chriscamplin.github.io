import { Text } from '@react-three/drei'

const FONT_URL = '/fonts/TitilliumWeb-Bold.ttf'
const LABEL_RENDER_ORDER = 21

const Months = ({
  months,
  textScale = 0.45,
  radius = 11.4,
  angleOffset = 0,
}) =>
  months.map((month, i) => {
    const angle = angleOffset + (Math.PI * 2 * i) / months.length
    const x = Math.sin(angle) * radius
    const y = Math.cos(angle) * radius

    return (
      <group key={month}>
        <Text
          font={FONT_URL}
          color='#dbeef4'
          scale={[textScale, textScale, textScale]}
          position={[x, y, 0]}
          anchorX='center'
          anchorY='middle'
          renderOrder={LABEL_RENDER_ORDER}
          material-toneMapped={false}
          material-fog={false}
          material-depthTest={false}
          material-depthWrite={false}
        >
          {month}
        </Text>
      </group>
    )
  })

export default Months
