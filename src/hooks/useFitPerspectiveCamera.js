import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function useFitPerspectiveCamera(
  targetRef,
  { margin = 1.18, damping = 4, minDistance = 18 } = {}
) {
  const { camera, size } = useThree()

  const box = useMemo(() => new THREE.Box3(), [])
  const center = useMemo(() => new THREE.Vector3(), [])
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const boxSize = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const target = targetRef.current

    if (!target || !camera.isPerspectiveCamera) {
      return
    }

    box.setFromObject(target)

    if (box.isEmpty()) {
      return
    }

    box.getCenter(center)
    box.getSize(boxSize)

    const fov = THREE.MathUtils.degToRad(camera.fov)
    const aspect = size.width / Math.max(size.height, 1)
    const fitHeightDistance = boxSize.y / (2 * Math.tan(fov / 2))
    const fitWidthDistance = boxSize.x / (2 * Math.tan(fov / 2) * aspect)
    const distance =
      Math.max(minDistance, fitHeightDistance, fitWidthDistance) * margin

    targetPosition.set(center.x, center.y, center.z + distance)

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetPosition.x,
      damping,
      delta
    )
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetPosition.y,
      damping,
      delta
    )
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetPosition.z,
      damping,
      delta
    )
    camera.lookAt(center)
    camera.updateProjectionMatrix()
  })
}
