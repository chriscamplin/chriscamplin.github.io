import { Text } from '@react-three/drei'

const FONT_URL = '/fonts/TitilliumWeb-Bold.ttf'

const YearCounter = ({
  label,
  detail,
  textScale = 0.52,
  color = '#ffffff',
}) => {
  if (!label) {
    return null
  }

  return (
    <group position={[0, -0.5, 0.3]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[8.4, detail ? 2.7 : 1.9]} />
        <meshBasicMaterial color='#031019' transparent opacity={0.48} />
      </mesh>

      <Text
        font={FONT_URL}
        scale={[textScale * 2.4, textScale * 2.4, textScale * 2.4]}
        color={color}
        anchorX='center'
        anchorY='middle'
        material-toneMapped={false}
        material-fog={false}
      >
        {label}
      </Text>

      {detail && (
        <Text
          font={FONT_URL}
          scale={[textScale * 0.65, textScale * 0.65, textScale * 0.65]}
          color='#dbeef4'
          position={[0, -1.05, 0.01]}
          anchorX='center'
          anchorY='middle'
          maxWidth={9}
          material-toneMapped={false}
          material-fog={false}
        >
          {detail}
        </Text>
      )}
    </group>
  )
}

export default YearCounter
